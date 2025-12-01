import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { TriageController } from '../controllers/triageController';
import { upload } from '../middleware/upload';

const router = Router();
const triageController = new TriageController();

// All routes require authentication
router.use(authenticate);

// Create new triage assessment
router.post('/', 
  requireRole('doctor', 'nurse', 'paramedic'),
  upload.single('video'),
  triageController.createTriage.bind(triageController)
);

// Get triage by ID
router.get('/:id', triageController.getTriageById.bind(triageController));

// Get all triages with filters
router.get('/', triageController.getTriages.bind(triageController));

// Update triage status
router.patch('/:id/status', 
  requireRole('doctor', 'nurse'),
  triageController.updateStatus.bind(triageController)
);

// Get triage statistics
router.get('/stats/overview', 
  requireRole('doctor', 'nurse', 'admin'),
  triageController.getStatistics.bind(triageController)
);

export default router;

