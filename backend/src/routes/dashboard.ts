import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { DashboardController } from '../controllers/dashboardController';

const router = Router();
const dashboardController = new DashboardController();

router.use(authenticate);

router.get('/overview', dashboardController.getOverview.bind(dashboardController));
router.get('/realtime', dashboardController.getRealTimeData.bind(dashboardController));

export default router;

