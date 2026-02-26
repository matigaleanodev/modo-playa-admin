import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from '@shared/services/theme/theme.service';
import { SessionService } from '@auth/services/session.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  // Fuerza la inicialización global del tema desde el arranque de la app.
  private readonly _themeService = inject(ThemeService);
  private readonly _sessionService = inject(SessionService);

  constructor() {
    void this._sessionService.init();
  }
}
