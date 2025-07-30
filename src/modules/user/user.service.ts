import { userRepository } from '@/modules/user/user.repository';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { auditService } from '@/modules/audit/audit.service';
import type {
  UserFilters,
  UserWithPagination,
  PaginationMeta,
  UserInput,
  UserUpdateInput,
} from './types';
import type { AuditContext } from '@/modules/audit/types';

export const userService = {
  create: async (input: UserInput, context?: AuditContext) => {
    // Check for existing unique fields
    const [existingUsername, existingCpf, existingEmail, existingRegistration] =
      await Promise.all([
        userRepository.findByUsername(input.username),
        prisma.user.findFirst({ where: { cpf: input.cpf } }),
        prisma.user.findFirst({ where: { email: input.email } }),
        prisma.user.findFirst({ where: { registration: input.registration } }),
      ]);

    if (existingUsername) throw new Error('Username já está em uso');
    if (existingCpf) throw new Error('CPF já está cadastrado');
    if (existingEmail) throw new Error('E-mail já está cadastrado');
    if (existingRegistration) throw new Error('Matrícula já está cadastrada');

    const hashed = await bcrypt.hash(input.password, 10);

    // Criar usuário e approval em uma transação
    const result = await prisma.$transaction(async tx => {
      // Criar o usuário
      const user = await tx.user.create({
        data: {
          username: input.username,
          password: hashed,
          roleId: input.roleId,
          fullName: input.fullName,
          cpf: input.cpf,
          jobFunction: input.jobFunction,
          position: input.position,
          registration: input.registration,
          sector: input.sector,
          email: input.email,
          phone: input.phone,
          gender: input.gender,
          birthDate: new Date(input.birthDate),
        },
      });

      // Criar o approval automaticamente
      await tx.userApproval.create({
        data: {
          userId: user.id,
          requestedRoleId: input.roleId,
          status: 'pending',
        },
      });

      return user;
    });

    // Log da criação do usuário (sem dados sensíveis)
    try {
      await auditService.logCreate(
        'User',
        result.id,
        {
          username: result.username,
          roleId: result.roleId,
          fullName: result.fullName,
          cpf: result.cpf,
          jobFunction: result.jobFunction,
          position: result.position,
          registration: result.registration,
          sector: result.sector,
          email: result.email,
          phone: result.phone,
          gender: result.gender,
          birthDate: result.birthDate,
          status: result.status,
        },
        context
      );
    } catch (error) {
      console.error('Erro ao auditar criação de usuário:', error);
    }

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

  update: async (id: number, input: UserUpdateInput, context?: AuditContext) => {
    // Check if user exists
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    // Validate input fields if provided
    const { email, cpf, gender, birthDate } = input;

    // Email validation
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('E-mail inválido');
      }
    }

    // CPF validation (basic format)
    if (cpf !== undefined) {
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
      if (!cpfRegex.test(cpf)) {
        throw new Error(
          'CPF deve estar no formato XXX.XXX.XXX-XX ou apenas números'
        );
      }
    }

    // Gender validation
    if (gender !== undefined && !['M', 'F', 'Outro'].includes(gender)) {
      throw new Error('Sexo deve ser M, F ou Outro');
    }

    // Birth date validation
    if (birthDate !== undefined) {
      const birthDateObj = new Date(birthDate);
      if (isNaN(birthDateObj.getTime())) {
        throw new Error('Data de nascimento inválida');
      }
    }

    // Prepare update data
    const updateData: any = {};

    // Handle each field that might be updated
    if (input.username !== undefined) {
      // Check if username is already taken by another user
      const existingUsername = await userRepository.findByUsername(
        input.username
      );
      if (existingUsername && existingUsername.id !== id) {
        throw new Error('Username já está em uso');
      }
      updateData.username = input.username;
    }

    if (input.password !== undefined) {
      updateData.password = await bcrypt.hash(input.password, 10);
    }

    if (input.roleId !== undefined) {
      updateData.roleId = input.roleId;
    }

    if (input.fullName !== undefined) {
      updateData.fullName = input.fullName;
    }

    if (input.cpf !== undefined) {
      // Check if CPF is already taken by another user
      const existingCpf = await prisma.user.findFirst({
        where: { cpf: input.cpf },
      });
      if (existingCpf && existingCpf.id !== id) {
        throw new Error('CPF já está cadastrado');
      }
      updateData.cpf = input.cpf;
    }

    if (input.jobFunction !== undefined) {
      updateData.jobFunction = input.jobFunction;
    }

    if (input.position !== undefined) {
      updateData.position = input.position;
    }

    if (input.registration !== undefined) {
      // Check if registration is already taken by another user
      const existingRegistration = await prisma.user.findFirst({
        where: { registration: input.registration },
      });
      if (existingRegistration && existingRegistration.id !== id) {
        throw new Error('Matrícula já está cadastrada');
      }
      updateData.registration = input.registration;
    }

    if (input.sector !== undefined) {
      updateData.sector = input.sector;
    }

    if (input.email !== undefined) {
      // Check if email is already taken by another user
      const existingEmail = await prisma.user.findFirst({
        where: { email: input.email },
      });
      if (existingEmail && existingEmail.id !== id) {
        throw new Error('E-mail já está cadastrado');
      }
      updateData.email = input.email;
    }

    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }

    if (input.gender !== undefined) {
      updateData.gender = input.gender;
    }

    if (input.birthDate !== undefined) {
      updateData.birthDate = new Date(input.birthDate);
    }

    // If no fields to update, return the existing user
    if (Object.keys(updateData).length === 0) {
      return existingUser;
    }

    // Update the user
    const updatedUser = await userRepository.update(id, updateData);

    // Log da atualização do usuário
    try {
      await auditService.logUpdate(
        'User',
        id,
        {
          username: existingUser.username,
          roleId: existingUser.roleId,
          fullName: existingUser.fullName,
          cpf: existingUser.cpf,
          jobFunction: existingUser.jobFunction,
          position: existingUser.position,
          registration: existingUser.registration,
          sector: existingUser.sector,
          email: existingUser.email,
          phone: existingUser.phone,
          gender: existingUser.gender,
          birthDate: existingUser.birthDate,
        },
        {
          username: updatedUser.username,
          roleId: updatedUser.roleId,
          fullName: updatedUser.fullName,
          cpf: updatedUser.cpf,
          jobFunction: updatedUser.jobFunction,
          position: updatedUser.position,
          registration: updatedUser.registration,
          sector: updatedUser.sector,
          email: updatedUser.email,
          phone: updatedUser.phone,
          gender: updatedUser.gender,
          birthDate: updatedUser.birthDate,
        },
        context
      );
    } catch (error) {
      console.error('Erro ao auditar atualização de usuário:', error);
    }

    return updatedUser;
  },

  delete: async (id: number, context?: AuditContext) => {
    // Buscar dados do usuário antes de deletar
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    // Executar o delete
    const result = await userRepository.delete(id);

    // Log da exclusão do usuário
    try {
      await auditService.logDelete(
        'User',
        id,
        {
          username: existingUser.username,
          roleId: existingUser.roleId,
          fullName: existingUser.fullName,
          cpf: existingUser.cpf,
          jobFunction: existingUser.jobFunction,
          position: existingUser.position,
          registration: existingUser.registration,
          sector: existingUser.sector,
          email: existingUser.email,
          phone: existingUser.phone,
          gender: existingUser.gender,
          birthDate: existingUser.birthDate,
          status: existingUser.status,
        },
        context
      );
    } catch (error) {
      console.error('Erro ao auditar exclusão de usuário:', error);
    }

    return result;
  },
};
