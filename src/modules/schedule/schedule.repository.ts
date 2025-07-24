import { prisma } from '@/lib/prisma';
import type {
  ScheduleConfigSingleInput,
  ScheduleConfigUpdateInput,
  ScheduleFilters,
  ScheduleStats,
} from './types';

export const scheduleRepository = {
  create: (data: ScheduleConfigSingleInput) =>
    prisma.scheduleConfig.create({ data }),

  findAll: () => prisma.scheduleConfig.findMany(),

  findManyWithPagination: async (filters: ScheduleFilters) => {
    const { page, limit, search, dayOfWeek, sortBy } = filters;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (dayOfWeek !== undefined) {
      where.dayOfWeek = dayOfWeek;
    }

    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { timeStart: { contains: searchTerm } },
        { timeEnd: { contains: searchTerm } },
      ];
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'newest':
        orderBy = { id: 'desc' };
        break;
      case 'oldest':
        orderBy = { id: 'asc' };
        break;
      case 'time-asc':
        orderBy = { timeStart: 'asc' };
        break;
      case 'time-desc':
        orderBy = { timeStart: 'desc' };
        break;
      default:
        orderBy = { id: 'desc' };
    }

    return await prisma.scheduleConfig.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      select: {
        id: true,
        dayOfWeek: true,
        timeStart: true,
        timeEnd: true,
        validFrom: true,
        validTo: true,
      },
    });
  },

  countWithFilters: async (filters: Pick<ScheduleFilters, 'search' | 'dayOfWeek'>) => {
    const { search, dayOfWeek } = filters;

    const where: any = {};
    
    if (dayOfWeek !== undefined) {
      where.dayOfWeek = dayOfWeek;
    }

    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { timeStart: { contains: searchTerm } },
        { timeEnd: { contains: searchTerm } },
      ];
    }

    return await prisma.scheduleConfig.count({ where });
  },

  getStatsWithFilters: async (filters: Pick<ScheduleFilters, 'search' | 'dayOfWeek'>) => {
    const { search, dayOfWeek } = filters;

    const where: any = {};
    
    if (dayOfWeek !== undefined) {
      where.dayOfWeek = dayOfWeek;
    }

    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { timeStart: { contains: searchTerm } },
        { timeEnd: { contains: searchTerm } },
      ];
    }

    const [total, monday, tuesday, wednesday, thursday, friday, saturday, sunday] = await Promise.all([
      prisma.scheduleConfig.count({ where }),
      prisma.scheduleConfig.count({ where: { ...where, dayOfWeek: 1 } }),
      prisma.scheduleConfig.count({ where: { ...where, dayOfWeek: 2 } }),
      prisma.scheduleConfig.count({ where: { ...where, dayOfWeek: 3 } }),
      prisma.scheduleConfig.count({ where: { ...where, dayOfWeek: 4 } }),
      prisma.scheduleConfig.count({ where: { ...where, dayOfWeek: 5 } }),
      prisma.scheduleConfig.count({ where: { ...where, dayOfWeek: 6 } }),
      prisma.scheduleConfig.count({ where: { ...where, dayOfWeek: 0 } }),
    ]);

    return {
      total,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    } as ScheduleStats;
  },

  findById: (id: number) => prisma.scheduleConfig.findUnique({ where: { id } }),

  update: (id: number, data: ScheduleConfigUpdateInput) =>
    prisma.scheduleConfig.update({ where: { id }, data }),

  remove: (id: number) => prisma.scheduleConfig.delete({ where: { id } }),

  removeMany: (ids: number[]) => prisma.scheduleConfig.deleteMany({ where: { id: { in: ids } } }),
};
