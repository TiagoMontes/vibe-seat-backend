import { prisma } from "@/lib/prisma";
import type { ChairInput } from "@/modules/chair/types";

export const chairRepository = {
  create: (data: ChairInput) => prisma.chair.create({ data }),
  findAll: () => prisma.chair.findMany(),
  findById: (id: number) => prisma.chair.findUnique({ where: { id } }),
  update: (id: number, data: Partial<ChairInput>) =>
    prisma.chair.update({ where: { id }, data }),
  delete: (id: number) => prisma.chair.delete({ where: { id } }),
};