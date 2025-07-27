import { prisma } from '@/lib/prisma';

export const dashboardService = {
  getDashboardData: async (userId: number, userRole: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Executar todas as queries em paralelo para melhor performance
    const [
      totalUsers,
      totalChairs,
      totalAppointments,
      todayAppointments,
      tomorrowAppointments,
      pendingApprovals,
      userAppointments,
      chairStats,
      appointmentStats,
      recentAppointments,
    ] = await Promise.all([
      // Total de usuários
      prisma.user.count(),

      // Total de cadeiras
      prisma.chair.count(),

      // Total de agendamentos
      prisma.appointment.count(),

      // Agendamentos de hoje
      prisma.appointment.count({
        where: {
          datetimeStart: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      // Agendamentos de amanhã
      prisma.appointment.count({
        where: {
          datetimeStart: {
            gte: tomorrow,
            lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Aprovações pendentes
      prisma.user.count({
        where: {
          status: 'PENDING',
        },
      }),

      // Agendamentos do usuário logado
      userRole === 'admin'
        ? Promise.resolve([])
        : prisma.appointment.findMany({
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
              datetimeStart: 'desc',
            },
            take: 5,
          }),

      // Estatísticas das cadeiras
      prisma.chair.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      }),

      // Estatísticas dos agendamentos
      prisma.appointment.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      }),

      // Agendamentos recentes (últimos 6)
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
          createdAt: 'desc',
        },
        take: 6,
      }),
    ]);

    // Processar estatísticas das cadeiras
    const chairStatsProcessed = {
      total: totalChairs,
      active:
        chairStats.find((s: any) => s.status === 'ACTIVE')?._count.status || 0,
      maintenance:
        chairStats.find((s: any) => s.status === 'MAINTENANCE')?._count
          .status || 0,
      inactive:
        chairStats.find((s: any) => s.status === 'INACTIVE')?._count.status ||
        0,
    };

    // Processar estatísticas dos agendamentos
    const appointmentStatsProcessed = {
      total: totalAppointments,
      scheduled:
        appointmentStats.find((s: any) => s.status === 'SCHEDULED')?._count
          .status || 0,
      confirmed:
        appointmentStats.find((s: any) => s.status === 'CONFIRMED')?._count
          .status || 0,
      cancelled:
        appointmentStats.find((s: any) => s.status === 'CANCELLED')?._count
          .status || 0,
    };

    // Calcular agendamentos confirmados futuros vs realizados
    const confirmedAppointments = await prisma.appointment.findMany({
      where: { status: 'CONFIRMED' },
    });

    const confirmedUpcoming = confirmedAppointments.filter(
      apt => new Date(apt.datetimeStart) > now
    ).length;

    const confirmedDone = confirmedAppointments.filter(
      apt => new Date(apt.datetimeStart) <= now
    ).length;

    // Agendamentos do usuário (se não for admin)
    const userAppointmentStats =
      userRole !== 'admin'
        ? {
            total: userAppointments.length,
            scheduled: userAppointments.filter(
              (apt: any) => apt.status === 'SCHEDULED'
            ).length,
            confirmed: userAppointments.filter(
              (apt: any) => apt.status === 'CONFIRMED'
            ).length,
            cancelled: userAppointments.filter(
              (apt: any) => apt.status === 'CANCELLED'
            ).length,
            confirmedUpcoming: userAppointments.filter(
              (apt: any) =>
                apt.status === 'CONFIRMED' && new Date(apt.datetimeStart) > now
            ).length,
            confirmedDone: userAppointments.filter(
              (apt: any) =>
                apt.status === 'CONFIRMED' && new Date(apt.datetimeStart) <= now
            ).length,
          }
        : null;

    return {
      overview: {
        totalUsers,
        totalChairs,
        totalAppointments,
        pendingApprovals,
      },
      today: {
        appointments: todayAppointments,
      },
      tomorrow: {
        appointments: tomorrowAppointments,
      },
      chairs: chairStatsProcessed,
      appointments: {
        ...appointmentStatsProcessed,
        confirmedUpcoming,
        confirmedDone,
      },
      userAppointments: userAppointmentStats,
      recentAppointments,
      lastUpdated: now.toISOString(),
    };
  },
};
