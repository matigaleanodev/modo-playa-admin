import { importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
  withComponentInputBinding,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { IonicStorageModule } from '@ionic/storage-angular';
import { tokenInterceptor } from './app/auth/interceptors/token-interceptor';
import { domainErrorInterceptor } from './app/auth/interceptors/error-interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom([
      IonicStorageModule.forRoot({
        name: 'ModoPlaya',
        storeName: 'ModoPlayaStore',
      }),
    ]),
    provideZoneChangeDetection(),
    provideHttpClient(
      withInterceptors([tokenInterceptor, domainErrorInterceptor]),
    ),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withComponentInputBinding(),
    ),
  ],
});
