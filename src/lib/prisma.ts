import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Utilitários para hard delete quando necessário
export const hardDelete = {
  // Hard delete para qualquer model
  delete: async (model: any, where: any) => {
    return await model.delete({ where });
  },

  // Hard delete many para qualquer model
  deleteMany: async (model: any, where: any) => {
    return await model.deleteMany({ where });
  },

  // Buscar incluindo registros deletados
  findWithDeleted: async (model: any, where: any = {}) => {
    return await model.findMany({ where });
  },

  // Restaurar registro deletado
  restore: async (model: any, where: any) => {
    return await model.update({
      where,
      data: { deletedAt: null },
    });
  },
};
