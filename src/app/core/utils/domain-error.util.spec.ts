import { HttpErrorResponse } from '@angular/common/http';
import {
  getHttpErrorCode,
  resolveDomainErrorMessage,
} from './domain-error.util';

describe('domain-error.util', () => {
  it('should resolve known domain codes using the shared catalog', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { code: 'LODGING_IMAGE_PENDING_EXPIRED' },
    });

    expect(getHttpErrorCode(error)).toBe('LODGING_IMAGE_PENDING_EXPIRED');
    expect(
      resolveDomainErrorMessage(error, {
        fallback: 'Fallback',
      }),
    ).toBe('Una imagen pendiente del alojamiento expiró antes de confirmarse.');
  });

  it('should allow local overrides for a known domain code', () => {
    const error = new HttpErrorResponse({
      status: 403,
      error: { code: 'PROFILE_IMAGE_FORBIDDEN_FOR_SUPERADMIN' },
    });

    expect(
      resolveDomainErrorMessage(error, {
        fallback: 'Fallback',
        overrides: {
          PROFILE_IMAGE_FORBIDDEN_FOR_SUPERADMIN: 'Mensaje local',
        },
      }),
    ).toBe('Mensaje local');
  });

  it('should fall back to backend message when code is unknown', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { code: 'UNKNOWN_CODE', message: 'Mensaje backend' },
    });

    expect(
      resolveDomainErrorMessage(error, {
        fallback: 'Fallback',
      }),
    ).toBe('Mensaje backend');
  });
});
