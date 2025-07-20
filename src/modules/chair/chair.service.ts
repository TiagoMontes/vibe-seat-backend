import type { ChairInput, ChairUpdateInput } from "@/modules/chair/types";
import { chairRepository } from "@/modules/chair/chair.repository";
import { prisma } from "@/lib/prisma";

export const chairService = {
	create: async (data: ChairInput) => {
		try {
			return await prisma.chair.create({ data });
		} catch (error: any) {
			if (
				error.code === "P2002" &&
				error.meta?.target?.includes("name")
			) {
				throw new Error("Já existe uma cadeira com esse nome.");
			}
			throw error;
		}
	},
  getAll: () => chairRepository.findAll(),
  getById: (id: number) => chairRepository.findById(id),
  update: async (id: number, data: ChairUpdateInput) => {
    const existing = await prisma.chair.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Cadeira não encontrada');
    }

    const updated = await prisma.chair.update({
      where: { id },
      data,
    });

    return updated;
  },
  delete: (id: number) => chairRepository.delete(id),
};