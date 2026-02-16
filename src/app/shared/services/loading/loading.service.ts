import { Injectable, inject } from '@angular/core';
import { LoadingRef } from '@core/models/loading-ref.model';
import { LoadingController } from '@ionic/angular/standalone';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly controller = inject(LoadingController);

  async show(message = 'Cargando'): Promise<LoadingRef> {
    const loading = await this.controller.create({
      message,
      spinner: 'crescent',
    });

    await loading.present();

    return async () => {
      await loading.dismiss();
    };
  }
}
