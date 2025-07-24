import type {
  ScheduleConfigInput,
  ScheduleConfigSingleInput,
  ScheduleConfigUpdateInput,
  ScheduleFilters,
  ScheduleWithPagination,
  PaginationMeta,
} from './types';
import { scheduleRepository } from './schedule.repository';

export const scheduleService = {
  create: async (input: ScheduleConfigInput) => {
    const { daysOfWeek, timeStart, timeEnd, validFrom, validTo } = input;

    // Verifica conflitos para cada dia
    const all = await scheduleRepository.findAll();

    for (const dayOfWeek of daysOfWeek) {
      // Busca configurações existentes para este dia da semana
      const existingForDay = all.filter(cfg => cfg.dayOfWeek === dayOfWeek);

      for (const existing of existingForDay) {
        // Verifica se há sobreposição de período de validade
        const hasDateOverlap =
          (!validFrom ||
            !existing.validTo ||
            new Date(validFrom) <= new Date(existing.validTo)) &&
          (!validTo ||
            !existing.validFrom ||
            new Date(validTo) >= new Date(existing.validFrom));

        if (hasDateOverlap) {
          // Verifica se há sobreposição de horário
          const newStartTime = timeStart.split(':').map(Number);
          const newEndTime = timeEnd.split(':').map(Number);
          const existingStartTime = existing.timeStart.split(':').map(Number);
          const existingEndTime = existing.timeEnd.split(':').map(Number);

          const newStart =
            (newStartTime?.[0] ?? 0) * 60 + (newStartTime?.[1] ?? 0);
          const newEnd = (newEndTime?.[0] ?? 0) * 60 + (newEndTime?.[1] ?? 0);
          const existingStart =
            (existingStartTime?.[0] ?? 0) * 60 + (existingStartTime?.[1] ?? 0);
          const existingEnd =
            (existingEndTime?.[0] ?? 0) * 60 + (existingEndTime?.[1] ?? 0);

          const hasTimeOverlap =
            newStart < existingEnd && newEnd > existingStart;

          if (hasTimeOverlap) {
            throw new Error(
              `Conflito no dia ${dayOfWeek}: horário ${timeStart}-${timeEnd} sobrepõe com ${existing.timeStart}-${existing.timeEnd}`
            );
          }
        }
      }
    }

    // Cria um registro por dia
    const created = await Promise.all(
      daysOfWeek.map(dayOfWeek => {
        const single: ScheduleConfigSingleInput = {
          dayOfWeek,
          timeStart,
          timeEnd,
          validFrom,
          validTo,
        };
        return scheduleRepository.create(single);
      })
    );

    return created;
  },

  getAll: () => scheduleRepository.findAll(),

  getAllWithPagination: async (filters: ScheduleFilters): Promise<ScheduleWithPagination> => {
    // Execute all queries in parallel for better performance
    const [schedules, totalItems, stats] = await Promise.all([
      scheduleRepository.findManyWithPagination(filters),
      scheduleRepository.countWithFilters({
        search: filters.search,
        dayOfWeek: filters.dayOfWeek,
      }),
      scheduleRepository.getStatsWithFilters({
        search: filters.search,
        dayOfWeek: filters.dayOfWeek,
      }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / filters.limit);
    const hasNextPage = filters.page < totalPages;
    const hasPrevPage = filters.page > 1;
    const nextPage = hasNextPage ? filters.page + 1 : null;
    const prevPage = hasPrevPage ? filters.page - 1 : null;
    const lastPage = totalPages;

    const pagination: PaginationMeta = {
      currentPage: filters.page,
      totalPages,
      totalItems,
      itemsPerPage: filters.limit,
      hasNextPage,
      hasPrevPage,
      nextPage,
      prevPage,
      lastPage,
    };

    return {
      schedules,
      pagination,
      stats,
    };
  },

  getById: async (id: number) => {
    const cfg = await scheduleRepository.findById(id);
    if (!cfg) throw new Error('Configuração não encontrada.');
    return cfg;
  },

  update: async (id: number, data: ScheduleConfigUpdateInput) => {
    await scheduleService.getById(id);
    return scheduleRepository.update(id, data);
  },

  remove: async (id: number) => {
    await scheduleService.getById(id);
    return scheduleRepository.remove(id);
  },

  removeMany: async (ids: number[]) => {
    return scheduleRepository.removeMany(ids);
  },
};
