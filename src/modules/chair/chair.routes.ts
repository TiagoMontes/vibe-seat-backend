import { Router } from 'express';
import { chairController } from '@/modules/chair/chair.controller';
import {
  authenticateJWT,
  requireAdmin,
  requireApproved,
  requireAttendant,
  requireUser,
} from '@/middleware/authMiddleware';

const router = Router();

// All chair routes require authentication and approved status
router.use(authenticateJWT, requireApproved);

// Only admins can create, update, delete chairs
router.post('/', requireAdmin, chairController.create);
router.patch('/:id', requireAdmin, chairController.update);
router.delete('/:id', requireAdmin, chairController.delete);

// Only admins can view insights (must come before /:id route)
router.get('/insights', requireAttendant, chairController.getInsights);

// Users can view chairs (for appointment booking)
router.get('/', requireUser, chairController.getAll);
router.get('/:id', requireUser, chairController.getById);

export const chairRoutes = router;
