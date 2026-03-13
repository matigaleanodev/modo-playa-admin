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
    text: string;
    confirmLabel?: string;
    cancelLabel?: string;
    color?: 'primary' | 'danger' | 'warning';
    showIcon?: boolean;
  }): Promise<boolean> {
    const modal = await this.modalController.create({
      component: ConfirmModalComponent,
      componentProps: {
        title: options.title,
        text: options.text,
        confirmLabel: options.confirmLabel ?? 'Confirmar',
        cancelLabel: options.cancelLabel ?? 'Cancelar',
        color: options.color ?? 'primary',
        showIcon: options.showIcon ?? false,
      },
      breakpoints: [0, 0.4],
      initialBreakpoint: 0.4,
    });

    await modal.present();

    const { role } = await modal.onDidDismiss();

    return role === 'confirm';
  }
}
