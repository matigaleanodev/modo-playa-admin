import { Role } from './token.model';

export interface AuthUserProfileImage {
  imageId: string;
  key: string;
  width?: number;
  height?: number;
  bytes?: number;
  mime?: string;
  createdAt: string;
  url: string;
  variants?: {
    thumb: string;
    card: string;
    hero: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  profileImage?: AuthUserProfileImage;
  phone?: string;
  role: Role;
}
