import { Router } from 'express';
import { scheduleController } from '@/modules/schedule/schedule.controller';
import { authenticateJWT, isAdmin } from '@/middleware/authMiddleware';

const router = Router();

// Protege todas as rotas: apenas admins podem CRUD de disponibilidades
router.use(authenticateJWT, isAdmin);

router.post('/', scheduleController.create);
router.get('/', scheduleController.get);
router.get('/:id', scheduleController.get);
router.patch('/:id', scheduleController.update);
router.patch('/:id/days', scheduleController.updateDays);
router.delete('/:id', scheduleController.delete);

export const scheduleRoutes = router;
