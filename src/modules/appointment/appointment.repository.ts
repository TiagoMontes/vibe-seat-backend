import { prisma } from '@/lib/prisma';
import type { AppointmentStatus } from '@prisma/client';
import type { AppointmentFilters, AppointmentStats } from './types';

export const appointmentRepository = {
  // Cria agendamento
  create: (data: {
    userId: number;
    chairId: number;
    datetimeStart: Date;
    datetimeEnd: Date;
  }) => prisma.appointment.create({ data }),

  // Busca todos (admin)
  findAll: () => prisma.appointment.findMany(),

  // Busca todos com detalhes (admin)
  findAllWithDetails: () =>
    prisma.appointment.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        chair: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        datetimeStart: 'desc', // Mais recentes primeiro
      },
    }),

  // Busca por usuário
  findByUser: (userId: number) =>
    prisma.appointment.findMany({
      where: { userId },
      include: {
        chair: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Mais novo primeiro (último criado)
      },
    }),

  // Busca agendamentos SCHEDULED (admin vê todos)
  findScheduled: () =>
    prisma.appointment.findMany({
      where: { status: 'SCHEDULED' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        chair: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        datetimeStart: 'asc', // Ordena por data/hora do agendamento
      },
    }),

  // Busca agendamentos SCHEDULED do usuário
  findScheduledByUser: (userId: number) =>
    prisma.appointment.findMany({
      where: {
        userId,
        status: 'SCHEDULED',
      },
      include: {
        chair: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        datetimeStart: 'asc', // Ordena por data/hora do agendamento
      },
    }),

  // Busca conflitos (cadeira OU usuário)
  findConflicts: (chairId: number, userId: number, start: Date, end: Date) =>
    prisma.appointment.findMany({
      where: {
        status: 'SCHEDULED',
        OR: [
          {
            chairId,
            datetimeStart: { lt: end },
            datetimeEnd: { gt: start },
          },
          {
            userId,
            datetimeStart: { lt: end },
            datetimeEnd: { gt: start },
          },
        ],
      },
    }),

  // Atualiza status ou presença
  update: (
    id: number,
    data: Partial<{ status: AppointmentStatus; presenceConfirmed: boolean }>
  ) => prisma.appointment.update({ where: { id }, data }),

  // Busca horários ocupados de todas as cadeiras em uma data específica
  findBookedTimes: async (date: string) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.appointment.findMany({
      where: {
        status: {
          in: ['SCHEDULED', 'CONFIRMED'], // Inclui agendamentos confirmados e agendados
        },
        datetimeStart: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        chairId: true,
        datetimeStart: true,
        datetimeEnd: true,
      },
      orderBy: {
        datetimeStart: 'asc',
      },
    });
  },

  // Pagination methods
  findManyWithPagination: async (filters: AppointmentFilters) => {
    const { page, limit, search, status, sortBy, userId } = filters;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      const searchTerm = search.trim();

      // Search by ID using partial matching for numeric search terms
      if (/^\d+$/.test(searchTerm)) {
        // Get all appointments first, then filter by ID containing the search term
        const allAppointments = await prisma.appointment.findMany({
          where: {
            ...(status && { status }),
            ...(userId && { userId }),
          },
          select: { id: true },
        });

        // Filter IDs that contain the search term
        const matchingIds = allAppointments
          .filter(apt => apt.id.toString().includes(searchTerm))
          .map(apt => apt.id);

        if (matchingIds.length > 0) {
          where.id = { in: matchingIds };
        } else {
          // No matching IDs found, return empty result
          where.id = -1; // Invalid ID to return no results
        }
      }
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'datetime-asc':
        orderBy = { datetimeStart: 'asc' };
        break;
      case 'datetime-desc':
        orderBy = { datetimeStart: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    return await prisma.appointment.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        chair: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });
  },

  countWithFilters: async (
    filters: Pick<AppointmentFilters, 'search' | 'status' | 'userId'>
  ) => {
    const { search, status, userId } = filters;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      const searchTerm = search.trim();

      // Search by ID using partial matching for numeric search terms
      if (/^\d+$/.test(searchTerm)) {
        // Get all appointments first, then filter by ID containing the search term
        const allAppointments = await prisma.appointment.findMany({
          where: {
            ...(status && { status }),
            ...(userId && { userId }),
          },
          select: { id: true },
        });

        // Filter IDs that contain the search term
        const matchingIds = allAppointments
          .filter(apt => apt.id.toString().includes(searchTerm))
          .map(apt => apt.id);

        if (matchingIds.length > 0) {
          where.id = { in: matchingIds };
        } else {
          // No matching IDs found, return empty result
          where.id = -1; // Invalid ID to return no results
        }
      }
    }

    return await prisma.appointment.count({ where });
  },

  getStatsWithFilters: async (
    filters: Pick<AppointmentFilters, 'search' | 'status' | 'userId'>
  ): Promise<AppointmentStats> => {
    const { search, status, userId } = filters;

    // Build WHERE conditions using AND array structure
    const whereConditions: any[] = [];

    if (status) {
      whereConditions.push({ status });
    }

    if (userId) {
      whereConditions.push({ userId });
    }

    if (search) {
      const searchTerm = search.trim();

      // Search by ID using partial matching for numeric search terms
      if (/^\d+$/.test(searchTerm)) {
        // Get all appointments first, then filter by ID containing the search term
        const allAppointments = await prisma.appointment.findMany({
          where: {
            ...(status && { status }),
            ...(userId && { userId }),
          },
          select: { id: true },
        });

        // Filter IDs that contain the search term
        const matchingIds = allAppointments
          .filter(apt => apt.id.toString().includes(searchTerm))
          .map(apt => apt.id);

        if (matchingIds.length > 0) {
          whereConditions.push({ id: { in: matchingIds } });
        } else {
          // No matching IDs found, return empty result
          whereConditions.push({ id: -1 }); // Invalid ID to return no results
        }
      }
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    // Use Prisma aggregation to get statistics in a single query
    const stats = await prisma.appointment.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true,
      },
    });

    // Initialize counters
    let total = 0;
    let scheduled = 0;
    let cancelled = 0;
    let confirmed = 0;

    // Process the results
    stats.forEach(stat => {
      const count = stat._count.status;
      total += count;

      switch (stat.status) {
        case 'SCHEDULED':
          scheduled = count;
          break;
        case 'CANCELLED':
          cancelled = count;
          break;
        case 'CONFIRMED':
          confirmed = count;
          break;
      }
    });

    return {
      total,
      scheduled,
      cancelled,
      confirmed,
    };
  },
};
