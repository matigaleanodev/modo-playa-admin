import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { TranslateService } from '@shared/translate/translate.service';
import { catchError, throwError, TimeoutError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const _toastr = inject(ToastrService);
  const _translator = inject(TranslateService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof TimeoutError) {
        console.table({
          type: 'TimeoutError',
          url: req.url,
        });

        _toastr.danger(_translator.translate('xErrorTimeout'));
        return throwError(() => error);
      }

      if (error instanceof HttpErrorResponse) {
        console.table({
          type: 'HttpErrorResponse',
          status: error.status,
          url: error.url,
          error: error.error,
        });

        if (error.error instanceof ProgressEvent) {
          _toastr.danger(_translator.translate('xErrorConexion'));
          return throwError(() => error);
        }

        _toastr.danger(_translator.translate('xErrorDesconocido'));
        return throwError(() => error);
      }

      console.table({
        type: 'UnknownError',
        error,
      });

      _toastr.danger(_translator.translate('xErrorDesconocido'));
      return throwError(() => error);
    }),
  );
};
