import { appointmentRepository } from './appointment.repository';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/modules/email/email.service';
import { format } from 'date-fns-tz';
import { auditService } from '@/modules/audit/audit.service';
import type {
  AppointmentInput,
  AppointmentFilters,
  AppointmentWithPagination,
  PaginationMeta,
  AppointmentQueryParams,
} from './types';
import type { AppointmentEmailData } from '@/modules/email/types';
import type { AuditContext } from '@/modules/audit/types';

import { timezoneUtils } from '@/config/timezone';

const APPOINTMENT_DURATION_MINUTES = 30;
const CANCELLATION_NOTICE_HOURS = 3;

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

export const appointmentService = {
  // Métodos para processar query params
  processQueryParams: (query: AppointmentQueryParams) => {
    return validateAndParseQueryParams(query);
  },

  hasQueryParams: (query: AppointmentQueryParams) => {
    return Object.keys(query).length > 0;
  },

  // 1) Criar novo agendamento
  create: async (userId: number, input: AppointmentInput, context?: AuditContext) => {
    const start = new Date(input.datetimeStart);
    const end = new Date(
      start.getTime() + APPOINTMENT_DURATION_MINUTES * 60000
    );

    // 1.0) Verificar se o usuário já tem appointment ativo
    // Usuário só pode ter 1 agendamento ativo por vez (não cancelado e futuro)
    const now = timezoneUtils.now();
    const activeAppointments = await prisma.appointment.findMany({
      where: {
        userId,
        status: {
          not: 'CANCELLED', // Qualquer status exceto CANCELLED
        },
        // Considerar apenas appointments futuros
        datetimeStart: {
          gt: now, // Maior que agora (estritamente futuro)
        },
      },
    });

    if (activeAppointments.length > 0) {
      const activeAppointment = activeAppointments[0];
      if (!activeAppointment) {
        throw new Error('Erro interno: agendamento ativo não encontrado.');
      }

      const statusMessage =
        {
          SCHEDULED: 'agendado',
          CONFIRMED: 'confirmado',
          CANCELLED: 'cancelado',
        }[activeAppointment.status] || 'ativo';

      throw new Error(
        `Você já possui um agendamento ${statusMessage} para ${activeAppointment.datetimeStart.toLocaleString('pt-BR')}. Cancele ou aguarde a conclusão deste agendamento para criar um novo.`
      );
    }

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
    // O frontend já envia no horário local, não precisa converter timezone
    const timeString = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
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

    // Criar o agendamento
    const createdAppointment = await appointmentRepository.create({
      userId,
      chairId: input.chairId,
      datetimeStart: start,
      datetimeEnd: end,
    });

    // Buscar dados completos do agendamento para enviar email
    const appointmentWithDetails = await prisma.appointment.findUnique({
      where: { id: createdAppointment.id },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        chair: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });

    // Enviar email de agendamento criado se usuário tem email
    if (
      appointmentWithDetails?.user.email &&
      appointmentWithDetails?.user.fullName
    ) {
      try {
        const emailData: AppointmentEmailData = {
          appointmentId: appointmentWithDetails.id,
          userName: appointmentWithDetails.user.fullName,
          userEmail: appointmentWithDetails.user.email,
          chairName: appointmentWithDetails.chair.name,
          chairLocation: appointmentWithDetails.chair.location || undefined,
          datetimeStart: appointmentWithDetails.datetimeStart,
          datetimeEnd: appointmentWithDetails.datetimeEnd,
        };

        const emailResult = await emailService.sendCreatedEmail(emailData);

        if (emailResult.success) {
          console.log(
            `✅ Created email sent for appointment ${createdAppointment.id} to ${appointmentWithDetails.user.email}`
          );
        } else {
          console.error(
            `❌ Failed to send created email for appointment ${createdAppointment.id}: ${emailResult.error}`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error sending created email for appointment ${createdAppointment.id}:`,
          error
        );
        // Não falhar a criação se o email falhar
      }
    }

    // Log da criação do agendamento
    try {
      await auditService.logCreate(
        'Appointment',
        createdAppointment.id,
        {
          userId: createdAppointment.userId,
          chairId: createdAppointment.chairId,
          datetimeStart: createdAppointment.datetimeStart,
          datetimeEnd: createdAppointment.datetimeEnd,
          status: createdAppointment.status,
        },
        context
      );
    } catch (error) {
      console.error('Erro ao auditar criação de agendamento:', error);
    }

    return createdAppointment;
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
    const now = timezoneUtils.now();
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
    // Criar data diretamente no timezone local sem conversão UTC
    const dateParts = date.split('-');
    if (dateParts.length !== 3) {
      throw new Error('Formato de data inválido. Use YYYY-MM-DD');
    }
    const year = parseInt(dateParts[0]!);
    const month = parseInt(dateParts[1]!) - 1; // month é 0-indexed
    const day = parseInt(dateParts[2]!);
    const targetDate = new Date(year, month, day);
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
    // Usar timezone do Acre para obter a data/hora atual local
    const now = timezoneUtils.now();

    // Criar data de hoje no formato YYYY-MM-DD no timezone local
    const todayString = format(now, 'yyyy-MM-dd');
    const isToday = date === todayString;

    const allPossibleSlots: string[] = [];
    const allPossibleTimesISO: string[] = []; // Para compatibilidade com bookings
    const timeRanges = scheduleConfig.timeRanges as Array<{
      start: string;
      end: string;
    }>;

    for (const range of timeRanges) {
      // Criar horários diretamente no timezone local sem conversão UTC
      const [startHour, startMinute] = range.start.split(':').map(Number);
      const [endHour, endMinute] = range.end.split(':').map(Number);

      // Criar data local diretamente
      const startTime = new Date(targetDate);
      startTime.setHours(startHour || 0, startMinute || 0, 0, 0);

      const endTime = new Date(targetDate);
      endTime.setHours(endHour || 0, endMinute || 0, 0, 0);

      // Gerar slots de 30 minutos
      let currentTime = new Date(startTime);
      while (currentTime < endTime) {
        const timeSlot = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
        const timeISO = currentTime.toISOString();

        // Se for hoje, só incluir horários futuros
        if (!isToday) {
          allPossibleSlots.push(timeSlot);
          allPossibleTimesISO.push(timeISO);
        } else {
          // Se for hoje, comparar apenas o horário atual (usando now já no timezone correto)
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const slotHour = currentTime.getHours();
          const slotMinute = currentTime.getMinutes();

          // Converter para minutos para facilitar comparação
          const currentTimeInMinutes = currentHour * 60 + currentMinute;
          const slotTimeInMinutes = slotHour * 60 + slotMinute;

          if (slotTimeInMinutes > currentTimeInMinutes) {
            allPossibleSlots.push(timeSlot);
            allPossibleTimesISO.push(timeISO);
          }
        }

        // Avançar 30 minutos
        currentTime.setMinutes(
          currentTime.getMinutes() + APPOINTMENT_DURATION_MINUTES
        );
      }
    }

    // 7. Organizar horários ocupados por cadeira
    const bookedTimesByChair: { [chairId: number]: string[] } = {};
    const bookedSlotsByChair: { [chairId: number]: string[] } = {};

    bookedTimes.forEach(booking => {
      const chairId = booking.chairId;
      const timeISO = booking.datetimeStart.toISOString();
      // Converter para timezone local para comparar com os slots gerados
      const localDate = new Date(booking.datetimeStart);
      const timeSlot = `${localDate.getHours().toString().padStart(2, '0')}:${localDate.getMinutes().toString().padStart(2, '0')}`;

      if (!bookedTimesByChair[chairId]) {
        bookedTimesByChair[chairId] = [];
        bookedSlotsByChair[chairId] = [];
      }
      bookedTimesByChair[chairId]?.push(timeISO);
      bookedSlotsByChair[chairId]?.push(timeSlot);
    });

    // 8. Calcular disponibilidade para cada cadeira da página atual
    const chairsAvailability = allChairs.map(chair => {
      const bookedSlotsForChair = bookedSlotsByChair[chair.id] || [];

      // Filtrar slots disponíveis (formato HH:MM)
      const availableSlots = allPossibleSlots.filter(
        slot => !bookedSlotsForChair.includes(slot)
      );

      // Slots indisponíveis (formato HH:MM)
      const unavailableSlots = allPossibleSlots.filter(slot =>
        bookedSlotsForChair.includes(slot)
      );

      return {
        chairId: chair.id,
        chairName: chair.name,
        chairLocation: chair.location,
        available: availableSlots,
        unavailable: unavailableSlots,
        totalSlots: allPossibleSlots.length,
        bookedSlots: bookedSlotsForChair.length,
        availableSlots: availableSlots.length,
      };
    });

    // 9. Calcular estatísticas totais
    const totalBookedSlots = bookedTimes.length;
    const totalAvailableSlots =
      allPossibleSlots.length * allChairs.length - totalBookedSlots;

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
      totalSlots: allPossibleSlots.length,
      bookedSlots: totalBookedSlots,
      availableSlots: totalAvailableSlots,
    };
  },

  // 4) Cancelar agendamento
  cancel: async (id: number, userId: number, role: string, context?: AuditContext) => {
    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw new Error('Agendamento não encontrado.');

    // Usuário só cancela seus próprios, e com antecedência
    if (role !== 'admin') {
      if (appt.userId !== userId) {
        throw new Error('Não pode cancelar agendamento de outro usuário.');
      }
      const now = timezoneUtils.now();
      const diffHours =
        (appt.datetimeStart.getTime() - now.getTime()) / 3600000;
      if (diffHours < CANCELLATION_NOTICE_HOURS) {
        throw new Error(
          `É necessário cancelar com pelo menos ${CANCELLATION_NOTICE_HOURS}h de antecedência.`
        );
      }
    }

    const updatedAppointment = await appointmentRepository.update(id, { status: 'CANCELLED' });

    // Log do cancelamento
    try {
      await auditService.logStatusChange(
        'Appointment',
        id,
        appt.status,
        'CANCELLED',
        context,
        {
          userId: appt.userId,
          chairId: appt.chairId,
          datetimeStart: appt.datetimeStart,
          datetimeEnd: appt.datetimeEnd,
        }
      );
    } catch (error) {
      console.error('Erro ao auditar cancelamento de agendamento:', error);
    }

    return updatedAppointment;
  },

  // 5) Confirmar presença (somente admin/atendente)
  confirm: async (id: number, context?: AuditContext) => {
    const appt = await prisma.appointment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        chair: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });

    if (!appt) throw new Error('Agendamento não encontrado.');

    // Atualizar status do appointment
    const updatedAppointment = await appointmentRepository.update(id, {
      status: 'CONFIRMED',
      presenceConfirmed: true,
    });

    // Enviar email de confirmação se usuário tem email
    if (appt.user.email && appt.user.fullName) {
      try {
        const emailData: AppointmentEmailData = {
          appointmentId: appt.id,
          userName: appt.user.fullName,
          userEmail: appt.user.email,
          chairName: appt.chair.name,
          chairLocation: appt.chair.location || undefined,
          datetimeStart: appt.datetimeStart,
          datetimeEnd: appt.datetimeEnd,
        };

        const emailResult = await emailService.sendConfirmationEmail(emailData);

        if (emailResult.success) {
          console.log(
            `✅ Confirmation email sent for appointment ${id} to ${appt.user.email}`
          );
        } else {
          console.error(
            `❌ Failed to send confirmation email for appointment ${id}: ${emailResult.error}`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error sending confirmation email for appointment ${id}:`,
          error
        );
        // Não falhar a confirmação se o email falhar
      }
    }

    // Log da confirmação
    try {
      await auditService.logStatusChange(
        'Appointment',
        id,
        appt.status,
        'CONFIRMED',
        context,
        {
          userId: appt.userId,
          chairId: appt.chairId,
          datetimeStart: appt.datetimeStart,
          datetimeEnd: appt.datetimeEnd,
          presenceConfirmed: true,
        }
      );
    } catch (error) {
      console.error('Erro ao auditar confirmação de agendamento:', error);
    }

    return updatedAppointment;
  },
};
