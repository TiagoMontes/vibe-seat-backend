import { appointmentRepository } from './appointment.repository';
import { prisma } from '@/lib/prisma';
import type { AppointmentInput } from './types';

const APPOINTMENT_DURATION_MINUTES = 30;
const CANCELLATION_NOTICE_HOURS = 3;

export const appointmentService = {
  // 1) Criar novo agendamento
  create: async (userId: number, input: AppointmentInput) => {
    const start = new Date(input.datetimeStart);
    const end = new Date(
      start.getTime() + APPOINTMENT_DURATION_MINUTES * 60000
    );

    // 1.1) Conflitos
    const conflicts = await appointmentRepository.findConflicts(
      input.chairId,
      userId,
      start,
      end
    );
    if (conflicts.length > 0) {
      throw new Error('Conflito de horário para usuário ou cadeira.');
    }

    // 1.2) Disponibilidade global
    const dayOfWeek = start.getDay();
    const time = start.toTimeString().slice(0, 5); // "HH:MM"
    const configs = await prisma.scheduleConfig.findMany({
      where: {
        dayOfWeek,
        timeStart: { lte: time },
        timeEnd: { gte: time },
        validFrom: { lte: start },
        validTo: { gte: start },
      },
    });
    if (configs.length === 0) {
      throw new Error('Horário fora da disponibilidade configurada.');
    }

    return appointmentRepository.create({
      userId,
      chairId: input.chairId,
      datetimeStart: start,
      datetimeEnd: end,
    });
  },

  // 2) Listar agendamentos (admin vê todos, usuário apenas os seus)
  getAll: async (userId: number, role: string) => {
    if (role === 'admin') {
      return appointmentRepository.findAll();
    }
    return appointmentRepository.findByUser(userId);
  },

  // 3) Cancelar agendamento
  cancel: async (id: number, userId: number, role: string) => {
    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw new Error('Agendamento não encontrado.');

    // Usuário só cancela seus próprios, e com antecedência
    if (role !== 'admin') {
      if (appt.userId !== userId) {
        throw new Error('Não pode cancelar agendamento de outro usuário.');
      }
      const now = new Date();
      const diffHours =
        (appt.datetimeStart.getTime() - now.getTime()) / 3600000;
      if (diffHours < CANCELLATION_NOTICE_HOURS) {
        throw new Error(
          `É necessário cancelar com pelo menos ${CANCELLATION_NOTICE_HOURS}h de antecedência.`
        );
      }
    }

    return appointmentRepository.update(id, { status: 'CANCELLED' });
  },

  // 4) Confirmar presença (somente admin/atendente)
  confirm: async (id: number) => {
    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw new Error('Agendamento não encontrado.');
    return appointmentRepository.update(id, {
      status: 'CONFIRMED',
      presenceConfirmed: true,
    });
  },
};
