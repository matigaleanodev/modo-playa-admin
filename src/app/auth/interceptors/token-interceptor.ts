import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpContextToken,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { SessionService } from '../services/session.service';

export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

export const tokenInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const tokenService = inject(TokenService);
  const sessionService = inject(SessionService);

  if (req.context.get(SKIP_AUTH)) {
    return next(req);
  }

  return from(tokenService.getAccessToken()).pipe(
    switchMap((token) => {
      const authReq = token
        ? req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          })
        : req;

      return next(authReq).pipe(
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            return handle401(authReq, next, tokenService, sessionService);
          }

          return throwError(() => error);
        }),
      );
    }),
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenService: TokenService,
  sessionService: SessionService,
) {
  return from(sessionService.refreshControlled()).pipe(
    switchMap(() =>
      from(tokenService.getAccessToken()).pipe(
        switchMap((newToken) => {
          if (!newToken) {
            return throwError(
              () => new Error('No hay token después del refresh'),
            );
          }

          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
            },
          });

          return next(retryReq);
        }),
      ),
    ),
  );
}
