import client from './client';
import type { Bottle, CreateBottleDto, UpdateBottleDto, ConsumptionEntry } from '../types';

export const bottlesApi = {
  getAll: () =>
    client.get<Bottle[]>('/api/bottles').then(r => r.data),

  getOne: (id: string) =>
    client.get<Bottle>(`/api/bottles/${id}`).then(r => r.data),

  create: (data: CreateBottleDto) =>
    client.post<Bottle>('/api/bottles', data).then(r => r.data),

  update: (id: string, data: UpdateBottleDto) =>
    client.put<Bottle>(`/api/bottles/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    client.delete(`/api/bottles/${id}`).then(r => r.data),

  toggleFavorite: (id: string) =>
    client.put<Bottle>(`/api/bottles/${id}/favorite`).then(r => r.data),

  drink: (id: string, payload: { quantity?: number; note?: number; comment?: string; occasion?: string }) =>
    client.post<{ bottle: Bottle; entry: ConsumptionEntry }>(`/api/bottles/${id}/drink`, payload).then(r => r.data),

  getHistory: (id: string) =>
    client.get<ConsumptionEntry[]>(`/api/bottles/${id}/history`).then(r => r.data),

  addNote: (id: string, payload: { note: number; texte?: string; occasion?: string }) =>
    client.post<Bottle>(`/api/bottles/${id}/notes`, payload).then(r => r.data),

  deleteNote: (id: string, noteId: string) =>
    client.delete<Bottle>(`/api/bottles/${id}/notes/${noteId}`).then(r => r.data),

  recommend: () =>
    client.get<Bottle[]>('/api/bottles/recommend').then(r => r.data),

  suggestWine: (plat: string) =>
    client.post<{ plat: string; suggestions: string[]; bottles: Bottle[] }>('/api/bottles/suggest-wine', { plat }).then(r => r.data),
};
