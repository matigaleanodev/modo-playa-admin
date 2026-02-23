import { CommonModule } from '@angular/common';
import { Component, TemplateRef, computed, input, output } from '@angular/core';

export interface ListShellEmptyState {
  title: string;
  description?: string;
}

export interface ListShellPageChangeEvent {
  page: number;
}

export interface ListShellLimitChangeEvent {
  limit: number;
}

export interface ListShellItemEvent<T = unknown> {
  item: T;
}

export interface ListShellItemTemplateContext<T> {
  $implicit: T;
  item: T;
  index: number;
}

@Component({
  selector: 'app-list-shell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-shell.component.html',
  styleUrls: ['./list-shell.component.scss'],
})
export class ListShellComponent<T = unknown> {
  readonly items = input.required<T[]>();
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly page = input<number>(1);
  readonly limit = input<number>(10);
  readonly total = input<number>(0);
  readonly limitOptions = input<number[]>([10, 20, 50]);
  readonly showCreate = input<boolean>(true);
  readonly createLabel = input<string>('Nuevo');
  readonly refreshLabel = input<string>('Actualizar');
  readonly emptyState = input<ListShellEmptyState>({
    title: 'Sin resultados',
    description: 'No hay elementos para mostrar.',
  });
  readonly itemTemplate = input<TemplateRef<
    ListShellItemTemplateContext<T>
  > | null>(null);

  readonly create = output<void>();
  readonly refresh = output<void>();
  readonly pageChange = output<ListShellPageChangeEvent>();
  readonly limitChange = output<ListShellLimitChangeEvent>();
  readonly itemClick = output<ListShellItemEvent<T>>();
  readonly edit = output<ListShellItemEvent<T>>();
  readonly delete = output<ListShellItemEvent<T>>();

  readonly totalPages = computed(() => {
    const limit = this.limit();
    return limit > 0 ? Math.max(Math.ceil(this.total() / limit), 1) : 1;
  });

  readonly canGoPrev = computed(() => this.page() > 1 && !this.loading());
  readonly canGoNext = computed(
    () => this.page() < this.totalPages() && !this.loading(),
  );

  trackByIndex = (index: number, _item: T) => index;

  private blurActiveElement(): void {
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      active.blur();
    }
  }

  onCreate(): void {
    this.blurActiveElement();
    this.create.emit();
  }

  onRefresh(): void {
    this.blurActiveElement();
    this.refresh.emit();
  }

  onPrevPage(): void {
    if (!this.canGoPrev()) return;
    this.blurActiveElement();
    this.pageChange.emit({ page: this.page() - 1 });
  }

  onNextPage(): void {
    if (!this.canGoNext()) return;
    this.blurActiveElement();
    this.pageChange.emit({ page: this.page() + 1 });
  }

  onLimitChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!Number.isFinite(value) || value <= 0) return;
    this.blurActiveElement();
    this.limitChange.emit({ limit: value });
  }

  onItemClick(item: T): void {
    this.itemClick.emit({ item });
  }

  onEdit(item: T, event?: Event): void {
    event?.stopPropagation();
    this.blurActiveElement();
    this.edit.emit({ item });
  }

  onDelete(item: T, event?: Event): void {
    event?.stopPropagation();
    this.blurActiveElement();
    this.delete.emit({ item });
  }

  getItemContext(item: T, index: number): ListShellItemTemplateContext<T> {
    return {
      $implicit: item,
      item,
      index,
    };
  }
}
