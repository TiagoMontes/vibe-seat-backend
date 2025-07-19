import { userRepository } from '@/modules/user/user.repository';
import bcrypt from 'bcryptjs';

export const userService = {
  create: async (username: string, password: string, roleId: number) => {
    const existingUser = await userRepository.findByUsername(username);
    if (existingUser) throw new Error('Username already taken');

    const hashed = await bcrypt.hash(password, 10);
    return userRepository.create({ username, password: hashed, roleId });
  },

  verifyPassword: async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword);
  },

  getAll: () => userRepository.findAll(),

  getById: (id: number) => userRepository.findById(id),

  delete: (id: number) => userRepository.delete(id),
};