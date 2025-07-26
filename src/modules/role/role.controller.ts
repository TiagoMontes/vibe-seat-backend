import type { Request, Response } from 'express';
import { roleService } from '@/modules/role/role.service';

export const roleController = {
  create: async (req: Request, res: Response) => {
    try {
      const { name } = req.body;

      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Nome é obrigatório',
          error: true,
        });
      }

      const role = await roleService.create(name.trim());
      return res.status(201).json({
        success: true,
        message: 'Role criada com sucesso',
        data: role,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao criar role',
        error: true,
      });
    }
  },

  getAll: async (_req: Request, res: Response) => {
    try {
      const roles = await roleService.getAll();
      return res.status(200).json({
        success: true,
        message: 'Roles listadas com sucesso',
        data: roles,
        total: roles.length,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        error: true,
      });
    }
  },

  getById: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
          error: true,
        });
      }

      const role = await roleService.getById(id);

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role não encontrada',
          data: null,
          error: true,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Role encontrada',
        data: role,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        error: true,
      });
    }
  },

  update: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { name } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
          error: true,
        });
      }

      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Nome é obrigatório',
          error: true,
        });
      }

      const updated = await roleService.update(id, name.trim());
      return res.status(200).json({
        success: true,
        message: 'Role atualizada com sucesso',
        data: updated,
      });
    } catch (err: any) {
      if (err.message === 'Role não encontrada') {
        return res.status(404).json({
          success: false,
          message: err.message,
          error: true,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao atualizar role',
        error: true,
      });
    }
  },

  delete: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
          error: true,
        });
      }

      await roleService.delete(id);
      return res.status(200).json({
        success: true,
        message: 'Role excluída com sucesso',
        deletedId: id,
      });
    } catch (err: any) {
      if (err.message === 'Role não encontrada') {
        return res.status(404).json({
          success: false,
          message: err.message,
          error: true,
        });
      }
      if (err.message.includes('usuários vinculados')) {
        return res.status(400).json({
          success: false,
          message: err.message,
          error: true,
        });
      }
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        error: true,
      });
    }
  },
};
