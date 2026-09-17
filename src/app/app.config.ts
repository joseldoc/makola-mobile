import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/provide';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // mode 'md' : le système @makola suit Material (M2/M3), pas l'iOS style d'Ionic
    provideIonicAngular({ mode: 'md' })
  ]
};
