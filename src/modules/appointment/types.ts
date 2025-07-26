// Input para criação de appointment
export interface AppointmentInput {
  chairId: number;
  datetimeStart: string; // ISO string, ex: "2025-07-25T08:00:00.000Z"
}

export interface AppointmentStatusInput {
  status: 'CANCELLED' | 'CONFIRMED';
}

// Response type for available times
export interface AvailableTimesResponse {
  chairs: Array<{
    chairId: number;
    chairName: string;
    chairLocation?: string | null;
    available: string[]; // Array of ISO strings for available slots
    unavailable: string[]; // Array of ISO strings for booked slots
    totalSlots: number; // Total possible slots for the day
    bookedSlots: number; // Number of booked slots for this chair
    availableSlots: number; // Number of available slots for this chair
  }>;
  pagination: PaginationMeta;
  totalSlots: number; // Total possible slots for the day
  bookedSlots: number; // Total booked slots across all chairs
  availableSlots: number; // Total available slots across all chairs
}

// Pagination types for appointments
export interface AppointmentQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  status?: 'SCHEDULED' | 'CANCELLED' | 'CONFIRMED';
  sortBy?: 'newest' | 'oldest' | 'datetime-asc' | 'datetime-desc';
  userId?: string; // For filtering by specific user
}

export interface AppointmentFilters {
  page: number;
  limit: number;
  search?: string;
  status?: 'SCHEDULED' | 'CANCELLED' | 'CONFIRMED';
  sortBy: 'newest' | 'oldest' | 'datetime-asc' | 'datetime-desc';
  userId?: number;
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

export interface AppointmentStats {
  total: number;
  scheduled: number;
  cancelled: number;
  confirmed: number;
}

export interface AppointmentWithPagination {
  appointments: Array<{
    id: number;
    userId: number;
    chairId: number;
    datetimeStart: Date;
    datetimeEnd: Date;
    status: 'SCHEDULED' | 'CANCELLED' | 'CONFIRMED';
    presenceConfirmed: boolean;
    createdAt: Date;
    user?: {
      id: number;
      username: string;
    };
    chair?: {
      id: number;
      name: string;
      location?: string | null;
    };
  }>;
  pagination: PaginationMeta;
  stats: AppointmentStats;
}
