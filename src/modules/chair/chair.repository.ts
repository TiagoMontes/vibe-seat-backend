import { prisma } from '@/lib/prisma';
import type { ChairInput, ChairFilters, ChairStats } from '@/modules/chair/types';

export const chairRepository = {
  create: async (data: ChairInput) => {
    return await prisma.chair.create({ data });
  },

  findAll: async () => {
    return await prisma.chair.findMany();
  },

  getInsights: async () => {
    // Buscar total de cadeiras
    const totalChairs = await prisma.chair.count();
    
    // Buscar contagem por status
    const statusCounts = await prisma.chair.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    // Organizar os dados de forma mais clara
    const insights = {
      total: totalChairs,
      active: 0,
      maintenance: 0,
      inactive: 0
    };

    // Mapear os resultados para as propriedades corretas
    statusCounts.forEach(item => {
      switch (item.status) {
        case 'ACTIVE':
          insights.active = item._count.status;
          break;
        case 'MAINTENANCE':
          insights.maintenance = item._count.status;
          break;
        case 'INACTIVE':
          insights.inactive = item._count.status;
          break;
      }
    });

    return insights;
  },

  findById: async (id: number) => {
    return await prisma.chair.findUnique({ where: { id } });
  },

  update: async (id: number, data: Partial<ChairInput>) => {
    return await prisma.chair.update({
      where: { id },
      data,
    });
  },

  delete: async (id: number) => {
    // Verificar se existem agendamentos relacionados
    const appointmentsCount = await prisma.appointment.count({
      where: { chairId: id }
    });

    if (appointmentsCount > 0) {
      throw new Error(`Não é possível deletar a cadeira. Existem ${appointmentsCount} agendamento(s) relacionados a esta cadeira.`);
    }

    return await prisma.chair.delete({ where: { id } });
  },

  findManyWithPagination: async (filters: ChairFilters) => {
    const { page, limit, search, status, sortBy } = filters;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { location: { contains: searchTerm } },
      ];
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
      case 'name-asc':
        orderBy = { name: 'asc' };
        break;
      case 'name-desc':
        orderBy = { name: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    return await prisma.chair.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
    });
  },

  countWithFilters: async (filters: Pick<ChairFilters, 'search' | 'status'>) => {
    const { search, status } = filters;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { location: { contains: searchTerm } },
      ];
    }

    return await prisma.chair.count({ where });
  },

  getStatsWithFilters: async (filters: Pick<ChairFilters, 'search' | 'status'>): Promise<ChairStats> => {
    const { search, status } = filters;

    // Build the same where clause as other methods
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { location: { contains: searchTerm } },
      ];
    }

    // Use Prisma aggregation to get statistics in a single query
    const stats = await prisma.chair.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true,
      },
    });

    // Initialize counters
    let total = 0;
    let active = 0;
    let maintenance = 0;
    let inactive = 0;

    // Process the results
    stats.forEach((stat) => {
      const count = stat._count.status;
      total += count;
      
      switch (stat.status) {
        case 'ACTIVE':
          active = count;
          break;
        case 'MAINTENANCE':
          maintenance = count;
          break;
        case 'INACTIVE':
          inactive = count;
          break;
      }
    });

    return {
      total,
      active,
      maintenance,
      inactive,
    };
  },
};
