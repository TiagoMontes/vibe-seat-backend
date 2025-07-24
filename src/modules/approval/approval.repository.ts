import { prisma } from '@/lib/prisma';
import type { ApprovalFilters, ApprovalStats } from './types';

export const approvalRepository = {
  findAll: () => prisma.userApproval.findMany({
    include: { 
      user: true, 
      requestedRole: true,
    },
  }),

  findManyWithPagination: async (filters: ApprovalFilters) => {
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
        { user: { username: { contains: searchTerm } } },
        { requestedRole: { name: { contains: searchTerm } } },
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
      case 'user-asc':
        orderBy = { user: { username: 'asc' } };
        break;
      case 'user-desc':
        orderBy = { user: { username: 'desc' } };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const results = await prisma.userApproval.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      select: {
        id: true,
        userId: true,
        requestedRoleId: true,
        status: true,
        approvedById: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true
          },
        },
        requestedRole: {
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

  countWithFilters: async (filters: Pick<ApprovalFilters, 'search' | 'status'>) => {
    const { search, status } = filters;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { user: { username: { contains: searchTerm } } },
        { requestedRole: { name: { contains: searchTerm } } },
      ];
    }

    return await prisma.userApproval.count({ where });
  },

  getStatsWithFilters: async (filters: Pick<ApprovalFilters, 'search' | 'status'>) => {
    const { search, status } = filters;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { user: { username: { contains: searchTerm } } },
        { requestedRole: { name: { contains: searchTerm } } },
      ];
    }

    const [total, pending, approved, rejected] = await Promise.all([
      prisma.userApproval.count({ where }),
      prisma.userApproval.count({ where: { ...where, status: 'pending' } }),
      prisma.userApproval.count({ where: { ...where, status: 'approved' } }),
      prisma.userApproval.count({ where: { ...where, status: 'rejected' } }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
    } as ApprovalStats;
  },

  findById: (id: number) => prisma.userApproval.findUnique({
    where: { id },
    include: { 
      user: true, 
      requestedRole: true,
    },
  }),
};
