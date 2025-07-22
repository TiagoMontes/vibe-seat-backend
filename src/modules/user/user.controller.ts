import type { Request, Response } from 'express';
import { userService } from '@/modules/user/user.service';

export const userController = {
  create: async (req: Request, res: Response) => {
    try {
      const { username, password, roleId } = req.body;
      const user = await userService.create(username, password, roleId);
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  getAll: async (_req: Request, res: Response) => {
    const users = await userService.getAll();
    res.json(users);
  },

  getById: async (req: Request, res: Response) => {
    const user = await userService.getById(Number(req.params.id));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  },

  delete: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await userService.delete(id);
    return res.status(200).json({
      message: 'Usuário excluído com sucesso',
      deletedId: id
    });
  },
};
