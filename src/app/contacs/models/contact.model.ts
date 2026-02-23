import { BaseEntity } from '@core/models/entity.model';

export interface Contact extends BaseEntity {
  name: string;
  email?: string;
  whatsapp?: string;
  isDefault?: boolean;
  notes?: string;
}
