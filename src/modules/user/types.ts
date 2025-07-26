export interface UserQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  status?: 'pending' | 'approved' | 'rejected';
  roleId?: string;
  sortBy?: 'newest' | 'oldest' | 'username-asc' | 'username-desc';
}

export interface UserFilters {
  page: number;
  limit: number;
  search?: string;
  status?: 'pending' | 'approved' | 'rejected';
  roleId?: number;
  sortBy: 'newest' | 'oldest' | 'username-asc' | 'username-desc';
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

export interface UserStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface UserWithPagination {
  users: Array<{
    id: number;
    username: string;
    status: 'pending' | 'approved' | 'rejected';
    roleId: number;
    role?: {
      id: number;
      name: string;
    };
  }>;
  pagination: PaginationMeta;
  stats: UserStats;
}
