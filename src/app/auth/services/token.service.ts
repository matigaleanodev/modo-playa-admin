import { inject, Injectable } from '@angular/core';
import { JwtPayload, Role, TokenPurpose } from '../models/token.model';
import { StorageService } from '@shared/services/storage/storage.service';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly storage = inject(StorageService);

  private _accessToken: string | null = null;
  private _refreshToken: string | null = null;

  private static readonly ACCESS_KEY = 'access_token';
  private static readonly REFRESH_KEY = 'refresh_token';

  async getAccessToken(): Promise<string | null> {
    if (this._accessToken) return this._accessToken;

    const token = await this.storage.getItem<string>(TokenService.ACCESS_KEY);

    this._accessToken = token;
    return token;
  }

  async getRefreshToken(): Promise<string | null> {
    if (this._refreshToken) return this._refreshToken;

    const token = await this.storage.getItem<string>(TokenService.REFRESH_KEY);

    this._refreshToken = token;
    return token;
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    this._accessToken = accessToken;
    this._refreshToken = refreshToken;

    await this.storage.setItem(TokenService.ACCESS_KEY, accessToken);
    await this.storage.setItem(TokenService.REFRESH_KEY, refreshToken);
  }

  async clearTokens(): Promise<void> {
    this._accessToken = null;
    this._refreshToken = null;

    await this.storage.removeItem(TokenService.ACCESS_KEY);
    await this.storage.removeItem(TokenService.REFRESH_KEY);
  }

  decode(token: string): JwtPayload {
    const payload = token.split('.')[1];
    const decoded = atob(payload);
    return JSON.parse(decoded) as JwtPayload;
  }

  isExpired(token: string): boolean {
    try {
      const payload = this.decode(token);

      if (!payload.exp) return true;

      const expiration = payload.exp * 1000;
      return Date.now() > expiration;
    } catch {
      return true;
    }
  }

  async getOwnerId(): Promise<string | null> {
    const token = await this.getAccessToken();
    if (!token) return null;

    return this.decode(token).ownerId ?? null;
  }

  async getRole(): Promise<Role | null> {
    const token = await this.getAccessToken();
    if (!token) return null;

    return this.decode(token).role ?? null;
  }

  async getPurpose(): Promise<TokenPurpose | null> {
    const token = await this.getAccessToken();
    if (!token) return null;

    return this.decode(token).purpose ?? null;
  }
}
