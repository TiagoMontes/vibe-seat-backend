import type { Request, Response, NextFunction } from 'express';
import { appointmentService } from './appointment.service';
import type { AppointmentInput } from './types';

export const appointmentController = {
  // POST /agendamentos
  create: async (
    req: Request<{}, {}, AppointmentInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = (req as any).user;
      const appt = await appointmentService.create(user.id, req.body);
      return res.status(201).json(appt);
    } catch (err) {
      next(err);
    }
  },

  // GET /agendamentos
  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (_req as any).user;
      const list = await appointmentService.getAll(user.id, user.role);
      return res.json(list);
    } catch (err) {
      next(err);
    }
  },

  // PATCH /agendamentos/:id/cancel
  cancel: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = (req as any).user;
      const result = await appointmentService.cancel(
        Number(req.params.id),
        user.id,
        user.role
      );
      return res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // PATCH /agendamentos/:id/confirm
  confirm: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await appointmentService.confirm(Number(req.params.id));
      return res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
