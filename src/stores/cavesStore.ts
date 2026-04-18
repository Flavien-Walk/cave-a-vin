import { create } from 'zustand';
import { cavesApi } from '../api/caves.api';
import type { UserCave, CreateCaveDto } from '../api/caves.api';
import { SITE_DEFINITIONS } from '../constants/sites';

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
  /** Crée les caves Lyon + Marseillan manquantes au premier lancement */
  initializeSites: () => Promise<void>;
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

  initializeSites: async () => {
    const { caves, createCave, fetchCaves } = get();
    let created = false;

    for (const site of SITE_DEFINITIONS) {
      for (const caveDef of site.caves) {
        // Cherche par nom (indépendamment de la location, pour éviter les doublons)
        const exists = caves.some(c => c.name === caveDef.name);
        if (!exists) {
          try {
            await createCave({
              name: caveDef.name,
              location: caveDef.location,
              emplacements: caveDef.emplacements,
            });
            created = true;
          } catch {
            // Ignore erreurs individuelles (connexion, etc.)
          }
        }
      }
    }

    if (created) {
      // Recharger pour avoir les IDs frais
      await fetchCaves();
    }

    // S'assurer que Cave 1 (Lyon) est active par défaut
    const updated = get();
    if (!updated.activeCave || updated.activeCave.location === undefined) {
      const cave1 = updated.caves.find(c => c.name === 'Cave 1')
        ?? updated.caves.find(c => c.location === 'Lyon')
        ?? updated.caves[0]
        ?? null;
      if (cave1) set({ activeCave: cave1 });
    }
  },
}));
