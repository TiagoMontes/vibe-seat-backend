import type { Request, Response } from 'express';
import { dashboardService } from '@/modules/dashboard/dashboard.service';

export const dashboardController = {
  // GET /dashboard
  getDashboardData: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const dashboardData = await dashboardService.getDashboardData(
        user.id,
        user.role
      );

      return res.status(200).json({
        success: true,
        message: 'Dados do dashboard carregados com sucesso',
        data: dashboardData,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro ao carregar dados do dashboard',
        error: true,
      });
    }
  },
};
