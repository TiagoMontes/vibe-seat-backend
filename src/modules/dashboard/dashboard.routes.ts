import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticateJWT } from '@/middleware/authMiddleware';

const router = Router();

router.use(authenticateJWT);

// GET /dashboard
router.get('/', dashboardController.getDashboardData);

export const dashboardRoutes = router;
