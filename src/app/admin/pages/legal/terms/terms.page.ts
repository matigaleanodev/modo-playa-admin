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
  selector: 'app-admin-terms',
  standalone: true,
  templateUrl: './terms.page.html',
  styleUrls: ['./terms.page.scss'],
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
export class TermsPage {
  readonly contactEmail = 'contacto@modoplaya.app';
}
