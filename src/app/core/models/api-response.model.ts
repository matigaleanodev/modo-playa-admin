export interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  [key: string]: string | number | boolean | null | undefined;
}
