import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

export class AdminController {
  async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { role, facilityId, page = '1', limit = '50' } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const conditions: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (role) {
        conditions.push(`role = $${paramCount++}`);
        params.push(role);
      }

      if (facilityId) {
        conditions.push(`facility_id = $${paramCount++}`);
        params.push(facilityId);
      }

      const whereClause = conditions.length > 0 
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

      const result = await query(
        `SELECT id, email, name, role, facility_id, is_active, created_at
         FROM users
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramCount++} OFFSET $${paramCount++}`,
        [...params, parseInt(limit as string), offset]
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { action, userId, startDate, endDate, page = '1', limit = '100' } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const conditions: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (action) {
        conditions.push(`action = $${paramCount++}`);
        params.push(action);
      }

      if (userId) {
        conditions.push(`user_id = $${paramCount++}`);
        params.push(userId);
      }

      if (startDate) {
        conditions.push(`created_at >= $${paramCount++}`);
        params.push(startDate);
      }

      if (endDate) {
        conditions.push(`created_at <= $${paramCount++}`);
        params.push(endDate);
      }

      const whereClause = conditions.length > 0 
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

      const result = await query(
        `SELECT a.*, u.name as user_name, u.email as user_email
         FROM audit_logs a
         LEFT JOIN users u ON a.user_id = u.id
         ${whereClause}
         ORDER BY a.created_at DESC
         LIMIT $${paramCount++} OFFSET $${paramCount++}`,
        [...params, parseInt(limit as string), offset]
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSystemStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await query(
        `SELECT 
           (SELECT COUNT(*) FROM users) as total_users,
           (SELECT COUNT(*) FROM patients) as total_patients,
           (SELECT COUNT(*) FROM triage_assessments) as total_triages,
           (SELECT COUNT(*) FROM triage_assessments WHERE status = 'pending') as pending_triages,
           (SELECT COUNT(*) FROM triage_assessments WHERE created_at >= CURRENT_DATE) as triages_today`
      );

      res.json({
        success: true,
        data: stats.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
}

