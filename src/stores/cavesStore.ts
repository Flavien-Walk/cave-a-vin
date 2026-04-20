import { create } from 'zustand';
import { cavesApi } from '../api/caves.api';
import type { UserCave, CreateCaveDto } from '../api/caves.api';

interface CavesState {
  caves:      UserCave[];
  activeCave: UserCave | null;
  activeLieu: string | null;   // lieu actuellement sélectionné (= location d'une cave)
  isLoading:  boolean;
  error:      string | null;

  fetchCaves:   () => Promise<void>;
  createCave:   (data: CreateCaveDto) => Promise<UserCave>;
  updateCave:   (id: string, data: Partial<CreateCaveDto>) => Promise<void>;
  removeCave:   (id: string) => Promise<void>;
  setActiveCave: (cave: UserCave) => void;
  setActiveLieu: (lieu: string | null) => void;
  setDefault:   (id: string) => Promise<void>;
  clearError:   () => void;
}

export const useCavesStore = create<CavesState>((set, get) => ({
  caves:      [],
  activeCave: null,
  activeLieu: null,
  isLoading:  false,
  error:      null,

  fetchCaves: async () => {
    set({ isLoading: true, error: null });
    try {
      const caves = await cavesApi.getAll();

      // Lieux distincts définis sur les caves (= valeurs de location non vides)
      const allLieux = [...new Set(caves.map(c => c.location).filter(Boolean))] as string[];

      // Conserver le lieu actif s'il existe encore, sinon prendre le premier
      const currentLieu = get().activeLieu;
      const activeLieu  = currentLieu && allLieux.includes(currentLieu)
        ? currentLieu
        : allLieux[0] ?? null;

      // Caves du lieu actif (ou toutes si aucun lieu)
      const cavesInLieu = activeLieu
        ? caves.filter(c => c.location === activeLieu)
        : caves;

      // Conserver la cave active si elle existe toujours
      const currentCave = get().activeCave;
      const activeCave  = (currentCave && caves.find(c => c._id === currentCave._id))
        ?? cavesInLieu.find(c => c.isDefault)
        ?? cavesInLieu[0]
        ?? null;

      set({ caves, activeCave, activeLieu, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  createCave: async (data) => {
    const cave = await cavesApi.create(data);
    set(s => ({
      caves:      [...s.caves, cave],
      activeCave: s.caves.length === 0 ? cave : s.activeCave,
      // Si la cave a un lieu et qu'on n'en avait pas encore, l'activer
      activeLieu: s.activeLieu ?? cave.location ?? null,
    }));
    return cave;
  },

  updateCave: async (id, data) => {
    const updated = await cavesApi.update(id, data);
    set(s => ({
      caves:      s.caves.map(c => c._id === id ? updated : c),
      activeCave: s.activeCave?._id === id ? updated : s.activeCave,
    }));
  },

  removeCave: async (id) => {
    await cavesApi.remove(id);
    set(s => {
      const caves      = s.caves.filter(c => c._id !== id);
      const allLieux   = [...new Set(caves.map(c => c.location).filter(Boolean))] as string[];
      const activeLieu = s.activeLieu && allLieux.includes(s.activeLieu)
        ? s.activeLieu
        : allLieux[0] ?? null;
      const cavesInLieu = activeLieu ? caves.filter(c => c.location === activeLieu) : caves;
      const activeCave  = s.activeCave?._id === id
        ? cavesInLieu.find(c => c.isDefault) ?? cavesInLieu[0] ?? null
        : s.activeCave;
      return { caves, activeCave, activeLieu };
    });
  },

  setActiveCave: (cave) => set({ activeCave: cave }),

  setActiveLieu: (lieu) => {
    const { caves } = get();
    const cavesInLieu = lieu
      ? caves.filter(c => c.location === lieu)
      : caves.filter(c => !c.location);
    const activeCave = cavesInLieu.find(c => c.isDefault) ?? cavesInLieu[0] ?? null;
    set({ activeLieu: lieu, activeCave });
  },

  setDefault: async (id) => {
    const updated = await cavesApi.setDefault(id);
    set(s => ({
      caves:      s.caves.map(c => ({ ...c, isDefault: c._id === id })),
      activeCave: s.activeCave?._id === updated._id ? updated : s.activeCave,
    }));
  },

  clearError: () => set({ error: null }),
}));
