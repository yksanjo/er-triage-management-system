import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { query } from '../config/database';
import { logger } from '../utils/logger';

export class PatientController {
  async createPatient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, age, gender, dateOfBirth, medicalRecordNumber, allergies, medicalHistory } = req.body;
      const facilityId = req.user!.facilityId;

      if (!name || !age || !gender) {
        throw new AppError('Name, age, and gender are required', 400);
      }

      const result = await query(
        `INSERT INTO patients 
         (name, age, gender, date_of_birth, medical_record_number, allergies, 
          medical_history, facility_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING *`,
        [
          name,
          age,
          gender,
          dateOfBirth || null,
          medicalRecordNumber || null,
          allergies ? JSON.stringify(allergies) : null,
          medicalHistory || null,
          facilityId,
        ]
      );

      logger.info('Patient created', {
        patientId: result.rows[0].id,
        name,
        facilityId,
      });

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await query(
        `SELECT p.*, 
                COUNT(t.id) as triage_count,
                MAX(t.created_at) as last_triage_date
         FROM patients p
         LEFT JOIN triage_assessments t ON p.id = t.patient_id
         WHERE p.id = $1
         GROUP BY p.id`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Patient not found', 404);
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatients(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, page = '1', limit = '50' } = req.query;
      const facilityId = req.user!.facilityId;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      let searchCondition = '';
      const params: any[] = [facilityId];
      let paramCount = 2;

      if (search) {
        searchCondition = `AND (p.name ILIKE $${paramCount} OR p.medical_record_number ILIKE $${paramCount})`;
        params.push(`%${search}%`);
        paramCount++;
      }

      const result = await query(
        `SELECT p.*, 
                COUNT(t.id) as triage_count,
                MAX(t.created_at) as last_triage_date
         FROM patients p
         LEFT JOIN triage_assessments t ON p.id = t.patient_id
         WHERE p.facility_id = $1 ${searchCondition}
         GROUP BY p.id
         ORDER BY p.created_at DESC
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...params, parseInt(limit as string), offset]
      );

      const countResult = await query(
        `SELECT COUNT(*) as total
         FROM patients p
         WHERE p.facility_id = $1 ${searchCondition}`,
        params.slice(0, -2)
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

  async updatePatient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const allowedFields = [
        'name', 'age', 'gender', 'dateOfBirth', 'medicalRecordNumber',
        'allergies', 'medicalHistory'
      ];

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          updateFields.push(`${dbKey} = $${paramCount++}`);
          
          if (key === 'allergies' && value) {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
      }

      if (updateFields.length === 0) {
        throw new AppError('No valid fields to update', 400);
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(id);

      const result = await query(
        `UPDATE patients
         SET ${updateFields.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new AppError('Patient not found', 404);
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
}

