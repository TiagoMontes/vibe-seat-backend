import type { Request, Response } from 'express';
import { dashboardService } from '@/modules/dashboard/dashboard.service';

export const dashboardController = {
  // GET /dashboard
  getDashboardData: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const dashboardData = await dashboardService.getDashboardData(user.id, user.role);
      
      return res.json(dashboardData);
    } catch (error) {
      return res.status(500).json({
        message: 'Erro ao carregar dashboard',
        error: true
      });
    }
  },
}; 