import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideMarkdown, MARKED_OPTIONS } from 'ngx-markdown';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { unauthorizedInterceptor } from './core/interceptors/unauthorized.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { routes } from './app.routes';

import { successInterceptor } from './core/interceptors/success.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        loadingInterceptor,
        unauthorizedInterceptor,
        errorInterceptor,
        successInterceptor,
      ]),
    ),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    importProvidersFrom(MatSnackBarModule),
    provideCharts(withDefaultRegisterables()),
    provideMarkdown({
      markedOptions: {
        provide: MARKED_OPTIONS,
        useValue: {
          gfm: true,
          breaks: true,
        },
      },
    }),
  ],
};
