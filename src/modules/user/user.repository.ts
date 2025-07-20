import { prisma } from '@/lib/prisma';

export const userRepository = {
  create: async (data: {
    username: string;
    password: string;
    roleId: number;
  }) => {
    return prisma.user.create({ data });
  },

  findByUsername: async (username: string) => {
    return prisma.user.findUnique({ where: { username } });
  },

  findAll: async () => {
    return prisma.user.findMany();
  },

  findById: async (id: number) => {
    return prisma.user.findUnique({ where: { id } });
  },

  delete: async (id: number) => {
    return prisma.user.delete({ where: { id } });
  },
};
