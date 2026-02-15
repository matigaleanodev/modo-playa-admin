export interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
