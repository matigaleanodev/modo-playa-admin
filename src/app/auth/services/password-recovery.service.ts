import { inject, Injectable, signal } from '@angular/core';
import { from, map, mergeMap, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { StorageService } from '@shared/services/storage/storage.service';

@Injectable({
  providedIn: 'root',
})
export class PasswordRecoveryService {
  private readonly authService = inject(AuthService);
  private readonly storage = inject(StorageService);

  private static readonly IDENTIFIER_KEY = 'password_recovery_identifier';
  private static readonly RESET_TOKEN_KEY = 'password_recovery_reset_token';

  private readonly _identifier = signal<string | null>(null);
  readonly identifier = this._identifier.asReadonly();

  private readonly _resetToken = signal<string | null>(null);
  readonly resetToken = this._resetToken.asReadonly();

  private hydrationPromise: Promise<void> | null = null;

  constructor() {
    void this.hydrate();
  }

  hydrate(): Promise<void> {
    if (!this.hydrationPromise) {
      this.hydrationPromise = this.loadFromStorage().finally(() => {
        this.hydrationPromise = null;
      });
    }

    return this.hydrationPromise;
  }

  requestCode(dto: { identifier: string }): Observable<{ message: string }> {
    const identifier = dto.identifier.trim().toLowerCase();

    return this.authService.forgotPassword({ identifier }).pipe(
      mergeMap((response) =>
        from(this.setIdentifier(identifier)).pipe(
          mergeMap(() => from(this.clearResetToken())),
          map(() => response),
        ),
      ),
    );
  }

  verifyCode(dto: { code: string }): Observable<void> {
    const identifier = this._identifier();

    if (!identifier) {
      throw new Error('No hay identificador para validar el código.');
    }

    return this.authService
      .verifyRequestCode({
        identifier,
        code: dto.code.trim(),
      })
      .pipe(
        mergeMap((response) =>
          from(this.setResetToken(response.accessToken)).pipe(map(() => void 0)),
        ),
      );
  }

  resetPassword(dto: { password: string }): Observable<{ message: string }> {
    const token = this._resetToken();

    if (!token) {
      throw new Error('No hay token temporal para resetear la contraseña.');
    }

    return this.authService.resetPassword(dto, token).pipe(
      mergeMap((response) =>
        from(this.clearFlow()).pipe(map(() => response)),
      ),
    );
  }

  canVerifyCode(): boolean {
    return !!this._identifier();
  }

  canResetPassword(): boolean {
    return !!this._identifier() && !!this._resetToken();
  }

  async clearFlow(): Promise<void> {
    this._identifier.set(null);
    this._resetToken.set(null);

    await this.storage.removeItem(PasswordRecoveryService.IDENTIFIER_KEY);
    await this.storage.removeItem(PasswordRecoveryService.RESET_TOKEN_KEY);
  }

  private async loadFromStorage(): Promise<void> {
    const [identifier, resetToken] = await Promise.all([
      this.storage.getItem<string>(PasswordRecoveryService.IDENTIFIER_KEY),
      this.storage.getItem<string>(PasswordRecoveryService.RESET_TOKEN_KEY),
    ]);

    this._identifier.set(identifier);
    this._resetToken.set(resetToken);
  }

  private async setIdentifier(identifier: string): Promise<void> {
    this._identifier.set(identifier);
    await this.storage.setItem(PasswordRecoveryService.IDENTIFIER_KEY, identifier);
  }

  private async setResetToken(token: string): Promise<void> {
    this._resetToken.set(token);
    await this.storage.setItem(PasswordRecoveryService.RESET_TOKEN_KEY, token);
  }

  private async clearResetToken(): Promise<void> {
    this._resetToken.set(null);
    await this.storage.removeItem(PasswordRecoveryService.RESET_TOKEN_KEY);
  }
}
