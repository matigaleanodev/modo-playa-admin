import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentTextOutline,
  helpCircleOutline,
  informationCircleOutline,
  logoGithub,
  mailOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-info',
  standalone: true,
  templateUrl: './info.page.html',
  styleUrls: ['./info.page.scss'],
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonContent,
    IonFooter,
    IonList,
    IonListHeader,
    IonLabel,
    IonItem,
    IonIcon,
  ],
})
export class InfoPage {
  readonly appName = 'Modo Playa Admin';
  readonly appVersion = 'N/D';
  readonly appStage = 'Producción';

  readonly contactEmail = 'contacto@modoplaya.app';
  readonly githubUrl = 'https://github.com/matigaleanodev/modo-playa-admin';
  readonly helpUrl = 'https://github.com/matigaleanodev/modo-playa-admin/issues';

  constructor() {
    addIcons({
      mailOutline,
      logoGithub,
      helpCircleOutline,
      shieldCheckmarkOutline,
      documentTextOutline,
      informationCircleOutline,
    });
  }
}
