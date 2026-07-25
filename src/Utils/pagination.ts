export type PaginationMeta = {
  total: number;

  page: number;

  limit: number;

  totalPages: number;
};

export type PaginatedResult<T> = {
  data: T[];

  meta: PaginationMeta;
};
