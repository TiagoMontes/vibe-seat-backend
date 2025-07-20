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

  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await scheduleService.getAll();
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
      const cfg = await scheduleService.getById(Number(req.params.id));
      return res.json(cfg);
    } catch (err) {
      next(err);
    }
  },

  update: async (
    req: Request<{ id: string }, {}, ScheduleConfigUpdateInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const cfg = await scheduleService.update(Number(req.params.id), req.body);
      return res.json(cfg);
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
      await scheduleService.remove(Number(req.params.id));
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
