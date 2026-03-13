import { HttpErrorResponse } from '@angular/common/http';
import { resolveDomainErrorMessage } from './domain-error.util';

export function resolveLoadErrorMessage(
  error: unknown,
  subject: string,
): string {
  if (error instanceof HttpErrorResponse) {
    const backendMessage = error.error?.message;
    const hasBackendMessage =
      (typeof backendMessage === 'string' && backendMessage.trim().length > 0) ||
      (Array.isArray(backendMessage) &&
        backendMessage.some(
          (message) => typeof message === 'string' && message.trim().length > 0,
        ));

    if (!hasBackendMessage) {
      return `No pudimos cargar ${subject}. Intenta nuevamente en unos minutos.`;
    }
  }

  return resolveDomainErrorMessage(error, {
    fallback: `No pudimos cargar ${subject}. Intenta nuevamente en unos minutos.`,
    preferThrownMessage: false,
  });
}
