import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, from, map, mergeMap, Observable, tap } from 'rxjs';
import { AuthUser } from '@auth/models/auth-user.model';
import { TokenService } from './token.service';
import { NavService } from '@shared/services/nav/nav.service';
import { AuthService } from './auth.service';
import { Credentials } from '@auth/models/credentials.model';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly navService = inject(NavService);

  private readonly _isRefreshing = signal(false);
  readonly isRefreshing = this._isRefreshing.asReadonly();

  private refreshPromise: Promise<void> | null = null;

  private readonly _user = signal<AuthUser | null>(null);
  readonly user = this._user.asReadonly();

  readonly isAuthenticated = computed(() => !!this._user());

  async init(): Promise<void> {
    const accessToken = await this.tokenService.getAccessToken();

    if (!accessToken) {
      this._user.set(null);
      return;
    }

    try {
      const user = await firstValueFrom(this.authService.me());
      this._user.set(user);
    } catch {
      await this.logout();
    }
  }

  login(credentials: Credentials): Observable<void> {
    return this.authService
      .login(credentials)
      .pipe(
        mergeMap((response) =>
          from(
            this.tokenService.setTokens(
              response.accessToken,
              response.refreshToken,
            ),
          ).pipe(tap(() => this._user.set(response.user))),
        ),
      );
  }

  async logout(): Promise<void> {
    await this.tokenService.clearTokens();
    this._user.set(null);
    this.navService.root('/login');
  }

  async refresh(): Promise<void> {
    try {
      const response = await firstValueFrom(this.authService.refresh());

      await this.tokenService.setTokens(
        response.accessToken,
        response.refreshToken,
      );

      this._user.set(response.user);
    } catch (error) {
      await this.logout();
      throw error;
    }
  }

  refreshControlled(): Promise<void> {
    if (!this.refreshPromise) {
      this._isRefreshing.set(true);

      this.refreshPromise = this.refresh().finally(() => {
        this.refreshPromise = null;
        this._isRefreshing.set(false);
      });
    }

    return this.refreshPromise;
  }
}
