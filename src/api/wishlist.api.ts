import client from './client';
import type { WishlistItem, CreateWishlistDto, UpdateWishlistDto } from '../types';

export const wishlistApi = {
  getAll: () =>
    client.get<WishlistItem[]>('/api/wishlist').then(r => r.data),

  create: (data: CreateWishlistDto) =>
    client.post<WishlistItem>('/api/wishlist', data).then(r => r.data),

  update: (id: string, data: UpdateWishlistDto) =>
    client.put<WishlistItem>(`/api/wishlist/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    client.delete(`/api/wishlist/${id}`).then(r => r.data),

  markPurchased: (id: string) =>
    client.put<WishlistItem>(`/api/wishlist/${id}/purchase`).then(r => r.data),
};
