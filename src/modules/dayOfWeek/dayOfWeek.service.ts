import type {
  DayOfWeekInput,
  DayOfWeekUpdateInput,
  DayOfWeekFilters,
  DayOfWeek,
  DayOfWeekWithPagination,
  PaginationMeta,
} from './types';
import { dayOfWeekRepository } from './dayOfWeek.repository';

export const dayOfWeekService = {
  create: async (input: DayOfWeekInput): Promise<DayOfWeek> => {
    // Verifica se já existe um dia com esse nome
    const existing = await dayOfWeekRepository.findByName(input.name);
    if (existing) {
      throw new Error(`Já existe um dia da semana com o nome "${input.name}".`);
    }

    return dayOfWeekRepository.create(input);
  },

  getAll: (): Promise<DayOfWeek[]> => dayOfWeekRepository.findAll(),

  getById: async (id: number): Promise<DayOfWeek> => {
    const day = await dayOfWeekRepository.findById(id);
    if (!day) throw new Error('Dia da semana não encontrado.');
    return day;
  },

  update: async (
    id: number,
    data: DayOfWeekUpdateInput
  ): Promise<DayOfWeek> => {
    await dayOfWeekService.getById(id);

    // Se está atualizando o nome, verifica se já existe outro com esse nome
    if (data.name) {
      const existing = await dayOfWeekRepository.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new Error(
          `Já existe um dia da semana com o nome "${data.name}".`
        );
      }
    }

    return dayOfWeekRepository.update(id, data);
  },

  remove: async (id: number): Promise<void> => {
    await dayOfWeekService.getById(id);
    await dayOfWeekRepository.remove(id);
  },

  removeMany: async (ids: number[]): Promise<void> => {
    await dayOfWeekRepository.removeMany(ids);
  },
};
