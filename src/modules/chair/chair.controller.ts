import type { Request, Response } from 'express';
import { chairService } from '@/modules/chair/chair.service';
import { extractAuditContext } from '@/modules/audit/audit.utils';
import type { ChairInput, ChairQueryParams } from '@/modules/chair/types';

export const chairController = {
  create: async (req: Request<{}, {}, ChairInput>, res: Response) => {
    try {
      const auditContext = extractAuditContext(req);
      const result = await chairService.create(req.body, auditContext);
      return res.status(201).json({
        success: true,
        message: 'Cadeira criada com sucesso',
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao criar cadeira',
        error: true,
      });
    }
  },

  getInsights: async (req: Request, res: Response) => {
    try {
      const result = await chairService.getInsights();
      return res.status(200).json({
        success: true,
        message: 'Insights listados com sucesso',
        data: result,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        error: true,
      });
    }
  },

  getAll: async (req: Request<{}, {}, {}, ChairQueryParams>, res: Response) => {
    try {
      // Check if any pagination/filter parameters are provided
      const hasQueryParams = chairService.hasQueryParams(req.query);

      if (hasQueryParams) {
        // Use pagination when query parameters are present
        const filters = chairService.processQueryParams(req.query);
        const result = await chairService.getAllWithPagination(filters);
        return res.status(200).json({
          success: true,
          message: 'Cadeiras listadas com sucesso',
          data: result,
        });
      } else {
        // Maintain backward compatibility - return all chairs without pagination
        const result = await chairService.getAll();
        return res.status(200).json({
          success: true,
          message: 'Cadeiras listadas com sucesso',
          data: result,
          total: result.length,
        });
      }
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

      const result = await chairService.getById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Cadeira não encontrada',
          data: null,
          error: true,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cadeira encontrada',
        data: result,
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

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
          error: true,
        });
      }

      const auditContext = extractAuditContext(req);
      const updated = await chairService.update(id, req.body, auditContext);
      return res.status(200).json({
        success: true,
        message: 'Cadeira atualizada com sucesso',
        data: updated,
      });
    } catch (err: any) {
      if (err.message === 'Cadeira não encontrada') {
        return res.status(404).json({
          success: false,
          message: err.message,
          error: true,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao atualizar cadeira',
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

      const auditContext = extractAuditContext(req);
      await chairService.delete(id, auditContext);
      return res.status(200).json({
        success: true,
        message: 'Cadeira excluída com sucesso',
        deletedId: id,
      });
    } catch (err: any) {
      if (err.message === 'Cadeira não encontrada') {
        return res.status(404).json({
          success: false,
          message: err.message,
          error: true,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao excluir cadeira',
        error: true,
      });
    }
  },
};
