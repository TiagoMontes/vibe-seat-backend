import { prisma } from '@/lib/prisma';
import type {
  DayOfWeekInput,
  DayOfWeekUpdateInput,
  DayOfWeek,
} from './types';

export const dayOfWeekRepository = {
  create: (data: DayOfWeekInput): Promise<DayOfWeek> =>
    prisma.dayOfWeek.create({ data }),

  findAll: async () => {
    return await prisma.dayOfWeek.findMany();
  },

  findById: (id: number): Promise<DayOfWeek | null> => 
    prisma.dayOfWeek.findUnique({ where: { id } }),

  findByName: (name: string): Promise<DayOfWeek | null> => 
    prisma.dayOfWeek.findFirst({ where: { name } }),

  update: (id: number, data: DayOfWeekUpdateInput): Promise<DayOfWeek> =>
    prisma.dayOfWeek.update({ where: { id }, data }),

  remove: (id: number): Promise<DayOfWeek> => 
    prisma.dayOfWeek.delete({ where: { id } }),

  removeMany: (ids: number[]): Promise<any> => 
    prisma.dayOfWeek.deleteMany({ where: { id: { in: ids } } }),
}; 