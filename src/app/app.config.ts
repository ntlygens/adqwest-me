import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { stripHostInterceptor } from '../strip-host.interceptor';
import { provideRouter } from '@angular/router';

import { Main_Routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(
    withFetch(),
    withInterceptors([stripHostInterceptor])
  ), 
    provideBrowserGlobalErrorListeners(),
    provideRouter(Main_Routes), provideClientHydration(withEventReplay())
  ]
};
