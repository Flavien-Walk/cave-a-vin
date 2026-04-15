import type { CouleurVin, FormatBouteille } from '../constants/wine';

export type { CouleurVin, FormatBouteille };

export type WineSource = 'manual' | 'scan' | 'import';

export interface TastingNote {
  _id: string;
  note: number;
  texte?: string;
  occasion?: string;
  date: string;
}

export interface Bottle {
  _id: string;
  nom: string;
  producteur?: string;
  region?: string;
  appellation?: string;
  annee?: number;
  pays?: string;
  cepage?: string;
  couleur?: CouleurVin;
  format?: FormatBouteille;
  quantite: number;
  cave?: string;
  emplacement?: string;
  prixAchat?: number;
  lieuAchat?: string;
  dateAchat?: string;
  consommerAvant?: number;
  consommerApresOptimal?: number;
  photoUrl?: string;
  photoThumbUrl?: string;
  isFavorite: boolean;
  notes: TastingNote[];
  notePerso?: {
    texte: string;
    note: number;
    date?: string;
  };
  source?: WineSource;
  // virtuals from backend
  isUrgent?: boolean;
  averageNote?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateBottleDto = Omit<Bottle,
  '_id' | 'isFavorite' | 'notes' | 'isUrgent' | 'averageNote' | 'createdAt' | 'updatedAt'
>;

export type UpdateBottleDto = Partial<CreateBottleDto>;

export interface ConsumptionEntry {
  _id: string;
  bottleId: string;
  quantity: number;
  date: string;
  note?: number;
  comment?: string;
  occasion?: string;
}

export interface CaveStats {
  totalBottles: number;
  totalValue: number;
  totalReferences: number;
  favorites: number;
  urgent: number;
  byColor: { couleur: string; count: number; percentage: number }[];
  byRegion: { region: string; count: number }[];
  byYear: { annee: number; count: number }[];
  byCave: { cave: string; count: number }[];
  consumed: {
    thisMonth: number;
    thisYear: number;
    total: number;
  };
}
