import { BaseEntity } from '@core/models/entity.model';

export type LodgingType = 'cabin' | 'apartment' | 'house';
export type PriceUnit = 'night' | 'week' | 'fortnight';
export type LodgingAmenity =
  | 'sea_view'
  | 'pool'
  | 'parrilla'
  | 'wifi'
  | 'air_conditioning'
  | 'heating'
  | 'cable_tv'
  | 'pets_allowed'
  | 'garage';

export interface AvailabilityRange {
  from: string;
  to: string;
}

export interface LodgingImageVariants {
  thumb: string;
  card: string;
  hero: string;
}

export interface LodgingMediaImage {
  imageId: string;
  key: string;
  isDefault: boolean;
  width?: number;
  height?: number;
  bytes?: number;
  mime?: string;
  createdAt: string;
  url: string;
  variants?: LodgingImageVariants;
}

export interface Lodging extends BaseEntity {
  title: string;
  description: string;
  location: string;
  city: string;
  type: LodgingType;
  price: number;
  priceUnit: PriceUnit;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  minNights: number;
  distanceToBeach?: number | null;
  amenities?: LodgingAmenity[];
  mainImage: string;
  images?: string[];
  mediaImages?: LodgingMediaImage[];
  occupiedRanges?: AvailabilityRange[];
  contactId?: string | null;
  isPubliclyVisible: boolean;
}

export type LodgingSaveDto = Omit<Lodging, 'id'>;

export function createEmptyLodging(): Lodging {
  return {
    id: '',
    title: '',
    description: '',
    location: '',
    city: '',
    type: 'cabin',
    price: 0,
    priceUnit: 'night',
    maxGuests: 1,
    bedrooms: 0,
    bathrooms: 0,
    minNights: 1,
    distanceToBeach: null,
    amenities: [],
    mainImage: '',
    images: [],
    mediaImages: [],
    contactId: null,
    isPubliclyVisible: true,
  };
}
