import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { query } from '../config/database';
import { logger } from '../utils/logger';

export class VitalSignsController {
  async createVitalSigns(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { patientId, vitalSigns, source } = req.body;
      const userId = req.user!.id;

      if (!patientId || !vitalSigns) {
        throw new AppError('Patient ID and vital signs are required', 400);
      }

      const result = await query(
        `INSERT INTO vital_signs 
         (patient_id, vital_signs_data, source, recorded_by, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [
          patientId,
          JSON.stringify(vitalSigns),
          source || 'manual',
          userId,
        ]
      );

      logger.info('Vital signs recorded', {
        patientId,
        source,
        recordedBy: userId,
      });

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  async getVitalSignsHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { patientId } = req.params;
      const { limit = '50' } = req.query;

      const result = await query(
        `SELECT * FROM vital_signs
         WHERE patient_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [patientId, parseInt(limit as string)]
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  }
}

