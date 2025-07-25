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
  update: async (data: ScheduleConfigUpdateInput): Promise<ScheduleConfig> => {
    return scheduleRepository.update(data);
  },

  // Remove a configuração existente
  remove: async (): Promise<void> => {
    return scheduleRepository.remove();
  },
};
