import { Role } from './token.model';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  role: Role;
}
