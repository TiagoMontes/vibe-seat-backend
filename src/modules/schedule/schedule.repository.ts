import { prisma } from '@/lib/prisma';
import type {
  ScheduleConfigInput,
  ScheduleConfigUpdateInput,
  ScheduleConfig,
  TimeRange,
} from './types';

// Função para verificar sobreposição de horários
const hasTimeOverlap = (ranges: TimeRange[]): boolean => {
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const range1 = ranges[i];
      const range2 = ranges[j];

      const start1 = range1.start.split(':').map(Number);
      const end1 = range1.end.split(':').map(Number);
      const start2 = range2.start.split(':').map(Number);
      const end2 = range2.end.split(':').map(Number);

      const time1Start = (start1[0] ?? 0) * 60 + (start1[1] ?? 0);
      const time1End = (end1[0] ?? 0) * 60 + (end1[1] ?? 0);
      const time2Start = (start2[0] ?? 0) * 60 + (start2[1] ?? 0);
      const time2End = (end2[0] ?? 0) * 60 + (end2[1] ?? 0);

      if (time1Start < time2End && time1End > time2Start) {
        return true; // Há sobreposição
      }
    }
  }
  return false;
};

export const scheduleRepository = {
  // Cria apenas se não existir nenhum ScheduleConfig
  create: async (data: ScheduleConfigInput): Promise<ScheduleConfig> => {
    const existing = await prisma.scheduleConfig.findFirst();
    if (existing) {
      throw new Error('Já existe uma configuração de agenda.');
    }

    // Verifica sobreposição de horários
    if (hasTimeOverlap(data.timeRanges)) {
      throw new Error('Existe sobreposição entre os horários configurados.');
    }

    // Verifica se todos os dayIds existem
    const existingDays = await prisma.dayOfWeek.findMany({
      where: { id: { in: data.dayIds } },
    });

    if (existingDays.length !== data.dayIds.length) {
      const foundIds = existingDays.map(day => day.id);
      const missingIds = data.dayIds.filter(id => !foundIds.includes(id));
      throw new Error(
        `Dias da semana não encontrados: ${missingIds.join(', ')}`
      );
    }

    // Cria o ScheduleConfig
    const scheduleConfig = await prisma.scheduleConfig.create({
      data: {
        id: 1,
        timeRanges: data.timeRanges,
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

    // Se timeRanges foi fornecido, verifica sobreposição
    if (data.timeRanges && hasTimeOverlap(data.timeRanges)) {
      throw new Error('Existe sobreposição entre os horários configurados.');
    }

    // Atualiza o ScheduleConfig
    const updatedScheduleConfig = await prisma.scheduleConfig.update({
      where: { id: existing.id },
      data: {
        timeRanges: data.timeRanges,
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
        throw new Error(
          `Dias da semana não encontrados: ${missingIds.join(', ')}`
        );
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

  // Atualiza apenas os dias da semana vinculados
  updateDays: async (dayIds: number[]): Promise<ScheduleConfig> => {
    const existing = await prisma.scheduleConfig.findFirst();
    if (!existing) {
      throw new Error('Nenhuma configuração encontrada para atualizar.');
    }

    // Verifica se todos os dayIds existem
    const existingDays = await prisma.dayOfWeek.findMany({
      where: { id: { in: dayIds } },
    });

    if (existingDays.length !== dayIds.length) {
      const foundIds = existingDays.map(day => day.id);
      const missingIds = dayIds.filter(id => !foundIds.includes(id));
      throw new Error(
        `Dias da semana não encontrados: ${missingIds.join(', ')}`
      );
    }

    // Remove relacionamentos existentes
    await prisma.dayOfWeek.updateMany({
      where: { scheduleConfigId: existing.id },
      data: { scheduleConfigId: null },
    });

    // Cria novos relacionamentos
    await Promise.all(
      dayIds.map(dayId =>
        prisma.dayOfWeek.update({
          where: { id: dayId },
          data: { scheduleConfigId: existing.id },
        })
      )
    );

    // Busca a configuração atualizada com os dias relacionados
    const updatedConfig = await prisma.scheduleConfig.findFirst({
      where: { id: existing.id },
      include: {
        days: true,
      },
    });

    if (!updatedConfig) {
      throw new Error('Erro ao buscar configuração atualizada.');
    }

    return updatedConfig;
  },
};
