import type { Request, Response, NextFunction } from 'express';
import type {
  ScheduleConfigInput,
  ScheduleConfigUpdateInput,
  ScheduleQueryParams,
  ScheduleFilters,
} from '@/modules/schedule/types';
import { scheduleService } from '@/modules/schedule/schedule.service';

const validateAndParseQueryParams = (query: ScheduleQueryParams): ScheduleFilters => {
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

  // Validate dayOfWeek
  let dayOfWeek: number | undefined;
  if (query.dayOfWeek) {
    dayOfWeek = parseInt(query.dayOfWeek, 10);
    if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      dayOfWeek = undefined;
    }
  }

  // Validate sortBy
  const validSortOptions = ['newest', 'oldest', 'time-asc', 'time-desc'];
  const sortBy = query.sortBy && validSortOptions.includes(query.sortBy) ? query.sortBy : 'newest';

  // Sanitize search
  const search = query.search ? query.search.trim() : undefined;

  return {
    page,
    limit,
    search,
    dayOfWeek,
    sortBy,
  };
};

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

  getAll: async (req: Request<{}, {}, {}, ScheduleQueryParams>, res: Response, next: NextFunction) => {
    try {
      // Check if any pagination/filter parameters are provided
      const hasQueryParams = Object.keys(req.query).length > 0;

      if (hasQueryParams) {
        // Use pagination when query parameters are present
        const filters = validateAndParseQueryParams(req.query);
        const result = await scheduleService.getAllWithPagination(filters);
        return res.json(result);
      } else {
        // Maintain backward compatibility - return all schedules without pagination
        const list = await scheduleService.getAll();
        return res.json(list);
      }
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
      const id = Number(req.params.id);
      await scheduleService.remove(id);
      return res.status(200).json({
        message: 'Disponibilidade removida com sucesso',
        deletedId: id
      });
    } catch (err) {
      next(err);
    }
  },

  deleteMany: async (req: Request<{}, {}, { ids: number[] }>, res: Response) => {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          message: 'Campo "ids" é obrigatório e deve ser um array não vazio'
        });
      }

      await scheduleService.removeMany(ids);
      return res.status(200).json({ 
        message: 'Disponibilidades removidas com sucesso',
        deletedIds: ids,
        count: ids.length
      });
    } catch (error) {
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Erro interno' 
      });
    }
  },
};
