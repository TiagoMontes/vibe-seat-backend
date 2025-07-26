import type { Request, Response } from 'express';
import type {
  ScheduleConfigInput,
  ScheduleConfigUpdateInput,
} from '@/modules/schedule/types';
import { scheduleService } from '@/modules/schedule/schedule.service';

export const scheduleController = {
  create: async (
    req: Request<{}, {}, ScheduleConfigInput>,
    res: Response
  ) => {
    try {
      const created = await scheduleService.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Configuração de agenda criada com sucesso',
        data: created
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao criar configuração de agenda',
        error: true
      });
    }
  },

  get: async (
    req: Request<{ id?: string }>,
    res: Response
  ) => {
    try {
      const config = await scheduleService.get();
      
      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Nenhuma configuração de agenda encontrada',
          data: null,
          error: true
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Configuração de agenda encontrada',
        data: config
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        error: true
      });
    }
  },

  update: async (
    req: Request<{ id: string }, {}, ScheduleConfigUpdateInput>,
    res: Response
  ) => {
    try {
      const { id } = req.params;
      
      // Valida se o ID é 1 (singleton)
      if (id !== '1') {
        return res.status(400).json({
          success: false,
          message: 'ID inválido. A configuração de agenda é um singleton com ID = 1.',
          error: true
        });
      }

      const updated = await scheduleService.update(req.body);
      return res.status(200).json({
        success: true,
        message: 'Configuração de agenda atualizada com sucesso',
        data: updated
      });
    } catch (err: any) {
      if (err.message === 'Nenhuma configuração encontrada para atualizar.') {
        return res.status(404).json({
          success: false,
          message: err.message,
          error: true
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao atualizar configuração de agenda',
        error: true
      });
    }
  },

  delete: async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    try {
      const { id } = req.params;
      
      // Valida se o ID é 1 (singleton)
      if (id !== '1') {
        return res.status(400).json({
          success: false,
          message: 'ID inválido. A configuração de agenda é um singleton com ID = 1.',
          error: true
        });
      }

      await scheduleService.remove();
      return res.status(200).json({
        success: true,
        message: 'Configuração de agenda removida com sucesso'
      });
    } catch (err: any) {
      if (err.message === 'Nenhuma configuração encontrada para deletar.') {
        return res.status(404).json({
          success: false,
          message: err.message,
          error: true
        });
      }
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro ao remover configuração de agenda',
        error: true
      });
    }
  },

  // Novo endpoint para gerenciar dias da semana
  updateDays: async (
    req: Request<{ id: string }, {}, { dayIds: number[] }>,
    res: Response
  ) => {
    try {
      const { id } = req.params;
      const { dayIds } = req.body;
      
      // Valida se o ID é 1 (singleton)
      if (id !== '1') {
        return res.status(400).json({
          success: false,
          message: 'ID inválido. A configuração de agenda é um singleton com ID = 1.',
          error: true
        });
      }

      if (!dayIds || !Array.isArray(dayIds)) {
        return res.status(400).json({
          success: false,
          message: 'dayIds deve ser um array de números',
          error: true
        });
      }

      const updated = await scheduleService.updateDays(dayIds);
      return res.status(200).json({
        success: true,
        message: 'Dias da semana atualizados com sucesso',
        data: updated
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao atualizar dias da semana',
        error: true
      });
    }
  },
};
