import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { VitalSignsController } from '../controllers/vitalSignsController';

const router = Router();
const vitalSignsController = new VitalSignsController();

router.use(authenticate);

router.post('/', vitalSignsController.createVitalSigns.bind(vitalSignsController));
router.get('/:patientId', vitalSignsController.getVitalSignsHistory.bind(vitalSignsController));

export default router;

