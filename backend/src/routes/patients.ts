import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { PatientController } from '../controllers/patientController';

const router = Router();
const patientController = new PatientController();

router.use(authenticate);

router.post('/', 
  requireRole('doctor', 'nurse', 'admin'),
  patientController.createPatient.bind(patientController)
);

router.get('/:id', patientController.getPatientById.bind(patientController));
router.get('/', patientController.getPatients.bind(patientController));
router.patch('/:id', 
  requireRole('doctor', 'nurse', 'admin'),
  patientController.updatePatient.bind(patientController)
);

export default router;

