import { userRepository } from './user.repository';

export const userService = {
  create: async (username: string, password: string, roleId: number) => {
    const existingUser = await userRepository.findByUsername(username);
    if (existingUser) throw new Error('Username already taken');

    const hashed = await Bun.password.hash(password, "bcrypt");
    return userRepository.create({ username, password: hashed, roleId });
  },

  verifyPassword: async (password: string, hashedPassword: string) => {
    return await Bun.password.verify(password, hashedPassword);
  },

  getAll: () => userRepository.findAll(),

  getById: (id: number) => userRepository.findById(id),

  delete: (id: number) => userRepository.delete(id),
};