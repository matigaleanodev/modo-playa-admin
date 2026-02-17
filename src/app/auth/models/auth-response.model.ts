import { AuthUser } from './auth-user.model';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
