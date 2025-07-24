import { prisma } from '@/lib/prisma';
import type { UserFilters, UserStats } from './types';

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

  findManyWithPagination: async (filters: UserFilters) => {
    const { page, limit, search, status, roleId, sortBy } = filters;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    if (roleId) {
      where.roleId = roleId;
    }

    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { username: { contains: searchTerm } },
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
      case 'username-asc':
        orderBy = { username: 'asc' };
        break;
      case 'username-desc':
        orderBy = { username: 'desc' };
        break;
      default:
        orderBy = { id: 'desc' };
    }

    const results = await prisma.user.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      select: {
        id: true,
        username: true,
        status: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return results.map(result => ({
      ...result,
      status: result.status as 'pending' | 'approved' | 'rejected'
    }));
  },

  countWithFilters: async (filters: Pick<UserFilters, 'search' | 'status' | 'roleId'>) => {
    const { search, status, roleId } = filters;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    if (roleId) {
      where.roleId = roleId;
    }

    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { username: { contains: searchTerm } },
      ];
    }

    return await prisma.user.count({ where });
  },

  getStatsWithFilters: async (filters: Pick<UserFilters, 'search' | 'status' | 'roleId'>) => {
    const { search, status, roleId } = filters;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    if (roleId) {
      where.roleId = roleId;
    }

    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { username: { contains: searchTerm } },
      ];
    }

    const [total, pending, approved, rejected] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, status: 'pending' } }),
      prisma.user.count({ where: { ...where, status: 'approved' } }),
      prisma.user.count({ where: { ...where, status: 'rejected' } }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
    } as UserStats;
  },

  findById: async (id: number) => {
    return prisma.user.findUnique({ where: { id } });
  },

  delete: async (id: number) => {
    return prisma.user.delete({ where: { id } });
  },
};
