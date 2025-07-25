import { prisma } from '@/lib/prisma';
import type {
  ScheduleConfigInput,
  ScheduleConfigUpdateInput,
  ScheduleConfig,
} from './types';

export const scheduleRepository = {
  // Cria apenas se não existir nenhum ScheduleConfig
  create: async (data: ScheduleConfigInput): Promise<ScheduleConfig> => {
    const existing = await prisma.scheduleConfig.findFirst();
    if (existing) {
      throw new Error('Já existe uma configuração de agenda.');
    }

    // Verifica se todos os dayIds existem
    const existingDays = await prisma.dayOfWeek.findMany({
      where: { id: { in: data.dayIds } },
    });

    if (existingDays.length !== data.dayIds.length) {
      const foundIds = existingDays.map(day => day.id);
      const missingIds = data.dayIds.filter(id => !foundIds.includes(id));
      throw new Error(`Dias da semana não encontrados: ${missingIds.join(', ')}`);
    }

    // Cria o ScheduleConfig
    const scheduleConfig = await prisma.scheduleConfig.create({
      data: {
        id: 1,
        timeStart: data.timeStart,
        timeEnd: data.timeEnd,
        validFrom: data.validFrom,
        validTo: data.validTo,
      },
    });

    // Relaciona com os DayOfWeek existentes
    await Promise.all(
      data.dayIds.map(dayId =>
        prisma.dayOfWeek.update({
          where: { id: dayId },
          data: { scheduleConfigId: 1 },
        })
      )
    );

    // Busca os dias relacionados
    const days = await prisma.dayOfWeek.findMany({
      where: { scheduleConfigId: 1 },
    });

    return {
      ...scheduleConfig,
      days,
    };
  },

  // Busca a única configuração existente (ou null)
  find: async (): Promise<ScheduleConfig | null> => {
    const scheduleConfig = await prisma.scheduleConfig.findFirst({
      include: {
        days: true,
      },
    });

    return scheduleConfig;
  },

  // Atualiza a configuração existente
  update: async (data: ScheduleConfigUpdateInput): Promise<ScheduleConfig> => {
    const existing = await prisma.scheduleConfig.findFirst();
    if (!existing) {
      throw new Error('Nenhuma configuração encontrada para atualizar.');
    }

    // Atualiza o ScheduleConfig
    const updatedScheduleConfig = await prisma.scheduleConfig.update({
      where: { id: existing.id },
      data: {
        timeStart: data.timeStart,
        timeEnd: data.timeEnd,
        validFrom: data.validFrom,
        validTo: data.validTo,
      },
    });

    // Se dayIds foi fornecido, atualiza os relacionamentos
    if (data.dayIds) {
      // Verifica se todos os dayIds existem
      const existingDays = await prisma.dayOfWeek.findMany({
        where: { id: { in: data.dayIds } },
      });

      if (existingDays.length !== data.dayIds.length) {
        const foundIds = existingDays.map(day => day.id);
        const missingIds = data.dayIds.filter(id => !foundIds.includes(id));
        throw new Error(`Dias da semana não encontrados: ${missingIds.join(', ')}`);
      }

      // Remove relacionamentos existentes
      await prisma.dayOfWeek.updateMany({
        where: { scheduleConfigId: existing.id },
        data: { scheduleConfigId: null },
      });

      // Cria novos relacionamentos
      await Promise.all(
        data.dayIds.map(dayId =>
          prisma.dayOfWeek.update({
            where: { id: dayId },
            data: { scheduleConfigId: existing.id },
          })
        )
      );

      // Busca os dias relacionados
      const days = await prisma.dayOfWeek.findMany({
        where: { scheduleConfigId: existing.id },
      });

      return {
        ...updatedScheduleConfig,
        days,
      };
    }

    // Se dayIds não foi fornecido, busca os dias existentes
    const days = await prisma.dayOfWeek.findMany({
      where: { scheduleConfigId: existing.id },
    });

    return {
      ...updatedScheduleConfig,
      days,
    };
  },

  // Deleta a configuração existente
  remove: async (): Promise<void> => {
    const existing = await prisma.scheduleConfig.findFirst();
    if (!existing) {
      throw new Error('Nenhuma configuração encontrada para deletar.');
    }

    // Remove os relacionamentos primeiro
    await prisma.dayOfWeek.updateMany({
      where: { scheduleConfigId: existing.id },
      data: { scheduleConfigId: null },
    });

    // Remove o ScheduleConfig
    await prisma.scheduleConfig.delete({
      where: { id: existing.id },
    });
  },
};
