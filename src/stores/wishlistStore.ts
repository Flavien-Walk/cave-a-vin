import { create } from 'zustand';
import { wishlistApi } from '../api';
import type { WishlistItem, CreateWishlistDto, UpdateWishlistDto } from '../types';

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  addItem: (data: CreateWishlistDto) => Promise<void>;
  updateItem: (id: string, data: UpdateWishlistDto) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  markPurchased: (id: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const items = await wishlistApi.getAll();
      set({ items, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  addItem: async (data) => {
    const item = await wishlistApi.create(data);
    set(s => ({ items: [item, ...s.items] }));
  },

  updateItem: async (id, data) => {
    const updated = await wishlistApi.update(id, data);
    set(s => ({ items: s.items.map(i => i._id === id ? updated : i) }));
  },

  deleteItem: async (id) => {
    await wishlistApi.remove(id);
    set(s => ({ items: s.items.filter(i => i._id !== id) }));
  },

  markPurchased: async (id) => {
    const updated = await wishlistApi.markPurchased(id);
    set(s => ({ items: s.items.map(i => i._id === id ? updated : i) }));
  },
}));
