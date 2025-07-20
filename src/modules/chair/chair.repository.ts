import { prisma } from '@/lib/prisma';
import type { ChairInput } from '@/modules/chair/types';

export const chairRepository = {
  create: async (data: ChairInput) => {
    return await prisma.chair.create({ data });
  },

  findAll: async () => {
    return await prisma.chair.findMany();
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
    return await prisma.chair.delete({ where: { id } });
  },
};
