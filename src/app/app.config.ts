import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/provide';

import { AuthApi, MockAuthApi } from '@core/auth';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // Serveur d'authentification simulé tant que le backend n'existe pas —
    // remplacer par l'implémentation HTTP, aucun écran ne change.
    { provide: AuthApi, useClass: MockAuthApi },
    // mode 'md' : le système @makola suit Material (M2/M3), pas l'iOS style d'Ionic
    provideIonicAngular({ mode: 'md' })
  ]
};
