import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/provide';

import { provideI18n } from '@core/i18n';
import { AuthApi } from '@core/services/auth-api';
import { MockAuthApi } from '@core/services/mock-auth-api';

import { MockStudentRecordApi } from './student/services/mock-student-record-api';
import { StudentRecordApi } from './student/services/student-record-api';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideI18n(),
    // Mock authentication server until the backend exists —
    // swap for the HTTP implementation, no screen changes.
    { provide: AuthApi, useClass: MockAuthApi },
    // Sample grades server, same: the HTTP implementation will replace it here.
    { provide: StudentRecordApi, useClass: MockStudentRecordApi },
    // 'md' mode: the @makola system follows Material (M2/M3), not Ionic's iOS style.
    provideIonicAngular({ mode: 'md' }),
  ],
};
