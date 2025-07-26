import { userRepository } from '@/modules/user/user.repository';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { UserFilters, UserWithPagination, PaginationMeta } from './types';

export const userService = {
  create: async (username: string, password: string, roleId: number) => {
    const existingUser = await userRepository.findByUsername(username);
    if (existingUser) throw new Error('Username already taken');

    const hashed = await bcrypt.hash(password, 10);

    // Criar usuário e approval em uma transação
    const result = await prisma.$transaction(async tx => {
      // Criar o usuário
      const user = await tx.user.create({
        data: {
          username,
          password: hashed,
          roleId,
        },
      });

      // Criar o approval automaticamente
      await tx.userApproval.create({
        data: {
          userId: user.id,
          requestedRoleId: roleId,
          status: 'pending',
        },
      });

      return user;
    });

    return result;
  },

  verifyPassword: async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword);
  },

  getAll: () => userRepository.findAll(),

  getAllWithPagination: async (
    filters: UserFilters
  ): Promise<UserWithPagination> => {
    // Execute all queries in parallel for better performance
    const [users, totalItems, stats] = await Promise.all([
      userRepository.findManyWithPagination(filters),
      userRepository.countWithFilters({
        search: filters.search,
        status: filters.status,
        roleId: filters.roleId,
      }),
      userRepository.getStatsWithFilters({
        search: filters.search,
        status: filters.status,
        roleId: filters.roleId,
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
      users,
      pagination,
      stats,
    };
  },

  getById: (id: number) => userRepository.findById(id),

  delete: (id: number) => userRepository.delete(id),
};
