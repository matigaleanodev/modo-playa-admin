import { BaseEntity } from '@core/models/entity.model';

export interface AdminUser extends BaseEntity {
  email: string;
  username: string;
  isActive: boolean;
  isPasswordSet: boolean;
  lastLoginAt?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
}

export interface CreateAdminUserDto {
  username: string;
  email: string;
}
