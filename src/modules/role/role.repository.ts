import { prisma } from '@/lib/prisma';

export const roleRepository = {
  create: async (data: { name: string }) => {
    return await prisma.role.create({ data });
  },

  findAll: async () => {
    return await prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: true,
            requestedByUsers: true,
          },
        },
      },
    });
  },

  findById: async (id: number) => {
    return await prisma.role.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            status: true,
          },
        },
        _count: {
          select: {
            users: true,
            requestedByUsers: true,
          },
        },
      },
    });
  },

  findByIdWithCounts: async (id: number) => {
    return await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            requestedByUsers: true,
          },
        },
      },
    });
  },

  findByName: async (name: string) => {
    return await prisma.role.findUnique({
      where: { name },
    });
  },

  update: async (id: number, data: { name: string }) => {
    return await prisma.role.update({
      where: { id },
      data,
    });
  },

  delete: async (id: number) => {
    return await prisma.role.delete({ where: { id } });
  },
};
