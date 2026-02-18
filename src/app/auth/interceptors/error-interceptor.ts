import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { ERROR_MESSAGES } from '@core/constants/error-message';
import { ErrorCode } from '@core/constants/error-code';

export const domainErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          return throwError(() => error);
        }

        const code = error.error?.code as ErrorCode | undefined;

        if (code && ERROR_MESSAGES[code]) {
          toastr.danger(ERROR_MESSAGES[code]);
        } else {
          toastr.danger('Ocurrió un error inesperado.');
        }
      }

      return throwError(() => error);
    }),
  );
};
