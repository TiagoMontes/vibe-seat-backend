import { Router } from 'express';
import { appointmentController } from './appointment.controller';
import { authenticateJWT, isAdmin } from '@/middleware/authMiddleware';

const router = Router();

router.use(authenticateJWT);

// Usuário cria e lista os próprios
router.post('/', appointmentController.create);
router.get('/', appointmentController.getAll);

// Cancelamento (usuário ou admin)
router.patch('/:id/cancel', appointmentController.cancel);

// Confirmação de presença (somente admin)
router.patch('/:id/confirm', isAdmin, appointmentController.confirm);

export const appointmentRoutes = router;
