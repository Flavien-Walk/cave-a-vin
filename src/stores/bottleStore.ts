import { create } from 'zustand';
import { bottlesApi, statsApi } from '../api';
import type { Bottle, CreateBottleDto, UpdateBottleDto, CaveStats } from '../types';

interface BottleState {
  bottles: Bottle[];
  stats: CaveStats | null;
  isLoading: boolean;
  isStatsLoading: boolean;
  error: string | null;

  fetchBottles: () => Promise<void>;
  fetchStats: () => Promise<void>;
  addBottle: (data: CreateBottleDto) => Promise<void>;
  updateBottle: (id: string, data: UpdateBottleDto) => Promise<void>;
  deleteBottle: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  drinkBottle: (id: string, payload: { quantity?: number; note?: number; comment?: string; occasion?: string }) => Promise<void>;
  addNote: (id: string, payload: { note: number; texte?: string; occasion?: string }) => Promise<void>;
  deleteNote: (id: string, noteId: string) => Promise<void>;
  clearError: () => void;

  // selectors
  getFavorites: () => Bottle[];
  getUrgent: () => Bottle[];
  getByColor: (color: string) => Bottle[];
  getByCave: (cave: string) => Bottle[];
}

export const useBottleStore = create<BottleState>((set, get) => ({
  bottles: [],
  stats: null,
  isLoading: false,
  isStatsLoading: false,
  error: null,

  fetchBottles: async () => {
    set({ isLoading: true, error: null });
    try {
      const bottles = await bottlesApi.getAll();
      set({ bottles, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  fetchStats: async () => {
    set({ isStatsLoading: true });
    try {
      const stats = await statsApi.getSummary();
      set({ stats, isStatsLoading: false });
    } catch (err: any) {
      set({ isStatsLoading: false, error: err.message });
    }
  },

  addBottle: async (data) => {
    const bottle = await bottlesApi.create(data);
    set(s => ({ bottles: [bottle, ...s.bottles] }));
  },

  updateBottle: async (id, data) => {
    const updated = await bottlesApi.update(id, data);
    set(s => ({ bottles: s.bottles.map(b => b._id === id ? updated : b) }));
  },

  deleteBottle: async (id) => {
    await bottlesApi.remove(id);
    set(s => ({ bottles: s.bottles.filter(b => b._id !== id) }));
  },

  toggleFavorite: async (id) => {
    const updated = await bottlesApi.toggleFavorite(id);
    set(s => ({ bottles: s.bottles.map(b => b._id === id ? updated : b) }));
  },

  drinkBottle: async (id, payload) => {
    const { bottle } = await bottlesApi.drink(id, payload);
    set(s => ({ bottles: s.bottles.map(b => b._id === id ? bottle : b) }));
  },

  addNote: async (id, payload) => {
    const updated = await bottlesApi.addNote(id, payload);
    set(s => ({ bottles: s.bottles.map(b => b._id === id ? updated : b) }));
  },

  deleteNote: async (id, noteId) => {
    const updated = await bottlesApi.deleteNote(id, noteId);
    set(s => ({ bottles: s.bottles.map(b => b._id === id ? updated : b) }));
  },

  clearError: () => set({ error: null }),

  // ── Selectors ──
  getFavorites: () => get().bottles.filter(b => b.isFavorite),
  getUrgent: () => {
    const year = new Date().getFullYear();
    return get().bottles.filter(
      b => b.quantite > 0 && b.consommerAvant && b.consommerAvant <= year + 1
    );
  },
  getByColor: (color) => get().bottles.filter(b => b.couleur === color),
  getByCave: (cave) => get().bottles.filter(b => b.cave === cave),
}));
