export interface ApprovalQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  status?: 'pending' | 'approved' | 'rejected';
  sortBy?: 'newest' | 'oldest' | 'user-asc' | 'user-desc';
}

export interface ApprovalFilters {
  page: number;
  limit: number;
  search?: string;
  status?: 'pending' | 'approved' | 'rejected';
  sortBy: 'newest' | 'oldest' | 'user-asc' | 'user-desc';
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

export interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface ApprovalWithPagination {
  approvals: Array<{
    id: number;
    userId: number;
    requestedRoleId: number;
    status: 'pending' | 'approved' | 'rejected';
    approvedById?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
    user?: {
      id: number;
      username: string;
    };
    requestedRole?: {
      id: number;
      name: string;
    };

  }>;
  pagination: PaginationMeta;
  stats: ApprovalStats;
} 