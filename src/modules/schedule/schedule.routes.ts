import { Router } from 'express';
import { scheduleController } from '@/modules/schedule/schedule.controller';
import {
  authenticateJWT,
  requireAdmin,
  requireApproved,
  requireUser,
} from '@/middleware/authMiddleware';

const router = Router();

// All routes require authentication and approved status
router.use(authenticateJWT, requireApproved);

// Only admins can modify schedule configuration
router.post('/', requireAdmin, scheduleController.create);
router.patch('/:id', requireAdmin, scheduleController.update);
router.patch('/:id/days', requireAdmin, scheduleController.updateDays);
router.delete('/:id', requireAdmin, scheduleController.delete);

// Users can view schedule for appointment booking
router.get('/', requireUser, scheduleController.get);
router.get('/:id', requireUser, scheduleController.get);

export const scheduleRoutes = router;
