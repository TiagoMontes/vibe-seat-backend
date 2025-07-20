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
