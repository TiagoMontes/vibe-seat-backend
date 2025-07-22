import type { Request, Response, NextFunction } from 'express';
import { appointmentService } from './appointment.service';
import type { AppointmentInput, AppointmentQueryParams, AppointmentFilters } from './types';

const validateAndParseQueryParams = (query: AppointmentQueryParams): AppointmentFilters => {
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
  const validStatuses = ['SCHEDULED', 'CANCELLED', 'CONFIRMED'];
  const status = query.status && validStatuses.includes(query.status) ? query.status : undefined;

  // Validate sortBy
  const validSortOptions = ['newest', 'oldest', 'datetime-asc', 'datetime-desc'];
  const sortBy = query.sortBy && validSortOptions.includes(query.sortBy) ? query.sortBy : 'newest';

  // Sanitize search
  const search = query.search ? query.search.trim() : undefined;

  // Parse userId if provided
  let userId: number | undefined;
  if (query.userId) {
    userId = parseInt(query.userId, 10);
    if (isNaN(userId)) {
      userId = undefined;
    }
  }

  return {
    page,
    limit,
    search,
    status,
    sortBy,
    userId,
  };
};

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
  getAll: async (req: Request<{}, {}, {}, AppointmentQueryParams>, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      // Check if any pagination/filter parameters are provided
      const hasQueryParams = Object.keys(req.query).length > 0;

      if (hasQueryParams) {
        // Use pagination when query parameters are present
        const filters = validateAndParseQueryParams(req.query);
        const result = await appointmentService.getAllWithPagination(filters, user.id, user.role);
        return res.json(result);
      } else {
        // Maintain backward compatibility - return all appointments without pagination
        const list = await appointmentService.getAll(user.id, user.role);
        return res.json(list);
      }
    } catch (err) {
      next(err);
    }
  },

  // GET /agendamentos/available-times
  getAvailableTimes: async (req: Request<{}, {}, {}, { date: string; page?: string; limit?: string }>, res: Response, next: NextFunction) => {
    try {
      const { date, page, limit } = req.query;
      
      if (!date) {
        return res.status(400).json({
          message: 'Parâmetro "date" é obrigatório'
        });
      }

      // Validar formato da data
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          message: 'Data deve estar no formato válido (YYYY-MM-DD)'
        });
      }

      // Parse pagination parameters
      const pageNumber = parseInt(page || '1', 10);
      const limitNumber = parseInt(limit || '9', 10);

      // Validate pagination parameters
      if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({
          message: 'Parâmetro "page" deve ser um número maior que 0'
        });
      }

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 50) {
        return res.status(400).json({
          message: 'Parâmetro "limit" deve ser um número entre 1 e 50'
        });
      }

      const result = await appointmentService.getAvailableTimes(date, pageNumber, limitNumber);
      return res.json(result);
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
