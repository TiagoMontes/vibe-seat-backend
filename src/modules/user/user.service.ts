import { userRepository } from '@/modules/user/user.repository';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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

  getById: (id: number) => userRepository.findById(id),

  delete: (id: number) => userRepository.delete(id),
};
