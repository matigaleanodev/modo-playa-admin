import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, input } from '@angular/core';
import {
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { BaseList } from '@core/components/list.component';
import { BaseEntity } from '@core/models/entity.model';
import { ListShellComponent } from '@shared/components/list-shell/list-shell.component';
import { Lodging } from '@lodgings/models/lodging.model';
import { LodgingsResourceService } from '@lodgings/services/lodgings-resource.service';

@Component({
  selector: 'app-lodgings-list-page',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonFooter,
    ListShellComponent,
  ],
  templateUrl: './lodgings-list.page.html',
  styleUrls: ['./lodgings-list.page.scss'],
})
export class LodgingsListPage extends BaseList<Lodging> implements OnInit {
  override readonly initialList = input<Lodging[]>([]);

  protected override _service = inject(LodgingsResourceService);
  readonly resource = this._service;

  async ngOnInit(): Promise<void> {
    if (this.resource.items().length > 0) return;

    try {
      await this.resource.loadPage();
    } catch {
      // El mensaje se expone en resource.error().
    }
  }

  async onRefresh(): Promise<void> {
    try {
      await this.resource.refresh();
    } catch {
      // El mensaje se expone en resource.error().
    }
  }

  async onPageChange(page: number): Promise<void> {
    try {
      await this.resource.setPage(page);
    } catch {
      // El mensaje se expone en resource.error().
    }
  }

  async onLimitChange(limit: number): Promise<void> {
    try {
      await this.resource.setLimit(limit);
    } catch {
      // El mensaje se expone en resource.error().
    }
  }

  trackByLodging = (_index: number, item: BaseEntity) => item.id;

  getCardImage(item: Lodging): string | null {
    const defaultMedia = item.mediaImages?.find((image) => image.isDefault);
    return (
      defaultMedia?.variants?.card ||
      defaultMedia?.variants?.thumb ||
      defaultMedia?.url ||
      item.mainImage ||
      null
    );
  }
}
