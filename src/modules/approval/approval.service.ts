import { prisma } from '@/lib/prisma';
import { approvalRepository } from './approval.repository';
import type { ApprovalFilters, ApprovalWithPagination, PaginationMeta } from './types';

export const approvalService = {
  allPendingApprovals: async () => {
    return prisma.userApproval.findMany({
      where: { status: 'pending' },
      include: { user: true, requestedRole: true },
    });
  },

  getAll: () => approvalRepository.findAll(),

  getAllWithPagination: async (filters: ApprovalFilters): Promise<ApprovalWithPagination> => {
    // Execute all queries in parallel for better performance
    const [approvals, totalItems, stats] = await Promise.all([
      approvalRepository.findManyWithPagination(filters),
      approvalRepository.countWithFilters({
        search: filters.search,
        status: filters.status,
      }),
      approvalRepository.getStatsWithFilters({
        search: filters.search,
        status: filters.status,
      }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / filters.limit);
    const hasNextPage = filters.page < totalPages;
    const hasPrevPage = filters.page > 1;
    const nextPage = hasNextPage ? filters.page + 1 : null;
    const prevPage = hasPrevPage ? filters.page - 1 : null;
    const lastPage = totalPages;

    const pagination: PaginationMeta = {
      currentPage: filters.page,
      totalPages,
      totalItems,
      itemsPerPage: filters.limit,
      hasNextPage,
      hasPrevPage,
      nextPage,
      prevPage,
      lastPage,
    };

    return {
      approvals,
      pagination,
      stats,
    };
  },

  getById: async (id: number) => {
    return approvalRepository.findById(id);
  },

  updateApprovalStatus: async (
    id: number,
    status: 'approved' | 'rejected',
    approverId: number
  ) => {
    const approval = await prisma.userApproval.findUnique({
      where: { id },
      include: { user: true, requestedRole: true },
    });

    if (!approval) {
      throw new Error('Solicitação de aprovação não encontrada.');
    }

    if (approval.status !== 'pending') {
      throw new Error('Esta solicitação já foi processada.');
    }

    const updatedApproval = await prisma.userApproval.update({
      where: { id },
      data: {
        status,
        approvedById: approverId,
      },
    });

    await prisma.user.update({
      where: { id: approval.userId },
      data: {
        status,
        roleId: status === 'approved' ? approval.requestedRoleId : undefined,
      },
    });

    return {
      message: `Usuário ${status} com sucesso.`,
      approval: updatedApproval,
    };
  },
};
