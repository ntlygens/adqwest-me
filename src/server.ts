import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
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

const angularApp = new AngularAppEngine({
	// It is safe to set allow `localhost`, so that SSR can run in local development,
	// as, in production, Cloudflare will ensure that `localhost` is not the host.
	allowedHosts: ['localhost'],
});

/**
 * This is a request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createRequestHandler(async (req) => {
	const res = await angularApp.handle(req);

	return res ?? new Response('Page not found.', { status: 404 });
});


export default { fetch: reqHandler };
