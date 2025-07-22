import type { Request, Response } from 'express';
import { roleService } from '@/modules/role/role.service';

export const roleController = {
  create: async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const role = await roleService.create(name.trim());
      return res.status(201).json(role);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  getAll: async (_req: Request, res: Response) => {
    try {
      const roles = await roleService.getAll();
      return res.json(roles);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  getById: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const role = await roleService.getById(id);
      if (!role) {
        return res.status(404).json({ error: 'Role não encontrada' });
      }
      
      return res.json(role);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  update: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { name } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const updated = await roleService.update(id, name.trim());
      return res.json(updated);
    } catch (err: any) {
      if (err.message === 'Role não encontrada') {
        return res.status(404).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
  },

  delete: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      await roleService.delete(id);
      return res.status(200).json({
        message: 'Role excluída com sucesso',
        deletedId: id
      });
    } catch (err: any) {
      if (err.message === 'Role não encontrada') {
        return res.status(404).json({ error: err.message });
      }
      if (err.message.includes('usuários vinculados')) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
  },
};
