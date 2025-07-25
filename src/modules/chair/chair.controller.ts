import type { Request, Response } from 'express';
import { chairService } from '@/modules/chair/chair.service';
import type { ChairInput, ChairQueryParams, ChairFilters } from '@/modules/chair/types';

const validateAndParseQueryParams = (query: ChairQueryParams): ChairFilters => {
  // Parse and validate page
  let page = parseInt(query.page || '1', 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  // Parse and validate limit
  let limit = parseInt(query.limit || '9', 10);
  if (isNaN(limit) || limit < 1 || limit > 50) {
    limit = 9;
  }

  // Validate status
  const validStatuses = ['ACTIVE', 'MAINTENANCE', 'INACTIVE'];
  const status = query.status && validStatuses.includes(query.status) ? query.status : undefined;

  // Validate sortBy
  const validSortOptions = ['newest', 'oldest', 'name-asc', 'name-desc'];
  const sortBy = query.sortBy && validSortOptions.includes(query.sortBy) ? query.sortBy : 'newest';

  // Sanitize search
  const search = query.search ? query.search.trim() : undefined;

  return {
    page,
    limit,
    search,
    status,
    sortBy,
  };
};

export const chairController = {
  create: async (req: Request<{}, {}, ChairInput>, res: Response) => {
    try {
      const result = await chairService.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Cadeira criada com sucesso',
        data: result
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao criar cadeira',
        error: true
      });
    }
  },

  getAll: async (req: Request<{}, {}, {}, ChairQueryParams>, res: Response) => {
    try {
      // Check if any pagination/filter parameters are provided
      const hasQueryParams = Object.keys(req.query).length > 0;

      if (hasQueryParams) {
        // Use pagination when query parameters are present
        const filters = validateAndParseQueryParams(req.query);
        const result = await chairService.getAllWithPagination(filters);
        return res.status(200).json({
          success: true,
          message: 'Cadeiras listadas com sucesso',
          data: result
        });
      } else {
        // Maintain backward compatibility - return all chairs without pagination
        const result = await chairService.getAll();
        return res.status(200).json({
          success: true,
          message: 'Cadeiras listadas com sucesso',
          data: result,
          total: result.length
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        error: true
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
          error: true
        });
      }

      const result = await chairService.getById(id);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Cadeira não encontrada',
          data: null,
          error: true
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cadeira encontrada',
        data: result
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        error: true
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
          error: true
        });
      }

      const updated = await chairService.update(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Cadeira atualizada com sucesso',
        data: updated
      });
    } catch (err: any) {
      if (err.message === 'Cadeira não encontrada') {
        return res.status(404).json({
          success: false,
          message: err.message,
          error: true
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao atualizar cadeira',
        error: true
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
          error: true
        });
      }

      await chairService.delete(id);
      return res.status(200).json({
        success: true,
        message: 'Cadeira excluída com sucesso',
        deletedId: id
      });
    } catch (err: any) {
      if (err.message === 'Cadeira não encontrada') {
        return res.status(404).json({
          success: false,
          message: err.message,
          error: true
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao excluir cadeira',
        error: true
      });
    }
  },
};
