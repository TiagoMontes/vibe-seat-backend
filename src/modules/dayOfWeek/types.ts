export interface DayOfWeekInput {
  name: string; // "monday", "tuesday", etc.
}

export type DayOfWeekUpdateInput = Partial<{
  name: string;
}>;

// Pagination types for dayOfWeek
export interface DayOfWeekQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'name-asc' | 'name-desc';
}

export interface DayOfWeekFilters {
  page: number;
  limit: number;
  search?: string;
  sortBy: 'newest' | 'oldest' | 'name-asc' | 'name-desc';
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

export interface DayOfWeek {
  id: number;
  name: string;
  scheduleConfigId: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface DayOfWeekWithPagination {
  days: DayOfWeek[];
  pagination: PaginationMeta;
}
