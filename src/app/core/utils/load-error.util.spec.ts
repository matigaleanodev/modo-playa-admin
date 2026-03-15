import { HttpErrorResponse } from '@angular/common/http';
import { resolveLoadErrorMessage } from './load-error.util';

describe('resolveLoadErrorMessage', () => {
  it('should reuse backend message when available', () => {
    const result = resolveLoadErrorMessage(
      new HttpErrorResponse({
        status: 500,
        error: { message: 'Backend temporalmente no disponible.' },
      }),
      'el dashboard',
    );

    expect(result).toBe('Backend temporalmente no disponible.');
  });

  it('should fall back to the shared load message when no domain detail exists', () => {
    const result = resolveLoadErrorMessage(new Error('boom'), 'los usuarios');

    expect(result).toBe(
      'No pudimos cargar los usuarios. Intenta nuevamente en unos minutos.',
    );
  });
});
