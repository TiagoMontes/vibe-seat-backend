import { appointmentRepository } from './appointment.repository';
import { prisma } from '@/lib/prisma';
import type { AppointmentInput, AppointmentFilters, AppointmentWithPagination, PaginationMeta } from './types';

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

    // 1.2) Disponibilidade global
    const dayOfWeek = start.getDay();
    const time = start.toTimeString().slice(0, 5); // "HH:MM"
    const configs = await prisma.scheduleConfig.findMany({
      where: {
        dayOfWeek,
        timeStart: { lte: time },
        timeEnd: { gte: time },
        validFrom: { lte: start },
        validTo: { gte: start },
      },
    });
    if (configs.length === 0) {
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

  // 2.2) Listar todos os agendamentos (para filtrar no frontend)
  getScheduledAppointments: async (userId: number, role: string) => {
    if (role === 'admin') {
      return appointmentRepository.findAllWithDetails();
    }
    return appointmentRepository.findByUser(userId);
  },

  // 2.1) Listar agendamentos com paginação
  getAllWithPagination: async (filters: AppointmentFilters, currentUserId: number, userRole: string): Promise<AppointmentWithPagination> => {
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

    const pagination: PaginationMeta = {
      currentPage: filters.page,
      totalPages,
      totalItems,
      itemsPerPage: filters.limit,
      hasNextPage,
      hasPrevPage,
    };

    return {
      appointments,
      pagination,
      stats,
    };
  },

  // 3) Buscar horários disponíveis para todas as cadeiras em uma data (com paginação)
  getAvailableTimes: async (date: string, page: number = 1, limit: number = 9) => {
    // 1. Buscar configurações de horário para o dia da semana
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    
    console.log('🔍 Debug - Buscando horários para cadeiras na data:', {
      date,
      targetDate: targetDate.toISOString(),
      dayOfWeek,
      page,
      limit
    });
    
    // 2. Buscar todas as cadeiras ativas com paginação
    const offset = (page - 1) * limit;
    
    const [allChairs, totalChairs] = await Promise.all([
      prisma.chair.findMany({
        where: {
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          location: true
        },
        orderBy: {
          id: 'desc'  // Mais novo primeiro (ID mais alto)
        },
        skip: offset,
        take: limit
      }),
      prisma.chair.count({
        where: {
          status: 'ACTIVE'
        }
      })
    ]);
    
    console.log('🪑 Cadeiras encontradas (página atual):', allChairs.length);
    console.log('🪑 Total de cadeiras ativas:', totalChairs);
    
    // 3. Buscar configurações de horário para o dia
    const scheduleConfigs = await prisma.scheduleConfig.findMany({
      where: {
        dayOfWeek,
        validFrom: { lte: targetDate },
        validTo: { gte: targetDate },
      },
      orderBy: {
        timeStart: 'asc',
      },
    });

    console.log('📅 Configurações encontradas:', scheduleConfigs.length);

    if (scheduleConfigs.length === 0) {
      return { 
        chairs: [],
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalChairs / limit),
          totalItems: totalChairs,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalChairs / limit),
          hasPrevPage: page > 1
        },
        totalSlots: 0,
        bookedSlots: 0,
        availableSlots: 0
      }; // Não há horários configurados para este dia
    }

    // 4. Buscar horários já ocupados de todas as cadeiras
    const bookedTimes = await appointmentRepository.findBookedTimes(date);
    
    console.log('📋 Horários ocupados encontrados:', bookedTimes.length);

    // 5. Gerar todos os horários possíveis baseados nas configurações
    const allPossibleTimes: string[] = [];
    
    for (const config of scheduleConfigs) {
      const startTime = new Date(date + 'T' + config.timeStart);
      const endTime = new Date(date + 'T' + config.timeEnd);
      
      // Gerar slots de 30 minutos
      let currentTime = new Date(startTime);
      while (currentTime < endTime) {
        const timeString = currentTime.toISOString();
        allPossibleTimes.push(timeString);
        
        // Avançar 30 minutos
        currentTime.setMinutes(currentTime.getMinutes() + APPOINTMENT_DURATION_MINUTES);
      }
    }

    console.log('📊 Total de slots possíveis:', allPossibleTimes.length);

    // 6. Organizar horários ocupados por cadeira
    const bookedTimesByChair: { [chairId: number]: string[] } = {};
    
    bookedTimes.forEach(booking => {
      const chairId = booking.chairId;
      const timeString = booking.datetimeStart.toISOString();
      
      if (!bookedTimesByChair[chairId]) {
        bookedTimesByChair[chairId] = [];
      }
      bookedTimesByChair[chairId].push(timeString);
    });

    // 7. Calcular disponibilidade para cada cadeira da página atual
    const chairsAvailability = allChairs.map(chair => {
      const bookedTimesForChair = bookedTimesByChair[chair.id] || [];
      
      const available = allPossibleTimes.filter(time => 
        !bookedTimesForChair.includes(time)
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

    // 8. Calcular estatísticas totais
    const totalBookedSlots = bookedTimes.length;
    const totalAvailableSlots = (allPossibleTimes.length * allChairs.length) - totalBookedSlots;

    console.log('✅ Resultado final:', {
      chairsInPage: chairsAvailability.length,
      totalChairs,
      totalSlots: allPossibleTimes.length,
      totalBookedSlots
    });

    return {
      chairs: chairsAvailability,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalChairs / limit),
        totalItems: totalChairs,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalChairs / limit),
        hasPrevPage: page > 1
      },
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
