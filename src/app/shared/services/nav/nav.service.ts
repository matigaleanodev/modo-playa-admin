import { inject, Injectable } from '@angular/core';
import { NavController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class NavService {
  private readonly _navController = inject(NavController);

  forward(path: string, queryParams?: Record<string, any>) {
    this._navController.navigateForward(path, {
      queryParams,
      animated: true,
      animationDirection: 'forward',
    });
  }

  back() {
    this._navController.back();
  }

  root(path: string) {
    this._navController.navigateRoot(path, { replaceUrl: true });
  }

  search(query: string) {
    const q = query.trim();
    if (!q) return;

    this.forward('/search', {
      q,
    });
  }

  volverHome() {
    this.root('/home');
  }
}
