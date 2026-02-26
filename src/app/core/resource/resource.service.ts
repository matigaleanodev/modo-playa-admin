import { computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CrudService } from '../crud/crud.service';
import { ApiListQuery } from '../models/api-response.model';
import { BaseEntity } from '../models/entity.model';

export interface ResourcePaginationState {
  page: number;
  limit: number;
  total: number;
}

export interface ResourceListState<T extends BaseEntity> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  loading: boolean;
  error: string | null;
  filters: Record<string, string | number | boolean | null | undefined>;
  sortBy: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export abstract class ResourceService<
  T extends BaseEntity,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
> {
  abstract _service: CrudService<T>;

  readonly items = signal<T[]>([]);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly filters = signal<
    Record<string, string | number | boolean | null | undefined>
  >({});
  readonly sortBy = signal<string | null>(null);
  readonly sortDirection = signal<'asc' | 'desc' | null>(null);

  readonly pagination = computed<ResourcePaginationState>(() => ({
    page: this.page(),
    limit: this.limit(),
    total: this.total(),
  }));

  readonly listState = computed<ResourceListState<T>>(() => ({
    items: this.items(),
    page: this.page(),
    limit: this.limit(),
    total: this.total(),
    loading: this.loading(),
    error: this.error(),
    filters: this.filters(),
    sortBy: this.sortBy(),
    sortDirection: this.sortDirection(),
  }));

  readonly totalPages = computed(() => {
    const limit = this.limit();
    return limit > 0 ? Math.ceil(this.total() / limit) : 0;
  });

  readonly hasItems = computed(() => this.items().length > 0);

  async loadPage(query: ApiListQuery = {}): Promise<void> {
    const nextPage = this._normalizePage(query.page ?? this.page());
    const nextLimit = this._normalizeLimit(query.limit ?? this.limit());
    const nextFilters = this._mergeFilters(query);
    const nextSortBy = query.sortBy ?? this.sortBy();
    const nextSortDirection = query.sortDirection ?? this.sortDirection();

    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this._service.find({
          ...nextFilters,
          page: nextPage,
          limit: nextLimit,
          ...(nextSortBy ? { sortBy: nextSortBy } : {}),
          ...(nextSortDirection ? { sortDirection: nextSortDirection } : {}),
        }),
      );

      this.items.set(response.data);
      this.page.set(response.page);
      this.limit.set(response.limit);
      this.total.set(response.total);
      this.filters.set(nextFilters);
      this.sortBy.set(nextSortBy);
      this.sortDirection.set(nextSortDirection);
    } catch (error) {
      this.error.set(this._mapErrorMessage(error));
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  refresh(): Promise<void> {
    return this.loadPage();
  }

  setPage(page: number): Promise<void> {
    return this.loadPage({ page });
  }

  setLimit(limit: number): Promise<void> {
    return this.loadPage({ page: 1, limit });
  }

  setFilters(
    filters: Record<string, string | number | boolean | null | undefined>,
  ): Promise<void> {
    this.filters.set(filters);
    return this.loadPage({ page: 1, ...filters });
  }

  setSort(
    sortBy: string | null,
    sortDirection: 'asc' | 'desc' | null = this.sortDirection(),
  ): Promise<void> {
    this.sortBy.set(sortBy);
    this.sortDirection.set(sortBy ? sortDirection ?? 'asc' : null);

    return this.loadPage({
      page: 1,
      ...(sortBy ? { sortBy, sortDirection: this.sortDirection() ?? 'asc' } : {}),
    });
  }

  protected async createAndRefresh(data: TCreate): Promise<T> {
    const created = await firstValueFrom(this._service.save(data as Partial<T>));
    await this.refresh();
    return created;
  }

  protected async updateAndRefresh(id: string, data: TUpdate): Promise<T> {
    const updated = await firstValueFrom(
      this._service.update(id, data as Partial<T>),
    );
    await this.refresh();
    return updated;
  }

  async delete(data: T): Promise<void> {
    await firstValueFrom(this._service.delete(data.id));

    const currentPage = this.page();
    const currentLimit = this.limit();
    const currentTotal = this.total();
    const totalAfterDelete = Math.max(currentTotal - 1, 0);
    const maxPage = currentLimit > 0 ? Math.max(Math.ceil(totalAfterDelete / currentLimit), 1) : 1;
    const nextPage = Math.min(currentPage, maxPage);

    await this.loadPage({ page: nextPage });
  }

  abstract guardar(data: TCreate | TUpdate): Promise<void> | void;

  abstract cancelar(): void;

  abstract newElement(): void;

  abstract editElement(dat: T): void;

  private _mergeFilters(
    query: ApiListQuery,
  ): Record<string, string | number | boolean | null | undefined> {
    const filters = { ...this.filters() };

    for (const [key, value] of Object.entries(query)) {
      if (this._isReservedQueryKey(key)) continue;
      filters[key] = value;
    }

    return filters;
  }

  private _isReservedQueryKey(key: string): boolean {
    return (
      key === 'page' ||
      key === 'limit' ||
      key === 'sortBy' ||
      key === 'sortDirection'
    );
  }

  private _normalizePage(page: number): number {
    return Number.isFinite(page) && page > 0 ? Math.trunc(page) : 1;
  }

  private _normalizeLimit(limit: number): number {
    return Number.isFinite(limit) && limit > 0 ? Math.trunc(limit) : 10;
  }

  private _mapErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message;
    return 'Ocurrio un error al cargar los datos.';
  }
}
