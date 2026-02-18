export interface JwtPayload {
  sub: string;
  ownerId: string;
  role: Role;
  purpose: TokenPurpose;
}
export type TokenPurpose = 'ACCESS' | 'PASSWORD_SETUP' | 'REFRESH';

export type Role = 'OWNER' | 'SUPERADMIN';
