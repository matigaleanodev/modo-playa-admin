import { Component, inject, Input } from '@angular/core';
import {
  ModalController,
  IonHeader,
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
    IonHeader,
  ],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
})
export class ConfirmModalComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) text = '';
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel = 'Cancelar';
  @Input() color: 'primary' | 'danger' | 'warning' = 'primary';
  @Input() showIcon = false;

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
