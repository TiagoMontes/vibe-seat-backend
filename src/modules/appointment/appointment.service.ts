import { appointmentRepository } from './appointment.repository';
import { prisma } from '@/lib/prisma';
import type {
  AppointmentInput,
  AppointmentFilters,
  AppointmentWithPagination,
  PaginationMeta,
} from './types';

const APPOINTMENT_DURATION_MINUTES = 30;
const CANCELLATION_NOTICE_HOURS = 3;

export const appointmentService = {
  // 1) Criar novo agendamento
  create: async (userId: number, input: AppointmentInput) => {
    const start = new Date(input.datetimeStart);
    const end = new Date(
      start.getTime() + APPOINTMENT_DURATION_MINUTES * 60000
    );

    // 1.1) Conflitos
    const conflicts = await appointmentRepository.findConflicts(
      input.chairId,
      userId,
      start,
      end
    );
    if (conflicts.length > 0) {
      throw new Error('Conflito de horário para usuário ou cadeira.');
    }

    // 1.2) Disponibilidade global - verificar configuração de agenda
    const scheduleConfig = await prisma.scheduleConfig.findFirst({
      include: {
        days: true,
      },
    });

    if (!scheduleConfig) {
      throw new Error('Nenhuma configuração de agenda encontrada.');
    }

    // Verificar se o dia da semana está configurado
    const dayNames = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];
    const currentDayName = dayNames[start.getDay()];

    const dayConfig = scheduleConfig.days.find(
      day => day.name === currentDayName
    );
    if (!dayConfig) {
      throw new Error(
        `Dia da semana (${currentDayName}) não configurado na agenda.`
      );
    }

    // Verificar se está dentro do período válido
    if (scheduleConfig.validFrom && start < scheduleConfig.validFrom) {
      throw new Error('Data fora do período válido da configuração.');
    }
    if (scheduleConfig.validTo && start > scheduleConfig.validTo) {
      throw new Error('Data fora do período válido da configuração.');
    }

    // Verificar se o horário está dentro dos timeRanges configurados
    const timeString = start.toTimeString().slice(0, 5); // "HH:MM"
    const timeRanges = scheduleConfig.timeRanges as Array<{
      start: string;
      end: string;
    }>;

    const isTimeValid = timeRanges.some(range => {
      return timeString >= range.start && timeString < range.end;
    });

    if (!isTimeValid) {
      throw new Error('Horário fora da disponibilidade configurada.');
    }

    return appointmentRepository.create({
      userId,
      chairId: input.chairId,
      datetimeStart: start,
      datetimeEnd: end,
    });
  },

  // 2) Listar agendamentos (admin vê todos, usuário apenas os seus)
  getAll: async (userId: number, role: string) => {
    if (role === 'admin') {
      return appointmentRepository.findAll();
    }
    return appointmentRepository.findByUser(userId);
  },

  // 2.1) Listar agendamentos do usuário logado (sempre apenas os seus)
  getMyAppointments: async (userId: number) => {
    return appointmentRepository.findByUser(userId);
  },

  // 2.1.1) Listar agendamentos do usuário logado com paginação
  getMyAppointmentsWithPagination: async (
    userId: number,
    filters: AppointmentFilters
  ): Promise<AppointmentWithPagination> => {
    // Force userId filter to current user for security
    filters.userId = userId;

    // Execute all queries in parallel for better performance
    const [appointments, totalItems, stats] = await Promise.all([
      appointmentRepository.findManyWithPagination(filters),
      appointmentRepository.countWithFilters({
        search: filters.search,
        status: filters.status,
        userId: filters.userId,
      }),
      appointmentRepository.getStatsWithFilters({
        search: filters.search,
        status: filters.status,
        userId: filters.userId,
      }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / filters.limit);
    const hasNextPage = filters.page < totalPages;
    const hasPrevPage = filters.page > 1;
    const nextPage = hasNextPage ? filters.page + 1 : null;
    const prevPage = hasPrevPage ? filters.page - 1 : null;
    const lastPage = totalPages;

    const pagination: PaginationMeta = {
      currentPage: filters.page,
      totalPages,
      totalItems,
      itemsPerPage: filters.limit,
      hasNextPage,
      hasPrevPage,
      nextPage,
      prevPage,
      lastPage,
    };

    // Calculate additional status-based counts for confirmed appointments
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

    // Enhance stats with time-based confirmed counts
    const enhancedStats = {
      ...stats,
      confirmedUpcoming,
      confirmedDone,
    };

    return {
      appointments,
      pagination,
      stats: enhancedStats,
    };
  },

  // 2.2) Listar todos os agendamentos (para filtrar no frontend)
  getScheduledAppointments: async (userId: number, role: string) => {
    if (role === 'admin') {
      return appointmentRepository.findAllWithDetails();
    }
    return appointmentRepository.findByUser(userId);
  },

  // 2.1) Listar agendamentos com paginação
  getAllWithPagination: async (
    filters: AppointmentFilters,
    currentUserId: number,
    userRole: string
  ): Promise<AppointmentWithPagination> => {
    // If not admin, force userId filter to current user
    if (userRole !== 'admin') {
      filters.userId = currentUserId;
    }

    // Execute all queries in parallel for better performance
    const [appointments, totalItems, stats] = await Promise.all([
      appointmentRepository.findManyWithPagination(filters),
      appointmentRepository.countWithFilters({
        search: filters.search,
        status: filters.status,
        userId: filters.userId,
      }),
      appointmentRepository.getStatsWithFilters({
        search: filters.search,
        status: filters.status,
        userId: filters.userId,
      }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / filters.limit);
    const hasNextPage = filters.page < totalPages;
    const hasPrevPage = filters.page > 1;
    const nextPage = hasNextPage ? filters.page + 1 : null;
    const prevPage = hasPrevPage ? filters.page - 1 : null;
    const lastPage = totalPages;

    const pagination: PaginationMeta = {
      currentPage: filters.page,
      totalPages,
      totalItems,
      itemsPerPage: filters.limit,
      hasNextPage,
      hasPrevPage,
      nextPage,
      prevPage,
      lastPage,
    };

    return {
      appointments,
      pagination,
      stats,
    };
  },

  // 3) Buscar horários disponíveis para todas as cadeiras em uma data (com paginação)
  getAvailableTimes: async (
    date: string,
    page: number = 1,
    limit: number = 9,
    chairIds?: number[]
  ) => {
    // 1. Buscar configuração de horário
    const scheduleConfig = await prisma.scheduleConfig.findFirst({
      include: {
        days: true,
      },
    });

    if (!scheduleConfig) {
      return {
        chairs: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null,
          lastPage: 0,
        },
        totalSlots: 0,
        bookedSlots: 0,
        availableSlots: 0,
      };
    }

    // 2. Buscar cadeiras ativas (com paginação ou por IDs específicos)
    const offset = (page - 1) * limit;

    // Definir condições de busca
    const whereConditions: any = {
      status: 'ACTIVE',
    };

    // Se chairIds foram fornecidos, filtrar por eles
    if (chairIds && chairIds.length > 0) {
      whereConditions.id = {
        in: chairIds,
      };
    }

    const [allChairs, totalChairs] = await Promise.all([
      prisma.chair.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          location: true,
        },
        orderBy: {
          id: 'desc', // Mais novo primeiro (ID mais alto)
        },
        skip: chairIds ? 0 : offset, // Não paginar quando IDs específicos
        take: chairIds ? undefined : limit, // Não limitar quando IDs específicos
      }),
      prisma.chair.count({
        where: whereConditions,
      }),
    ]);

    // 3. Verificar se o dia da semana está configurado
    const targetDate = new Date(date);
    const dayNames = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];
    const currentDayName = dayNames[targetDate.getDay()];

    const dayConfig = scheduleConfig.days.find(
      day => day.name === currentDayName
    );
    if (!dayConfig) {
      const totalPages = Math.ceil(totalChairs / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      const nextPage = hasNextPage ? page + 1 : null;
      const prevPage = hasPrevPage ? page - 1 : null;
      const lastPage = totalPages;

      return {
        chairs: [],
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalChairs,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage,
          nextPage,
          prevPage,
          lastPage,
        },
        totalSlots: 0,
        bookedSlots: 0,
        availableSlots: 0,
      };
    }

    // 4. Verificar se está dentro do período válido
    if (scheduleConfig.validFrom && targetDate < scheduleConfig.validFrom) {
      const totalPages = Math.ceil(totalChairs / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      const nextPage = hasNextPage ? page + 1 : null;
      const prevPage = hasPrevPage ? page - 1 : null;
      const lastPage = totalPages;

      return {
        chairs: [],
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalChairs,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage,
          nextPage,
          prevPage,
          lastPage,
        },
        totalSlots: 0,
        bookedSlots: 0,
        availableSlots: 0,
      };
    }
    if (scheduleConfig.validTo && targetDate > scheduleConfig.validTo) {
      const totalPages = Math.ceil(totalChairs / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      const nextPage = hasNextPage ? page + 1 : null;
      const prevPage = hasPrevPage ? page - 1 : null;
      const lastPage = totalPages;

      return {
        chairs: [],
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalChairs,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage,
          nextPage,
          prevPage,
          lastPage,
        },
        totalSlots: 0,
        bookedSlots: 0,
        availableSlots: 0,
      };
    }

    // 5. Buscar horários já ocupados de todas as cadeiras
    const bookedTimes = await appointmentRepository.findBookedTimes(date);

    // 6. Gerar todos os horários possíveis baseados nas configurações
    const allPossibleTimes: string[] = [];
    const timeRanges = scheduleConfig.timeRanges as Array<{
      start: string;
      end: string;
    }>;

    for (const range of timeRanges) {
      const startTime = new Date(date + 'T' + range.start);
      const endTime = new Date(date + 'T' + range.end);

      // Gerar slots de 30 minutos
      let currentTime = new Date(startTime);
      while (currentTime < endTime) {
        const timeString = currentTime.toISOString();
        allPossibleTimes.push(timeString);

        // Avançar 30 minutos
        currentTime.setMinutes(
          currentTime.getMinutes() + APPOINTMENT_DURATION_MINUTES
        );
      }
    }

    // 7. Organizar horários ocupados por cadeira
    const bookedTimesByChair: { [chairId: number]: string[] } = {};

    bookedTimes.forEach(booking => {
      const chairId = booking.chairId;
      const timeString = booking.datetimeStart.toISOString();

      if (!bookedTimesByChair[chairId]) {
        bookedTimesByChair[chairId] = [];
      }
      bookedTimesByChair[chairId].push(timeString);
    });

    // 8. Calcular disponibilidade para cada cadeira da página atual
    const chairsAvailability = allChairs.map(chair => {
      const bookedTimesForChair = bookedTimesByChair[chair.id] || [];

      const available = allPossibleTimes.filter(
        time => !bookedTimesForChair.includes(time)
      );

      const unavailable = allPossibleTimes.filter(time =>
        bookedTimesForChair.includes(time)
      );

      return {
        chairId: chair.id,
        chairName: chair.name,
        chairLocation: chair.location,
        available,
        unavailable,
        totalSlots: allPossibleTimes.length,
        bookedSlots: bookedTimesForChair.length,
        availableSlots: available.length,
      };
    });

    // 9. Calcular estatísticas totais
    const totalBookedSlots = bookedTimes.length;
    const totalAvailableSlots =
      allPossibleTimes.length * allChairs.length - totalBookedSlots;

    // Calcular paginação baseado no contexto (chairIds específicos ou paginação normal)
    let pagination;

    if (chairIds && chairIds.length > 0) {
      // Quando chairIds específicos são fornecidos, não há paginação
      pagination = {
        currentPage: 1,
        totalPages: 1,
        totalItems: allChairs.length,
        itemsPerPage: allChairs.length,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null,
        lastPage: 1,
      };
    } else {
      // Paginação normal
      const totalPages = Math.ceil(totalChairs / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      const nextPage = hasNextPage ? page + 1 : null;
      const prevPage = hasPrevPage ? page - 1 : null;
      const lastPage = totalPages;

      pagination = {
        currentPage: page,
        totalPages,
        totalItems: totalChairs,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
        lastPage,
      };
    }

    return {
      chairs: chairsAvailability,
      pagination,
      totalSlots: allPossibleTimes.length,
      bookedSlots: totalBookedSlots,
      availableSlots: totalAvailableSlots,
    };
  },

  // 4) Cancelar agendamento
  cancel: async (id: number, userId: number, role: string) => {
    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw new Error('Agendamento não encontrado.');

    // Usuário só cancela seus próprios, e com antecedência
    if (role !== 'admin') {
      if (appt.userId !== userId) {
        throw new Error('Não pode cancelar agendamento de outro usuário.');
      }
      const now = new Date();
      const diffHours =
        (appt.datetimeStart.getTime() - now.getTime()) / 3600000;
      if (diffHours < CANCELLATION_NOTICE_HOURS) {
        throw new Error(
          `É necessário cancelar com pelo menos ${CANCELLATION_NOTICE_HOURS}h de antecedência.`
        );
      }
    }

    return appointmentRepository.update(id, { status: 'CANCELLED' });
  },

  // 5) Confirmar presença (somente admin/atendente)
  confirm: async (id: number) => {
    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw new Error('Agendamento não encontrado.');
    return appointmentRepository.update(id, {
      status: 'CONFIRMED',
      presenceConfirmed: true,
    });
  },
};
