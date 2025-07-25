import type { Request, Response, NextFunction } from 'express';
import type {
  DayOfWeekInput,
  DayOfWeekUpdateInput
} from '@/modules/dayOfWeek/types';
import { dayOfWeekService } from '@/modules/dayOfWeek/dayOfWeek.service';

export const dayOfWeekController = {
  create: async (
    req: Request<{}, {}, DayOfWeekInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const created = await dayOfWeekService.create(req.body);
      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },

  getAll: async (    
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const list = await dayOfWeekService.getAll();
      
      return res.json(list);
    } catch (err) {
      next(err);
    }
  },

  getById: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const day = await dayOfWeekService.getById(Number(req.params.id));
      return res.json(day);
    } catch (err) {
      next(err);
    }
  },

  update: async (
    req: Request<{ id: string }, {}, DayOfWeekUpdateInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const updated = await dayOfWeekService.update(Number(req.params.id), req.body);
      return res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  delete: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = Number(req.params.id);
      await dayOfWeekService.remove(id);
      return res.status(200).json({
        message: 'Dia da semana removido com sucesso',
        deletedId: id
      });
    } catch (err) {
      next(err);
    }
  },

  deleteMany: async (req: Request<{}, {}, { ids: number[] }>, res: Response) => {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          message: 'Campo "ids" é obrigatório e deve ser um array não vazio'
        });
      }

      await dayOfWeekService.removeMany(ids);
      return res.status(200).json({ 
        message: 'Dias da semana removidos com sucesso',
        deletedIds: ids,
        count: ids.length
      });
    } catch (error) {
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Erro interno' 
      });
    }
  },
}; 