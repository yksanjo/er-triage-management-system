import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { AdminController } from '../controllers/adminController';

const router = Router();
const adminController = new AdminController();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/users', adminController.getUsers.bind(adminController));
router.get('/audit-logs', adminController.getAuditLogs.bind(adminController));
router.get('/system-stats', adminController.getSystemStats.bind(adminController));

export default router;

