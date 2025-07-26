import type {
  ScheduleConfigInput,
  ScheduleConfigUpdateInput,
  ScheduleConfig,
} from './types';
import { scheduleRepository } from './schedule.repository';

export const scheduleService = {
  // Cria a configuração se não existir
  create: async (input: ScheduleConfigInput): Promise<ScheduleConfig> => {
    return scheduleRepository.create(input);
  },

  // Busca a configuração existente (ou null)
  get: async (): Promise<ScheduleConfig | null> => {
    return scheduleRepository.find();
  },

  // Atualiza a configuração existente
  update: async (data: ScheduleConfigUpdateInput, id?: string): Promise<ScheduleConfig> => {
    // Valida se o ID é 1 (singleton)
    if (id && id !== '1') {
      throw new Error('ID inválido. A configuração de agenda é um singleton com ID = 1.');
    }
    return scheduleRepository.update(data);
  },

  // Remove a configuração existente
  remove: async (id?: string): Promise<void> => {
    // Valida se o ID é 1 (singleton)
    if (id && id !== '1') {
      throw new Error('ID inválido. A configuração de agenda é um singleton com ID = 1.');
    }
    return scheduleRepository.remove();
  },

  // Atualiza apenas os dias da semana vinculados
  updateDays: async (dayIds: number[]): Promise<ScheduleConfig> => {
    return scheduleRepository.updateDays(dayIds);
  },
};
