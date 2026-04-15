import { create } from 'zustand';
import { cavesApi } from '../api/caves.api';
import type { UserCave, CreateCaveDto } from '../api/caves.api';

interface CavesState {
  caves: UserCave[];
  activeCave: UserCave | null;
  isLoading: boolean;
  error: string | null;

  fetchCaves: () => Promise<void>;
  createCave: (data: CreateCaveDto) => Promise<UserCave>;
  updateCave: (id: string, data: Partial<CreateCaveDto>) => Promise<void>;
  removeCave: (id: string) => Promise<void>;
  setActiveCave: (cave: UserCave) => void;
  setDefault: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCavesStore = create<CavesState>((set, get) => ({
  caves: [],
  activeCave: null,
  isLoading: false,
  error: null,

  fetchCaves: async () => {
    set({ isLoading: true, error: null });
    try {
      const caves = await cavesApi.getAll();
      const defaultCave = caves.find(c => c.isDefault) ?? caves[0] ?? null;
      const current = get().activeCave;
      // Keep active cave if it still exists, else fallback to default
      const activeCave = current
        ? caves.find(c => c._id === current._id) ?? defaultCave
        : defaultCave;
      set({ caves, activeCave, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  createCave: async (data) => {
    const cave = await cavesApi.create(data);
    set(s => ({
      caves: [...s.caves, cave],
      activeCave: s.caves.length === 0 ? cave : s.activeCave,
    }));
    return cave;
  },

  updateCave: async (id, data) => {
    const updated = await cavesApi.update(id, data);
    set(s => ({
      caves: s.caves.map(c => c._id === id ? updated : c),
      activeCave: s.activeCave?._id === id ? updated : s.activeCave,
    }));
  },

  removeCave: async (id) => {
    await cavesApi.remove(id);
    set(s => {
      const caves = s.caves.filter(c => c._id !== id);
      const activeCave = s.activeCave?._id === id
        ? caves.find(c => c.isDefault) ?? caves[0] ?? null
        : s.activeCave;
      return { caves, activeCave };
    });
  },

  setActiveCave: (cave) => set({ activeCave: cave }),

  setDefault: async (id) => {
    const updated = await cavesApi.setDefault(id);
    set(s => ({
      caves: s.caves.map(c => ({ ...c, isDefault: c._id === id })),
      activeCave: s.activeCave?._id === updated._id ? updated : s.activeCave,
    }));
  },

  clearError: () => set({ error: null }),
}));
