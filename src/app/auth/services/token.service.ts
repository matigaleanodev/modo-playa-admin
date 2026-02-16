import { Injectable } from '@angular/core';
import { JwtPayload, Role, TokenPurpose } from '../models/token.model';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  decode(token: string): JwtPayload {
    return {} as JwtPayload;
  }
  isExpired(token: string): boolean {
    return true;
  }
  getOwnerId(): string | null {
    return '';
  }
  getRole(): Role | null {
    return null;
  }
  getPurpose(): TokenPurpose | null {
    return null;
  }
}
