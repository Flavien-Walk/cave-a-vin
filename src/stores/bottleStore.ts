import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { bottlesApi, statsApi } from '../api';
import type { Bottle, CreateBottleDto, UpdateBottleDto, CaveStats } from '../types';

// ── Persistance locale des photos (expo-file-system + AsyncStorage) ───────────
// Les photos prises lors du scan d'étiquette sont stockées dans le répertoire
// documentDirectory de l'app (persistent entre les sessions, supprimé à la
// désinstallation). La map bottleId → localPath est sauvegardée dans AsyncStorage.
// Aucun chemin local n'est envoyé au backend : photoUrl backend reste réservé
// aux URLs HTTP futures (ex. Cloudinary).

const LOCAL_PHOTOS_KEY = 'cave_bottle_local_photos_v1';

async function loadLocalPhotos(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_PHOTOS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function persistLocalPhotos(map: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_PHOTOS_KEY, JSON.stringify(map));
  } catch {}
}

async function savePhotoLocally(bottleId: string, sourceUri: string): Promise<string | null> {
  try {
    // URL distante déjà exploitable telle quelle (ex: backend / cloud).
    if (/^https?:\/\//i.test(sourceUri)) return sourceUri;

    const dir = (FileSystem.documentDirectory ?? '') + 'bottle_photos/';
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const dest = dir + bottleId + '.jpg';
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch {
    return null;
  }
}

async function deletePhotoLocally(path: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(path, { idempotent: true });
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────

interface BottleState {
  bottles: Bottle[];
  stats: CaveStats | null;
  isLoading: boolean;
  isStatsLoading: boolean;
  error: string | null;
  localPhotos: Record<string, string>; // bottleId → file:// URI

  fetchBottles: () => Promise<void>;
  fetchStats: () => Promise<void>;
  addBottle: (data: CreateBottleDto, localPhotoUri?: string) => Promise<void>;
  updateBottle: (id: string, data: UpdateBottleDto) => Promise<void>;
  updateLocalPhoto: (id: string, photoUri: string | null) => Promise<void>;
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
  localPhotos: {},

  fetchBottles: async () => {
    set({ isLoading: true, error: null });
    try {
      const [bottles, localPhotosFromStorage] = await Promise.all([
        bottlesApi.getAll(),
        loadLocalPhotos(),
      ]);
      // Keep freshest in-memory entries (e.g. just-created photos) while reloading storage.
      const mergedLocalPhotos = {
        ...localPhotosFromStorage,
        ...get().localPhotos,
      };
      set({ bottles, localPhotos: mergedLocalPhotos, isLoading: false });
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

  addBottle: async (data, localPhotoUri?) => {
    const bottle = await bottlesApi.create(data);
    set(s => ({ bottles: [bottle, ...s.bottles] }));

    if (localPhotoUri) {
      const localPath = await savePhotoLocally(bottle._id, localPhotoUri);
      if (localPath) {
        const newMap = { ...get().localPhotos, [bottle._id]: localPath };
        set({ localPhotos: newMap });
        await persistLocalPhotos(newMap);
      }
    }
  },

  updateBottle: async (id, data) => {
    const updated = await bottlesApi.update(id, data);
    set(s => ({ bottles: s.bottles.map(b => b._id === id ? updated : b) }));
  },

  updateLocalPhoto: async (id, photoUri) => {
    const current = get().localPhotos;
    if (photoUri === null) {
      // Supprimer
      if (current[id]) deletePhotoLocally(current[id]);
      const newMap = { ...current };
      delete newMap[id];
      set({ localPhotos: newMap });
      await persistLocalPhotos(newMap);
    } else {
      // Remplacer/ajouter
      if (current[id]) deletePhotoLocally(current[id]);
      const localPath = await savePhotoLocally(id, photoUri);
      if (localPath) {
        const newMap = { ...current, [id]: localPath };
        set({ localPhotos: newMap });
        await persistLocalPhotos(newMap);
      }
    }
  },

  deleteBottle: async (id) => {
    await bottlesApi.remove(id);
    const localPath = get().localPhotos[id];
    if (localPath) deletePhotoLocally(localPath);
    const newMap = { ...get().localPhotos };
    delete newMap[id];
    set(s => ({ bottles: s.bottles.filter(b => b._id !== id), localPhotos: newMap }));
    if (localPath) await persistLocalPhotos(newMap);
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
