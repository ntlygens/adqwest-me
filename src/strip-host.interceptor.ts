import { HttpInterceptorFn } from '@angular/common/http';

export const stripHostInterceptor: HttpInterceptorFn = (req, next) => {
  // If Angular or an environment variable added a host header, remove it
  if (req.headers.has('host')) {
    const cleanHeaders = req.headers.delete('host');
    const modifiedReq = req.clone({ headers: cleanHeaders });
    return next(modifiedReq);
  }
  
  return next(req);
};