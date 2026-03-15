import { inject, Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private readonly modalController = inject(ModalController);

  async confirm(options: {
    title: string;
    text?: string;
    itemLabel?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    color?: 'primary' | 'danger' | 'warning';
    showIcon?: boolean;
  }): Promise<boolean> {
    const modal = await this.modalController.create({
      component: ConfirmModalComponent,
      componentProps: {
        title: options.title,
        text: options.text ?? '',
        itemLabel: options.itemLabel ?? '',
        confirmLabel: options.confirmLabel ?? 'Confirmar',
        cancelLabel: options.cancelLabel ?? 'Cancelar',
        color: options.color ?? 'primary',
        showIcon: options.showIcon ?? false,
      },
      cssClass: 'app-confirm-modal',
      mode: 'md',
    });

    await modal.present();

    const { role } = await modal.onDidDismiss();

    return role === 'confirm';
  }
}
