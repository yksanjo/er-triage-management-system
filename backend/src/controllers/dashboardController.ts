import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { getCache, setCache } from '../config/redis';

export class DashboardController {
  async getOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const facilityId = req.user!.facilityId;

      // Try cache first
      const cacheKey = `dashboard:overview:${facilityId}`;
      const cached = await getCache(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: JSON.parse(cached),
          cached: true,
        });
      }

      // Get current active triages
      const activeTriages = await query(
        `SELECT COUNT(*) as count
         FROM triage_assessments
         WHERE facility_id = $1 AND status IN ('pending', 'in_progress')`,
        [facilityId]
      );

      // Get triages by level
      const triagesByLevel = await query(
        `SELECT triage_level, COUNT(*) as count
         FROM triage_assessments
         WHERE facility_id = $1 AND status IN ('pending', 'in_progress')
         GROUP BY triage_level`,
        [facilityId]
      );

      // Get today's statistics
      const todayStats = await query(
        `SELECT 
           COUNT(*) as total_today,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_today,
           AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_wait_time
         FROM triage_assessments
         WHERE facility_id = $1 
         AND DATE(created_at) = CURRENT_DATE`,
        [facilityId]
      );

      // Get waiting patients
      const waitingPatients = await query(
        `SELECT t.*, p.name as patient_name, p.age, p.gender
         FROM triage_assessments t
         JOIN patients p ON t.patient_id = p.id
         WHERE t.facility_id = $1 
         AND t.status IN ('pending', 'in_progress')
         ORDER BY t.priority_score DESC, t.created_at ASC
         LIMIT 20`,
        [facilityId]
      );

      const data = {
        activeTriages: parseInt(activeTriages.rows[0].count),
        triagesByLevel: triagesByLevel.rows,
        todayStats: todayStats.rows[0],
        waitingPatients: waitingPatients.rows,
        timestamp: new Date().toISOString(),
      };

      // Cache for 30 seconds
      await setCache(cacheKey, JSON.stringify(data), 30);

      res.json({
        success: true,
        data,
        cached: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRealTimeData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const facilityId = req.user!.facilityId;

      const result = await query(
        `SELECT t.*, p.name as patient_name, p.age, p.gender
         FROM triage_assessments t
         JOIN patients p ON t.patient_id = p.id
         WHERE t.facility_id = $1 
         AND t.status IN ('pending', 'in_progress')
         ORDER BY t.priority_score DESC, t.created_at ASC`,
        [facilityId]
      );

      res.json({
        success: true,
        data: result.rows,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

