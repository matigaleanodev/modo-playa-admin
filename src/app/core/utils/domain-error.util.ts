import { HttpErrorResponse } from '@angular/common/http';
import { ErrorCode, ERROR_CODES } from '@core/constants/error-code';
import { ERROR_MESSAGES } from '@core/constants/error-message';

export type DomainErrorMessageOverrides = Partial<Record<ErrorCode, string>>;

export function getHttpErrorCode(error: unknown): ErrorCode | undefined {
  if (!(error instanceof HttpErrorResponse)) {
    return undefined;
  }

  const code = error.error?.code;

  if (typeof code !== 'string') {
    return undefined;
  }

  return Object.values(ERROR_CODES).includes(code as ErrorCode)
    ? (code as ErrorCode)
    : undefined;
}

export function resolveDomainErrorMessage(
  error: unknown,
  options: {
    fallback: string;
    overrides?: DomainErrorMessageOverrides;
    preferBackendMessage?: boolean;
  },
): string {
  const { fallback, overrides, preferBackendMessage = false } = options;

  if (error instanceof HttpErrorResponse) {
    const code = getHttpErrorCode(error);

    if (code && overrides?.[code]) {
      return overrides[code] as string;
    }

    if (code && ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }

    if (preferBackendMessage && typeof error.error?.message === 'string') {
      const message = error.error.message.trim();
      if (message) {
        return message;
      }
    }

    if (preferBackendMessage && Array.isArray(error.error?.message)) {
      const [first] = error.error.message;
      if (typeof first === 'string' && first.trim()) {
        return first;
      }
    }

    if (typeof error.error?.message === 'string') {
      const message = error.error.message.trim();
      if (message) {
        return message;
      }
    }

    if (Array.isArray(error.error?.message)) {
      const [first] = error.error.message;
      if (typeof first === 'string' && first.trim()) {
        return first;
      }
    }

    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
