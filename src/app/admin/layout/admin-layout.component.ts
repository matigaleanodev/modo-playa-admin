import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bookOutline,
  bedOutline,
  homeOutline,
  informationCircleOutline,
  personCircleOutline,
  personOutline,
  powerOutline,
  settingsOutline,
} from 'ionicons/icons';
import { SessionService } from '@auth/services/session.service';

type AdminMenuItem = {
  label: string;
  path: string;
  icon: string;
};

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  imports: [
    RouterLink,
    RouterLinkActive,
    IonHeader,
    IonToolbar,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonTitle,
    IonList,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    IonFooter,
    IonButton,
  ],
})
export class AdminLayoutComponent {
  constructor(private readonly sessionService: SessionService) {
    addIcons({
      bookOutline,
      bedOutline,
      homeOutline,
      personOutline,
      personCircleOutline,
      informationCircleOutline,
      powerOutline,
      settingsOutline,
    });
  }

  async onLogout(): Promise<void> {
    await this.sessionService.logout();
  }

  readonly menuItems = signal<AdminMenuItem[]>([
    {
      label: 'Dashboard',
      path: '/app/dashboard',
      icon: 'home-outline',
    },
    {
      label: 'Alojamientos',
      path: '/app/lodgings',
      icon: 'bed-outline',
    },
    {
      label: 'Contactos',
      path: '/app/contacts',
      icon: 'book-outline',
    },
    {
      label: 'Usuarios',
      path: '/app/users',
      icon: 'person-outline',
    },
    {
      label: 'Perfil',
      path: '',
      icon: 'person-circle-outline',
    },
    {
      label: 'Informacion',
      path: '',
      icon: 'information-circle-outline',
    },
    {
      label: 'Configuracion',
      path: '',
      icon: 'settings-outline',
    },
  ]);
}
