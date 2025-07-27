import type {
  ChairInput,
  ChairUpdateInput,
  ChairFilters,
  ChairWithPagination,
  PaginationMeta,
  ChairQueryParams,
} from '@/modules/chair/types';
import { chairRepository } from '@/modules/chair/chair.repository';
import { prisma } from '@/lib/prisma';

const validateAndParseQueryParams = (query: ChairQueryParams): ChairFilters => {
  // Parse and validate page
  let page = parseInt(query.page || '1', 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  // Parse and validate limit
  let limit = parseInt(query.limit || '9', 10);
  if (isNaN(limit) || limit < 1 || limit > 50) {
    limit = 9;
  }

  // Validate status
  const validStatuses = ['ACTIVE', 'MAINTENANCE', 'INACTIVE'];
  const status =
    query.status && validStatuses.includes(query.status)
      ? query.status
      : undefined;

  // Validate sortBy
  const validSortOptions = ['newest', 'oldest', 'name-asc', 'name-desc'];
  const sortBy =
    query.sortBy && validSortOptions.includes(query.sortBy)
      ? query.sortBy
      : 'newest';

  // Sanitize search
  const search = query.search ? query.search.trim() : undefined;

  return {
    page,
    limit,
    search,
    status,
    sortBy,
  };
};

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

  getInsights: () => chairRepository.getInsights(),

  getAllWithPagination: async (
    filters: ChairFilters
  ): Promise<ChairWithPagination> => {
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

  // Novo método para processar query params
  processQueryParams: (query: ChairQueryParams) => {
    return validateAndParseQueryParams(query);
  },

  // Novo método para verificar se há parâmetros de query
  hasQueryParams: (query: ChairQueryParams) => {
    return Object.keys(query).length > 0;
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
