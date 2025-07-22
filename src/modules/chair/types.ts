export interface ChairInput {
  name: string;
  description?: string;
  location?: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

export interface ChairUpdateInput {
  name?: string;
  description?: string;
  location?: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

export interface ChairQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  sortBy?: 'newest' | 'oldest' | 'name-asc' | 'name-desc';
}

export interface ChairFilters {
  page: number;
  limit: number;
  search?: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  sortBy: 'newest' | 'oldest' | 'name-asc' | 'name-desc';
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ChairStats {
  total: number;
  active: number;
  maintenance: number;
  inactive: number;
}

export interface ChairWithPagination {
  chairs: Array<{
    id: number;
    name: string;
    description?: string | null;
    location?: string | null;
    status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: PaginationMeta;
  stats: ChairStats;
}
