import type {
  ScheduleConfigInput,
  ScheduleConfigUpdateInput,
  ScheduleConfig,
} from './types';
import { scheduleRepository } from './schedule.repository';
import { auditService } from '@/modules/audit/audit.service';
import type { AuditContext } from '@/modules/audit/types';

export const scheduleService = {
  // Cria a configuração se não existir
  create: async (input: ScheduleConfigInput, context?: AuditContext): Promise<ScheduleConfig> => {
    const createdConfig = await scheduleRepository.create(input);

    // Log da criação da configuração de agenda
    try {
      await auditService.logCreate(
        'ScheduleConfig',
        createdConfig.id,
        {
          timeRanges: createdConfig.timeRanges,
          validFrom: createdConfig.validFrom,
          validTo: createdConfig.validTo,
        },
        context
      );
    } catch (error) {
      console.error('Erro ao auditar criação de configuração de agenda:', error);
    }

    return createdConfig;
  },

  // Busca a configuração existente (ou null)
  get: async (): Promise<ScheduleConfig | null> => {
    return scheduleRepository.find();
  },

  // Atualiza a configuração existente
  update: async (
    data: ScheduleConfigUpdateInput,
    id?: string,
    context?: AuditContext
  ): Promise<ScheduleConfig> => {
    // Valida se o ID é 1 (singleton)
    if (id && id !== '1') {
      throw new Error(
        'ID inválido. A configuração de agenda é um singleton com ID = 1.'
      );
    }

    // Buscar configuração existente para auditoria
    const existing = await scheduleRepository.find();

    const updatedConfig = await scheduleRepository.update(data);

    // Log da atualização da configuração de agenda
    try {
      if (existing) {
        await auditService.logUpdate(
          'ScheduleConfig',
          1, // Sempre ID 1 (singleton)
          {
            timeRanges: existing.timeRanges,
            validFrom: existing.validFrom,
            validTo: existing.validTo,
          },
          {
            timeRanges: updatedConfig.timeRanges,
            validFrom: updatedConfig.validFrom,
            validTo: updatedConfig.validTo,
          },
          context
        );
      }
    } catch (error) {
      console.error('Erro ao auditar atualização de configuração de agenda:', error);
    }

    return updatedConfig;
  },

  // Remove a configuração existente
  remove: async (id?: string, context?: AuditContext): Promise<void> => {
    // Valida se o ID é 1 (singleton)
    if (id && id !== '1') {
      throw new Error(
        'ID inválido. A configuração de agenda é um singleton com ID = 1.'
      );
    }

    // Buscar configuração existente para auditoria
    const existing = await scheduleRepository.find();

    await scheduleRepository.remove();

    // Log da remoção da configuração de agenda
    try {
      if (existing) {
        await auditService.logDelete(
          'ScheduleConfig',
          1, // Sempre ID 1 (singleton)
          {
            timeRanges: existing.timeRanges,
            validFrom: existing.validFrom,
            validTo: existing.validTo,
          },
          context
        );
      }
    } catch (error) {
      console.error('Erro ao auditar remoção de configuração de agenda:', error);
    }
  },

  // Atualiza apenas os dias da semana vinculados
  updateDays: async (
    dayIds: number[],
    id?: string,
    context?: AuditContext
  ): Promise<ScheduleConfig> => {
    // Valida se o ID é 1 (singleton)
    if (id && id !== '1') {
      throw new Error(
        'ID inválido. A configuração de agenda é um singleton com ID = 1.'
      );
    }

    // Valida se dayIds é um array válido
    if (!dayIds || !Array.isArray(dayIds)) {
      throw new Error('dayIds deve ser um array de números');
    }

    // Buscar configuração existente para auditoria
    const existing = await scheduleRepository.find();

    const updatedConfig = await scheduleRepository.updateDays(dayIds);

    // Log da atualização dos dias da semana
    try {
      if (existing) {
        await auditService.logUpdate(
          'ScheduleConfig',
          1, // Sempre ID 1 (singleton)
          {
            timeRanges: existing.timeRanges,
            validFrom: existing.validFrom,
            validTo: existing.validTo,
            dayIds: existing.days?.map(day => day.id) || [],
          },
          {
            timeRanges: updatedConfig.timeRanges,
            validFrom: updatedConfig.validFrom,
            validTo: updatedConfig.validTo,
            dayIds: updatedConfig.days?.map(day => day.id) || [],
          },
          context
        );
      }
    } catch (error) {
      console.error('Erro ao auditar atualização de dias da semana:', error);
    }

    return updatedConfig;
  },
};
