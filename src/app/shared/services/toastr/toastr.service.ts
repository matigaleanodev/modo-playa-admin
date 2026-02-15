import { Injectable, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  warningOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class ToastrService {
  private readonly _controller = inject(ToastController);

  constructor() {
    addIcons({
      alertCircleOutline,
      checkmarkCircleOutline,
      warningOutline,
      informationCircleOutline,
    });
  }

  async danger(message: string, header: string = 'Error') {
    const icon = 'alert-circle-outline';
    const color = 'danger';
    await this.presentToast({ message, color, header, icon });
  }

  async success(message: string, header: string) {
    const icon = 'checkmark-circle-outline';
    const color = 'success';
    await this.presentToast({ message, color, header, icon });
  }

  async warning(message: string, header: string) {
    const icon = 'warning-outline';
    const color = 'warning';
    await this.presentToast({ message, color, header, icon });
  }

  async info(message: string, header: string) {
    const icon = 'information-circle-outline';
    const color = 'secondary';
    await this.presentToast({ message, color, header, icon });
  }

  async presentToast({
    message,
    color,
    header,
    icon,
  }: ToastOption): Promise<void> {
    const toast = await this._controller.create({
      header,
      icon,
      message,
      color,
      duration: 2500,
      position: 'top',
    });

    await toast.present();
  }
}

interface ToastOption {
  message: string;
  color: string;
  header: string;
  icon: string;
}
