import { Router } from 'express';
import { userController } from '@/modules/user/user.controller';
import {
  authenticateJWT,
  requireAdmin,
  requireApproved,
  requireAttendant,
  requireOwnershipOrAdmin,
} from '@/middleware/authMiddleware';

const router = Router();

// Public route for user registration
router.post('/', userController.create);

// Protected routes require authentication and approved status
router.use(authenticateJWT, requireApproved);

// Attendants and admins can view and manage users
router.get('/', requireAttendant, userController.getAll);
router.get('/:id', requireAttendant, userController.getById);

// Users can update their own data, admins can update any user
router.patch('/:id', requireOwnershipOrAdmin, userController.update);

// Only admins can delete users
router.delete('/:id', requireAdmin, userController.delete);

export const userRoutes = router;
