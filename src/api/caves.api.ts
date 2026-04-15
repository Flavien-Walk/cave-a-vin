import client from './client';

export interface UserCave {
  _id: string;
  name: string;
  location?: string;
  emplacements: string[];
  isDefault: boolean;
  createdAt: string;
}

export interface CreateCaveDto {
  name: string;
  location?: string;
  emplacements?: string[];
}

export const cavesApi = {
  getAll: () =>
    client.get<UserCave[]>('/api/caves').then(r => r.data),

  create: (data: CreateCaveDto) =>
    client.post<UserCave>('/api/caves', data).then(r => r.data),

  update: (id: string, data: Partial<CreateCaveDto>) =>
    client.put<UserCave>(`/api/caves/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    client.delete(`/api/caves/${id}`).then(r => r.data),

  setDefault: (id: string) =>
    client.put<UserCave>(`/api/caves/${id}/default`).then(r => r.data),
};
