import { inject, Injectable, signal } from '@angular/core';
import { from, map, mergeMap, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { StorageService } from '@shared/services/storage/storage.service';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class AccountActivationService {
  private readonly authService = inject(AuthService);
  private readonly storage = inject(StorageService);
  private readonly sessionService = inject(SessionService);

  private static readonly IDENTIFIER_KEY = 'account_activation_identifier';
  private static readonly SETUP_TOKEN_KEY = 'account_activation_setup_token';

  private readonly _identifier = signal<string | null>(null);
  readonly identifier = this._identifier.asReadonly();

  private readonly _setupToken = signal<string | null>(null);
  readonly setupToken = this._setupToken.asReadonly();

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

    return this.authService.requestActivation({ identifier }).pipe(
      mergeMap((response) =>
        from(this.setIdentifier(identifier)).pipe(
          mergeMap(() => from(this.clearSetupToken())),
          map(() => response),
        ),
      ),
    );
  }

  verifyCode(dto: { code: string }): Observable<void> {
    const identifier = this._identifier();

    if (!identifier) {
      throw new Error('No hay identificador para activar la cuenta.');
    }

    return this.authService
      .activate({
        identifier,
        code: dto.code.trim(),
      })
      .pipe(
        mergeMap((response) =>
          from(this.setSetupToken(response.accessToken)).pipe(map(() => void 0)),
        ),
      );
  }

  setPassword(dto: { password: string }): Observable<void> {
    const setupToken = this._setupToken();

    if (!setupToken) {
      throw new Error('No hay token temporal para configurar la contraseña.');
    }

    return this.authService.setPasswordWithToken(dto, setupToken).pipe(
      mergeMap((response) =>
        from(this.clearFlow()).pipe(
          mergeMap(() => this.sessionService.startAuthenticatedSession(response)),
        ),
      ),
    );
  }

  canVerifyCode(): boolean {
    return !!this._identifier();
  }

  canSetPassword(): boolean {
    return !!this._identifier() && !!this._setupToken();
  }

  async clearFlow(): Promise<void> {
    this._identifier.set(null);
    this._setupToken.set(null);

    await this.storage.removeItem(AccountActivationService.IDENTIFIER_KEY);
    await this.storage.removeItem(AccountActivationService.SETUP_TOKEN_KEY);
  }

  private async loadFromStorage(): Promise<void> {
    const [identifier, setupToken] = await Promise.all([
      this.storage.getItem<string>(AccountActivationService.IDENTIFIER_KEY),
      this.storage.getItem<string>(AccountActivationService.SETUP_TOKEN_KEY),
    ]);

    this._identifier.set(identifier);
    this._setupToken.set(setupToken);
  }

  private async setIdentifier(identifier: string): Promise<void> {
    this._identifier.set(identifier);
    await this.storage.setItem(AccountActivationService.IDENTIFIER_KEY, identifier);
  }

  private async setSetupToken(token: string): Promise<void> {
    this._setupToken.set(token);
    await this.storage.setItem(AccountActivationService.SETUP_TOKEN_KEY, token);
  }

  private async clearSetupToken(): Promise<void> {
    this._setupToken.set(null);
    await this.storage.removeItem(AccountActivationService.SETUP_TOKEN_KEY);
  }
}
