import type { Request, Response } from 'express';
import type {
  DayOfWeekInput,
  DayOfWeekUpdateInput
} from '@/modules/dayOfWeek/types';
import { dayOfWeekService } from '@/modules/dayOfWeek/dayOfWeek.service';

export const dayOfWeekController = {
  create: async (
    req: Request<{}, {}, DayOfWeekInput>,
    res: Response
  ) => {
    try {
      const created = await dayOfWeekService.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Dia da semana criado com sucesso',
        data: created
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao criar dia da semana',
        error: true
      });
    }
  },

  getAll: async (    
    req: Request,
    res: Response
  ) => {
    try {
      const list = await dayOfWeekService.getAll();
      
      return res.status(200).json({
        success: true,
        message: 'Dias da semana listados com sucesso',
        data: list,
        total: list.length
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        error: true
      });
    }
  },

  getById: async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
          error: true
        });
      }

      const day = await dayOfWeekService.getById(id);
      
      if (!day) {
        return res.status(404).json({
          success: false,
          message: 'Dia da semana não encontrado',
          data: null,
          error: true
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Dia da semana encontrado',
        data: day
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
    req: Request<{ id: string }, {}, DayOfWeekUpdateInput>,
    res: Response
  ) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
          error: true
        });
      }

      const updated = await dayOfWeekService.update(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Dia da semana atualizado com sucesso',
        data: updated
      });
    } catch (err: any) {
      if (err.message === 'Dia da semana não encontrado') {
        return res.status(404).json({
          success: false,
          message: err.message,
          error: true
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao atualizar dia da semana',
        error: true
      });
    }
  },

  delete: async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
          error: true
        });
      }

      await dayOfWeekService.remove(id);
      return res.status(200).json({
        success: true,
        message: 'Dia da semana removido com sucesso',
        deletedId: id
      });
    } catch (err: any) {
      if (err.message === 'Dia da semana não encontrado') {
        return res.status(404).json({
          success: false,
          message: err.message,
          error: true
        });
      }
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro ao remover dia da semana',
        error: true
      });
    }
  },

  deleteMany: async (req: Request<{}, {}, { ids: number[] }>, res: Response) => {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Campo "ids" é obrigatório e deve ser um array não vazio',
          error: true
        });
      }

      await dayOfWeekService.removeMany(ids);
      return res.status(200).json({
        success: true,
        message: 'Dias da semana removidos com sucesso',
        deletedIds: ids,
        count: ids.length
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        error: true
      });
    }
  },
}; 