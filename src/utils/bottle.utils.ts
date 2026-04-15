import { Colors } from '../constants/colors';
import type { Bottle, CouleurVin } from '../types';

export const isUrgent = (bottle: Bottle): boolean => {
  if (!bottle.consommerAvant || bottle.quantite === 0) return false;
  return bottle.consommerAvant <= new Date().getFullYear();
};

export const isNearUrgent = (bottle: Bottle): boolean => {
  if (!bottle.consommerAvant || bottle.quantite === 0) return false;
  return bottle.consommerAvant <= new Date().getFullYear() + 1;
};

export const getWineColorHex = (couleur?: CouleurVin | string): string => {
  switch (couleur) {
    case 'rouge':        return Colors.rougeVin;
    case 'blanc':        return Colors.blancDore;
    case 'rosé':         return Colors.rosePale;
    case 'effervescent': return Colors.effervescent;
    case 'moelleux':     return Colors.moelleux;
    default:             return Colors.brunClair;
  }
};

export const getWineColorLight = (couleur?: CouleurVin | string): string => {
  switch (couleur) {
    case 'rouge':        return Colors.rougeVinLight;
    case 'blanc':        return Colors.blancDoreLight;
    case 'rosé':         return Colors.rosePaleLight;
    case 'effervescent': return Colors.effervescentLight;
    case 'moelleux':     return Colors.moelleuxLight;
    default:             return Colors.champagne;
  }
};

export const getWineGradient = (couleur?: CouleurVin | string): [string, string] => {
  switch (couleur) {
    case 'rouge':        return ['#8B3A45', '#4A1A22'];
    case 'blanc':        return ['#D4A843', '#8B6820'];
    case 'rosé':         return ['#D4748A', '#A04560'];
    case 'effervescent': return ['#6AADA0', '#3A7068'];
    case 'moelleux':     return ['#C4954A', '#8B5E20'];
    default:             return ['#8A7A72', '#4A3A34'];
  }
};

export const formatPrice = (price?: number): string => {
  if (price == null) return '';
  return price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
};

export const getAverageNote = (bottle: Bottle): number | null => {
  if (!bottle.notes?.length) return null;
  const sum = bottle.notes.reduce((acc, n) => acc + n.note, 0);
  return Math.round((sum / bottle.notes.length) * 10) / 10;
};

export const normalizeText = (str: string): string =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const filterAndSortBottles = (
  bottles: Bottle[],
  search: string,
  filters: {
    couleur?: string;
    format?: string;
    cave?: string;
    favoritesOnly?: boolean;
    urgentOnly?: boolean;
  },
  sortBy: string
): Bottle[] => {
  let result = [...bottles];

  if (search.trim()) {
    const q = normalizeText(search.trim());
    result = result.filter(b =>
      normalizeText(b.nom).includes(q) ||
      normalizeText(b.producteur ?? '').includes(q) ||
      normalizeText(b.region ?? '').includes(q) ||
      normalizeText(b.appellation ?? '').includes(q) ||
      normalizeText(b.pays ?? '').includes(q) ||
      String(b.annee ?? '').includes(q)
    );
  }

  if (filters.couleur)      result = result.filter(b => b.couleur === filters.couleur);
  if (filters.format)       result = result.filter(b => b.format === filters.format);
  if (filters.cave)         result = result.filter(b => b.cave === filters.cave);
  if (filters.favoritesOnly) result = result.filter(b => b.isFavorite);
  if (filters.urgentOnly)    result = result.filter(b => isNearUrgent(b));

  switch (sortBy) {
    case 'annee':     result.sort((a, b) => (b.annee ?? 0) - (a.annee ?? 0)); break;
    case 'nom':       result.sort((a, b) => a.nom.localeCompare(b.nom, 'fr')); break;
    case 'note':      result.sort((a, b) => (getAverageNote(b) ?? 0) - (getAverageNote(a) ?? 0)); break;
    case 'prix':      result.sort((a, b) => (b.prixAchat ?? 0) - (a.prixAchat ?? 0)); break;
    case 'quantite':  result.sort((a, b) => b.quantite - a.quantite); break;
    default:          result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return result;
};
