import type { ChairInput, ChairUpdateInput, ChairFilters, ChairWithPagination, PaginationMeta } from '@/modules/chair/types';
import { chairRepository } from '@/modules/chair/chair.repository';
import { prisma } from '@/lib/prisma';

export const chairService = {
  create: async (data: ChairInput) => {
    try {
      return await prisma.chair.create({ data });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error as any).code === 'P2002' &&
        (error as any).meta?.target?.includes('name')
      ) {
        throw new Error('Já existe uma cadeira com esse nome.');
      }
      throw error;
    }
  },

  getAll: () => chairRepository.findAll(),

  getAllWithPagination: async (filters: ChairFilters): Promise<ChairWithPagination> => {
    // Execute all queries in parallel for better performance
    const [chairs, totalItems, stats] = await Promise.all([
      chairRepository.findManyWithPagination(filters),
      chairRepository.countWithFilters({
        search: filters.search,
        status: filters.status,
      }),
      chairRepository.getStatsWithFilters({
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
      chairs,
      pagination,
      stats,
    };
  },

  getById: async (id: number) => {
    const chair = await chairRepository.findById(id);
    if (!chair) throw new Error('Cadeira não encontrada');
    return chair;
  },

  update: async (id: number, data: ChairUpdateInput) => {
    const existing = await prisma.chair.findUnique({ where: { id } });
    if (!existing) throw new Error('Cadeira não encontrada');

    return await prisma.chair.update({
      where: { id },
      data,
    });
  },

  delete: async (id: number) => {
    const existing = await chairRepository.findById(id);
    if (!existing) throw new Error('Cadeira não encontrada');

    return chairRepository.delete(id);
  },
};
