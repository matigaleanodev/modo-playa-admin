import { Injectable, inject } from '@angular/core';
import { LoadingController } from '@ionic/angular/standalone';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _loadingCtrl = inject(LoadingController);

  async show(message = 'xCargando') {
    const loading = await this._loadingCtrl.create({
      message,
      spinner: 'crescent',
    });

    await loading.present();

    return loading;
  }
}
