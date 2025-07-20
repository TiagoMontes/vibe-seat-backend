import { prisma } from "@/lib/prisma";
import type { AppointmentStatus } from "@prisma/client";

export const appointmentRepository = {
  // Cria agendamento
  create: (data: {
    userId: number;
    chairId: number;
    datetimeStart: Date;
    datetimeEnd: Date;
  }) => prisma.appointment.create({ data }),

  // Busca todos (admin)
  findAll: () => prisma.appointment.findMany(),

  // Busca por usuário
  findByUser: (userId: number) =>
    prisma.appointment.findMany({ where: { userId } }),

  // Busca conflitos (cadeira OU usuário)
  findConflicts: (
    chairId: number,
    userId: number,
    start: Date,
    end: Date
  ) =>
    prisma.appointment.findMany({
      where: {
        status: "SCHEDULED",
        OR: [
          {
            chairId,
            datetimeStart: { lt: end },
            datetimeEnd:   { gt: start },
          },
          {
            userId,
            datetimeStart: { lt: end },
            datetimeEnd:   { gt: start },
          },
        ],
      },
    }),

  // Atualiza status ou presença
  update: (id: number, data: Partial<{ status: AppointmentStatus; presenceConfirmed: boolean }>) =>
    prisma.appointment.update({ where: { id }, data }),
};