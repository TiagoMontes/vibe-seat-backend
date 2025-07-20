import { Router } from 'express';
import { approvalController } from '@/modules/approval/approval.controller';
import { authenticateJWT, isAdmin } from '@/middleware/authMiddleware';

const router = Router();

router.use(authenticateJWT, isAdmin);

router.get('/', approvalController.getAllPendingApprovals);
router.get('/:id', approvalController.getById);
router.patch('/:id', isAdmin, approvalController.updateStatus);

export const approvalRoutes = router;
