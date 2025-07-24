export interface ScheduleConfigInput {
  daysOfWeek: number[]; // [1,3,5]
  timeStart: string; // "08:00"
  timeEnd: string; // "10:00"
  validFrom?: Date;
  validTo?: Date;
}

export type ScheduleConfigSingleInput = Omit<
  ScheduleConfigInput,
  'daysOfWeek'
> & { dayOfWeek: number };

export type ScheduleConfigUpdateInput = Partial<{
  dayOfWeek: number;
  timeStart: string;
  timeEnd: string;
  validFrom: Date;
  validTo: Date;
}>;

// Pagination types for schedules
export interface ScheduleQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  dayOfWeek?: string;
  sortBy?: 'newest' | 'oldest' | 'time-asc' | 'time-desc';
}

export interface ScheduleFilters {
  page: number;
  limit: number;
  search?: string;
  dayOfWeek?: number;
  sortBy: 'newest' | 'oldest' | 'time-asc' | 'time-desc';
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
  lastPage: number;
}

export interface ScheduleStats {
  total: number;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface ScheduleWithPagination {
  schedules: Array<{
    id: number;
    dayOfWeek: number;
    timeStart: string;
    timeEnd: string;
    validFrom?: Date | null;
    validTo?: Date | null;
  }>;
  pagination: PaginationMeta;
  stats: ScheduleStats;
}
