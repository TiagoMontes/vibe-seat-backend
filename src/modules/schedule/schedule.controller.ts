import type { Request, Response, NextFunction } from 'express';
import type {
  ScheduleConfigInput,
  ScheduleConfigUpdateInput,
} from '@/modules/schedule/types';
import { scheduleService } from '@/modules/schedule/schedule.service';

export const scheduleController = {
  create: async (
    req: Request<{}, {}, ScheduleConfigInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const created = await scheduleService.create(req.body);
      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },

  get: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const config = await scheduleService.get();
      return res.json(config);
    } catch (err) {
      next(err);
    }
  },

  update: async (
    req: Request<{}, {}, ScheduleConfigUpdateInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const updated = await scheduleService.update(req.body);
      return res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  delete: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      await scheduleService.remove();
      return res.status(200).json({
        message: 'Configuração removida com sucesso',
      });
    } catch (err) {
      next(err);
    }
  },
};
