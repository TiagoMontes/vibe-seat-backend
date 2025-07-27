export interface UserInput {
  username: string;
  password: string;
  roleId: number;
  fullName?: string;
  cpf?: string;
  jobFunction?: string;
  position?: string;
  registration: string;
  sector: string;
  email: string;
  phone: string;
  gender: 'M' | 'F' | 'Outro';
  birthDate: string; // ISO date string
}

export interface UserUpdateInput {
  username?: string;
  password?: string;
  roleId?: number;
  fullName?: string;
  cpf?: string;
  jobFunction?: string;
  position?: string;
  registration?: string;
  sector?: string;
  email?: string;
  phone?: string;
  gender?: 'M' | 'F' | 'Outro';
  birthDate?: string; // ISO date string
}

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
    fullName: string | null;
    cpf: string | null;
    jobFunction: string | null;
    position: string | null;
    registration: string | null;
    sector: string | null;
    email: string | null;
    phone: string | null;
    gender: string | null;
    birthDate: Date | null;
    role?: {
      id: number;
      name: string;
    };
  }>;
  pagination: PaginationMeta;
  stats: UserStats;
}
