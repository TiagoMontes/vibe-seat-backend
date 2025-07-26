import { Router } from 'express';
import { dayOfWeekController } from '@/modules/dayOfWeek/dayOfWeek.controller';
import { authenticateJWT, isAdmin } from '@/middleware/authMiddleware';

const router = Router();

// Protege todas as rotas: apenas admins podem CRUD de dias da semana
router.use(authenticateJWT, isAdmin);

router.post('/', dayOfWeekController.create);
router.get('/', dayOfWeekController.getAll);
router.delete('/bulk-delete', dayOfWeekController.deleteMany);
router.get('/:id', dayOfWeekController.getById);
router.patch('/:id', dayOfWeekController.update);
router.delete('/:id', dayOfWeekController.delete);

export const dayOfWeekRoutes = router;
