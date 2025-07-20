import type { Request, Response } from 'express';
import { chairService } from '@/modules/chair/chair.service';
import type { ChairInput } from '@/modules/chair/types';

export const chairController = {
  create: async (req: Request<{}, {}, ChairInput>, res: Response) => {
    const result = await chairService.create(req.body);
    return res.status(201).json(result);
  },

  getAll: async (_req: Request, res: Response) => {
    const result = await chairService.getAll();
    return res.json(result);
  },

  getById: async (req: Request<{ id: string }>, res: Response) => {
    const id = Number(req.params.id);
    const result = await chairService.getById(id);
    return res.json(result);
  },

  update: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }
    const updated = await chairService.update(id, req.body);
    return res.json(updated);
  },

  delete: async (req: Request<{ id: string }>, res: Response) => {
    const id = Number(req.params.id);
    await chairService.delete(id);
    return res.status(204).send();
  },
};
