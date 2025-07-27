import { Router } from 'express';
import { dayOfWeekController } from '@/modules/dayOfWeek/dayOfWeek.controller';
import {
  authenticateJWT,
  requireAdmin,
  requireApproved,
  requireUser,
} from '@/middleware/authMiddleware';

const router = Router();

// All routes require authentication and approved status
router.use(authenticateJWT, requireApproved);

// Only admins can modify days of week
router.post('/', requireAdmin, dayOfWeekController.create);
router.patch('/:id', requireAdmin, dayOfWeekController.update);
router.delete('/bulk-delete', requireAdmin, dayOfWeekController.deleteMany);
router.delete('/:id', requireAdmin, dayOfWeekController.delete);

// Users can view available days for appointment booking
router.get('/', requireUser, dayOfWeekController.getAll);
router.get('/:id', requireUser, dayOfWeekController.getById);

export const dayOfWeekRoutes = router;
