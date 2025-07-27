import { Router } from 'express';
import { approvalController } from '@/modules/approval/approval.controller';
import {
  authenticateJWT,
  requireApproved,
  requireAttendant,
} from '@/middleware/authMiddleware';

const router = Router();

// All routes require authentication and approved status
router.use(authenticateJWT, requireApproved);

// Attendants can approve/reject user registrations
router.get('/', requireAttendant, approvalController.getAll);
router.get(
  '/pending',
  requireAttendant,
  approvalController.getAllPendingApprovals
);
router.get('/:id', requireAttendant, approvalController.getById);

// Only admins can approve attendant registrations and grant/revoke attendant permissions
// Attendants can approve regular user registrations
router.patch('/:id', requireAttendant, approvalController.updateStatus);

export const approvalRoutes = router;
