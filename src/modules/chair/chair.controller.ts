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
    const result = await chairService.create(req.body);
    return res.status(201).json(result);
  },

  getAll: async (req: Request<{}, {}, {}, ChairQueryParams>, res: Response) => {
    try {
      // Check if any pagination/filter parameters are provided
      const hasQueryParams = Object.keys(req.query).length > 0;

      if (hasQueryParams) {
        // Use pagination when query parameters are present
        const filters = validateAndParseQueryParams(req.query);
        const result = await chairService.getAllWithPagination(filters);
        return res.json(result);
      } else {
        // Maintain backward compatibility - return all chairs without pagination
    const result = await chairService.getAll();
    return res.json(result);
      }
    } catch (error) {
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
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
    return res.status(200).json({
      message: 'Cadeira excluída com sucesso',
      deletedId: id
    });
  },
};
