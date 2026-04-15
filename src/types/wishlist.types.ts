import type { CouleurVin } from '../constants/wine';

export type WishlistPriorite = 'haute' | 'normale' | 'basse';

export interface WishlistItem {
  _id: string;
  nom: string;
  producteur?: string;
  region?: string;
  appellation?: string;
  annee?: number;
  couleur?: CouleurVin;
  priorite: WishlistPriorite;
  prixCible?: number;
  note?: string;
  url?: string;
  isPurchased: boolean;
  purchasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateWishlistDto = Omit<WishlistItem, '_id' | 'isPurchased' | 'purchasedAt' | 'createdAt' | 'updatedAt'>;
export type UpdateWishlistDto = Partial<CreateWishlistDto>;
