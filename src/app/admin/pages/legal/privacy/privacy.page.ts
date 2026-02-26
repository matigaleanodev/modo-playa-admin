import { Component } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-admin-privacy',
  standalone: true,
  templateUrl: './privacy.page.html',
  styleUrls: ['./privacy.page.scss'],
  imports: [
    IonButtons,
    IonBackButton,
    IonContent,
    IonFooter,
    IonHeader,
    IonTitle,
    IonToolbar,
  ],
})
export class PrivacyPage {
  readonly contactEmail = 'contacto@modoplaya.app';
}
