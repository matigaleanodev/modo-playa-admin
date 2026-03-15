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
import { ListShellComponent } from '@shared/components/list-shell/list-shell.component';
import { Contact } from '../../models/contact.model';
import { ContactsResourceService } from '../../services/contacts-resource.service';

@Component({
  selector: 'app-contacts-list-page',
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
  templateUrl: './contacts-list.page.html',
  styleUrls: ['./contacts-list.page.scss'],
})
export class ContactsListPage extends BaseList<Contact> implements OnInit {
  override readonly initialList = input<Contact[]>([]);

  protected override _service = inject(ContactsResourceService);
  readonly resource = this._service;

  async ngOnInit(): Promise<void> {
    if (this.resource.items().length > 0) return;
    try {
      await this.resource.loadPage();
    } catch {}
  }

  async onRefresh(): Promise<void> {
    try {
      await this.resource.refresh();
    } catch {}
  }

  async onPageChange(page: number): Promise<void> {
    try {
      await this.resource.setPage(page);
    } catch {}
  }

  async onLimitChange(limit: number): Promise<void> {
    try {
      await this.resource.setLimit(limit);
    } catch {}
  }
}
