import { Component, inject, input } from '@angular/core';
import {
  ModalController,
  IonHeader,
  IonContent,
  IonFooter,
  IonToolbar,
  IonIcon,
  IonButton,
  IonButtons,
  IonTitle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, close } from 'ionicons/icons';

@Component({
  selector: 'app-confirm-modal',
  imports: [
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonToolbar,
    IonFooter,
    IonContent,
    IonHeader,
  ],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
})
export class ConfirmModalComponent {
  readonly title = input.required<string>();
  readonly text = input.required<string>();
  readonly confirmLabel = input<string>('Confirmar');
  readonly cancelLabel = input<string>('Cancelar');
  readonly color = input<'primary' | 'danger' | 'warning'>('primary');
  readonly showIcon = input<boolean>(false);

  private modalControl = inject(ModalController);

  constructor() {
    addIcons({ close, alertCircleOutline });
  }

  onConfirm() {
    return this.modalControl.dismiss(true, 'confirm');
  }

  cancel() {
    return this.modalControl.dismiss(null, 'cancel');
  }
}
