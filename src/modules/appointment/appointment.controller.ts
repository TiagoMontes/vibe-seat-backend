import type { Request, Response } from 'express';
import { appointmentService } from './appointment.service';
import type {
  AppointmentInput,
  AppointmentQueryParams,
  AppointmentFilters,
} from './types';

const validateAndParseQueryParams = (
  query: AppointmentQueryParams
): AppointmentFilters => {
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
  const status =
    query.status && validStatuses.includes(query.status)
      ? query.status
      : undefined;

  // Validate sortBy
  const validSortOptions = [
    'newest',
    'oldest',
    'datetime-asc',
    'datetime-desc',
  ];
  const sortBy =
    query.sortBy && validSortOptions.includes(query.sortBy)
      ? query.sortBy
      : 'newest';

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
  create: async (req: Request<{}, {}, AppointmentInput>, res: Response) => {
    try {
      const user = (req as any).user;
      const appt = await appointmentService.create(user.id, req.body);
      return res.status(201).json({
        success: true,
        message: 'Agendamento criado com sucesso',
        data: appt,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao criar agendamento',
        error: true,
      });
    }
  },

  // GET /agendamentos
  getAll: async (
    req: Request<{}, {}, {}, AppointmentQueryParams>,
    res: Response
  ) => {
    try {
      const user = (req as any).user;

      // Check if any pagination/filter parameters are provided
      const hasQueryParams = Object.keys(req.query).length > 0;

      if (hasQueryParams) {
        // Use pagination when query parameters are present
        const filters = validateAndParseQueryParams(req.query);
        const result = await appointmentService.getAllWithPagination(
          filters,
          user.id,
          user.role
        );
        return res.status(200).json({
          success: true,
          message: 'Agendamentos listados com sucesso',
          data: result,
        });
      } else {
        // Maintain backward compatibility - return all appointments without pagination
        const list = await appointmentService.getAll(user.id, user.role);
        return res.status(200).json({
          success: true,
          message: 'Agendamentos listados com sucesso',
          data: list,
          total: list.length,
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

  // GET /agendamentos/my-appointments
  getMyAppointments: async (
    req: Request<{}, {}, {}, AppointmentQueryParams>,
    res: Response
  ) => {
    try {
      const user = (req as any).user;

      // Check if any pagination/filter parameters are provided
      const hasQueryParams = Object.keys(req.query).length > 0;

      if (hasQueryParams) {
        // Use pagination when query parameters are present
        const filters = validateAndParseQueryParams(req.query);
        const result = await appointmentService.getMyAppointmentsWithPagination(
          user.id,
          filters
        );
        return res.status(200).json({
          success: true,
          message: 'Agendamentos do usuário logado',
          data: result,
        });
      } else {
        // Maintain backward compatibility - return all appointments without pagination
        const appointments = await appointmentService.getMyAppointments(
          user.id
        );

        // Calcular contagens por status
        const scheduled = appointments.filter(
          apt => apt.status === 'SCHEDULED'
        ).length;
        const cancelled = appointments.filter(
          apt => apt.status === 'CANCELLED'
        ).length;

        // Separar agendamentos confirmados por data
        const now = new Date();
        const confirmedAppointments = appointments.filter(
          apt => apt.status === 'CONFIRMED'
        );
        const confirmedUpcoming = confirmedAppointments.filter(
          apt => new Date(apt.datetimeStart) > now
        ).length;
        const confirmedDone = confirmedAppointments.filter(
          apt => new Date(apt.datetimeStart) <= now
        ).length;
        const confirmed = confirmedAppointments.length; // Total de confirmados

        return res.status(200).json({
          success: true,
          message: 'Agendamentos do usuário logado',
          data: {
            appointments,
            total: appointments.length,
            scheduled,
            confirmed,
            confirmedUpcoming,
            confirmedDone,
            cancelled,
          },
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

  // GET /agendamentos/scheduled
  getScheduledAppointments: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const appointments = await appointmentService.getScheduledAppointments(
        user.id,
        user.role
      );

      return res.status(200).json({
        success: true,
        message: 'Todos os agendamentos',
        data: {
          appointments,
          total: appointments.length,
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        error: true,
      });
    }
  },

  // GET /agendamentos/available-times
  getAvailableTimes: async (
    req: Request<
      {},
      {},
      { chairIds?: number[] },
      { date: string; page?: string; limit?: string }
    >,
    res: Response
  ) => {
    try {
      const { date, page, limit } = req.query;
      const { chairIds } = req.body;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetro "date" é obrigatório',
          error: true,
        });
      }

      // Validar formato da data
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Data deve estar no formato válido (YYYY-MM-DD)',
          error: true,
        });
      }

      // Parse pagination parameters
      const pageNumber = parseInt(page || '1', 10);
      const limitNumber = parseInt(limit || '3', 10);

      // Validate pagination parameters
      if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetro "page" deve ser um número maior que 0',
          error: true,
        });
      }

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 50) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetro "limit" deve ser um número entre 1 e 50',
          error: true,
        });
      }

      // Validar chairIds se fornecidos
      if (
        chairIds &&
        (!Array.isArray(chairIds) ||
          chairIds.some(id => !Number.isInteger(id) || id <= 0))
      ) {
        return res.status(400).json({
          success: false,
          message: 'chairIds deve ser um array de números inteiros positivos',
          error: true,
        });
      }

      const result = await appointmentService.getAvailableTimes(
        date,
        pageNumber,
        limitNumber,
        chairIds
      );
      return res.status(200).json({
        success: true,
        message: 'Horários disponíveis encontrados',
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

  // PATCH /agendamentos/:id/cancel
  cancel: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const user = (req as any).user;
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
          error: true,
        });
      }

      const result = await appointmentService.cancel(id, user.id, user.role);
      return res.status(200).json({
        success: true,
        message: 'Agendamento cancelado com sucesso',
        data: result,
      });
    } catch (err: any) {
      if (err.message === 'Agendamento não encontrado') {
        return res.status(404).json({
          success: false,
          message: err.message,
          error: true,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao cancelar agendamento',
        error: true,
      });
    }
  },

  // PATCH /agendamentos/:id/confirm
  confirm: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
          error: true,
        });
      }

      const result = await appointmentService.confirm(id);
      return res.status(200).json({
        success: true,
        message: 'Agendamento confirmado com sucesso',
        data: result,
      });
    } catch (err: any) {
      if (err.message === 'Agendamento não encontrado') {
        return res.status(404).json({
          success: false,
          message: err.message,
          error: true,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro ao confirmar agendamento',
        error: true,
      });
    }
  },
};
