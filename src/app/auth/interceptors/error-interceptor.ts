import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { resolveDomainErrorMessage } from '@core/utils/domain-error.util';

export const domainErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          return throwError(() => error);
        }

        toastr.danger(
          resolveDomainErrorMessage(error, {
            fallback: 'Ocurrió un error inesperado.',
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
