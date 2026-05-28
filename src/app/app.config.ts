import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { Main_Routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { HttpInterceptorFn } from '@angular/common/http';

export const stripHostInterceptor: HttpInterceptorFn = (req, next) => {
  // Check if the host header exists and delete it
  if (req.headers.has('host')) {
    const cleanHeaders = req.headers.delete('host');
    const modifiedReq = req.clone({ headers: cleanHeaders });
    return next(modifiedReq);
  }
  
  return next(req);
};

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withFetch()), 
    provideBrowserGlobalErrorListeners(),
    provideRouter(Main_Routes), provideClientHydration(withEventReplay())
  ]
};
