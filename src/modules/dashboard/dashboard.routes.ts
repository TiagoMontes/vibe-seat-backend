import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import {
  authenticateJWT,
  requireApproved,
  requireAttendant,
} from '@/middleware/authMiddleware';

const router = Router();

// Dashboard requires authentication, approved status and attendant level or higher
router.use(authenticateJWT, requireApproved);

// GET /dashboard - Attendants and admins can view dashboard
router.get('/', requireAttendant, dashboardController.getDashboardData);

export const dashboardRoutes = router;
