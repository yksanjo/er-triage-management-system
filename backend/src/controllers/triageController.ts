import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { query } from '../config/database';
import { TriageService } from '../services/triageService';
import { logger } from '../utils/logger';
import { io } from '../index';

export class TriageController {
  private triageService: TriageService;

  constructor() {
    this.triageService = new TriageService();
  }

  async createTriage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { patientId, chiefComplaint, additionalNotes } = req.body;
      const videoFile = req.file;
      const userId = req.user!.id;
      const facilityId = req.user!.facilityId;

      if (!patientId) {
        throw new AppError('Patient ID is required', 400);
      }

      if (!chiefComplaint) {
        throw new AppError('Chief complaint is required', 400);
      }

      // Process video and extract vital signs
      let vitalSigns = null;
      if (videoFile) {
        vitalSigns = await this.triageService.processVideoForVitalSigns(
          undefined,
          videoFile.buffer
        );
      }

      // Perform triage assessment
      const triageResult = await this.triageService.performTriageAssessment({
        patientId,
        chiefComplaint,
        additionalNotes,
        vitalSigns,
        assessedBy: userId,
      });

      // Save triage record
      const result = await query(
        `INSERT INTO triage_assessments 
         (patient_id, chief_complaint, vital_signs, triage_level, priority_score, 
          assessment_notes, recommendations, assessed_by, facility_id, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
         RETURNING *`,
        [
          patientId,
          chiefComplaint,
          JSON.stringify(vitalSigns),
          triageResult.level,
          triageResult.priorityScore,
          triageResult.notes,
          JSON.stringify(triageResult.recommendations),
          userId,
          facilityId,
          'pending',
        ]
      );

      const triage = result.rows[0];

      // Emit real-time update
      if (facilityId) {
        io.to(`facility:${facilityId}`).emit('triage:new', {
          id: triage.id,
          patientId,
          level: triageResult.level,
          priorityScore: triageResult.priorityScore,
          timestamp: triage.created_at,
        });
      }

      logger.info('Triage assessment created', {
        triageId: triage.id,
        patientId,
        level: triageResult.level,
        assessedBy: userId,
      });

      res.status(201).json({
        success: true,
        data: {
          ...triage,
          triageResult,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getTriageById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await query(
        `SELECT t.*, p.name as patient_name, p.age, p.gender,
                u.name as assessor_name
         FROM triage_assessments t
         JOIN patients p ON t.patient_id = p.id
         LEFT JOIN users u ON t.assessed_by = u.id
         WHERE t.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Triage assessment not found', 404);
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  async getTriages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        status,
        level,
        patientId,
        startDate,
        endDate,
        page = '1',
        limit = '50',
      } = req.query;
      const facilityId = req.user!.facilityId;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      const conditions: string[] = [`t.facility_id = $1`];
      const params: any[] = [facilityId];
      let paramCount = 2;

      if (status) {
        conditions.push(`t.status = $${paramCount++}`);
        params.push(status);
      }

      if (level) {
        conditions.push(`t.triage_level = $${paramCount++}`);
        params.push(level);
      }

      if (patientId) {
        conditions.push(`t.patient_id = $${paramCount++}`);
        params.push(patientId);
      }

      if (startDate) {
        conditions.push(`t.created_at >= $${paramCount++}`);
        params.push(startDate);
      }

      if (endDate) {
        conditions.push(`t.created_at <= $${paramCount++}`);
        params.push(endDate);
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      const result = await query(
        `SELECT t.*, p.name as patient_name, p.age, p.gender,
                u.name as assessor_name
         FROM triage_assessments t
         JOIN patients p ON t.patient_id = p.id
         LEFT JOIN users u ON t.assessed_by = u.id
         ${whereClause}
         ORDER BY t.priority_score DESC, t.created_at ASC
         LIMIT $${paramCount++} OFFSET $${paramCount++}`,
        [...params, parseInt(limit as string), offset]
      );

      const countResult = await query(
        `SELECT COUNT(*) as total
         FROM triage_assessments t
         ${whereClause}`,
        params
      );

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: parseInt(countResult.rows[0].total),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user!.id;
      const facilityId = req.user!.facilityId;

      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new AppError('Invalid status', 400);
      }

      const result = await query(
        `UPDATE triage_assessments
         SET status = $1, updated_by = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [status, userId, id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Triage assessment not found', 404);
      }

      // Emit real-time update
      if (facilityId) {
        io.to(`facility:${facilityId}`).emit('triage:updated', {
          id,
          status,
          updatedBy: userId,
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const facilityId = req.user!.facilityId;

      const dateFilter = startDate && endDate
        ? `AND created_at BETWEEN $1 AND $2`
        : '';

      const params = startDate && endDate ? [startDate, endDate] : [];

      // Get counts by triage level
      const levelStats = await query(
        `SELECT triage_level, COUNT(*) as count
         FROM triage_assessments
         WHERE facility_id = $${params.length + 1}
         ${dateFilter}
         GROUP BY triage_level`,
        [...params, facilityId]
      );

      // Get counts by status
      const statusStats = await query(
        `SELECT status, COUNT(*) as count
         FROM triage_assessments
         WHERE facility_id = $${params.length + 1}
         ${dateFilter}
         GROUP BY status`,
        [...params, facilityId]
      );

      // Get average wait times
      const waitTimeStats = await query(
        `SELECT 
           AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_wait_seconds,
           MIN(EXTRACT(EPOCH FROM (updated_at - created_at))) as min_wait_seconds,
           MAX(EXTRACT(EPOCH FROM (updated_at - created_at))) as max_wait_seconds
         FROM triage_assessments
         WHERE facility_id = $${params.length + 1}
         AND status = 'completed'
         ${dateFilter}`,
        [...params, facilityId]
      );

      res.json({
        success: true,
        data: {
          byLevel: levelStats.rows,
          byStatus: statusStats.rows,
          waitTimes: waitTimeStats.rows[0],
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

