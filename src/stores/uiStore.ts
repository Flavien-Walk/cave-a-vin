import { create } from 'zustand';

export type CaveView = 'list' | 'grid';
export type SortBy = 'createdAt' | 'annee' | 'nom' | 'note' | 'prix' | 'quantite';

interface Filters {
  couleur?: string;
  format?: string;
  cave?: string;
  favoritesOnly: boolean;
  urgentOnly: boolean;
}

interface UIState {
  caveView: CaveView;
  activeFilters: Filters;
  searchQuery: string;
  sortBy: SortBy;

  setCaveView: (v: CaveView) => void;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  clearFilters: () => void;
  setSearchQuery: (q: string) => void;
  setSortBy: (s: SortBy) => void;
}

const DEFAULT_FILTERS: Filters = {
  couleur: undefined,
  format: undefined,
  cave: undefined,
  favoritesOnly: false,
  urgentOnly: false,
};

export const useUIStore = create<UIState>((set) => ({
  caveView: 'list',
  activeFilters: DEFAULT_FILTERS,
  searchQuery: '',
  sortBy: 'createdAt',

  setCaveView: (v) => set({ caveView: v }),
  setFilter: (key, value) =>
    set(s => ({ activeFilters: { ...s.activeFilters, [key]: value } })),
  clearFilters: () => set({ activeFilters: DEFAULT_FILTERS }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSortBy: (s) => set({ sortBy: s }),
}));
