import { AuthUser } from './auth-user.model';

interface SessionState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: 'anonymous' | 'authenticated' | 'refreshing';
}
