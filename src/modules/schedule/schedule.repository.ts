import { prisma } from '@/lib/prisma';
import type {
  ScheduleConfigSingleInput,
  ScheduleConfigUpdateInput,
} from './types';

export const scheduleRepository = {
  create: (data: ScheduleConfigSingleInput) =>
    prisma.scheduleConfig.create({ data }),

  findAll: () => prisma.scheduleConfig.findMany(),

  findById: (id: number) => prisma.scheduleConfig.findUnique({ where: { id } }),

  update: (id: number, data: ScheduleConfigUpdateInput) =>
    prisma.scheduleConfig.update({ where: { id }, data }),

  remove: (id: number) => prisma.scheduleConfig.delete({ where: { id } }),

  removeMany: (ids: number[]) => prisma.scheduleConfig.deleteMany({ where: { id: { in: ids } } }),
};
