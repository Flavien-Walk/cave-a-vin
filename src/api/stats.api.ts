import client from './client';
import type { CaveStats } from '../types';

export const statsApi = {
  getSummary: () =>
    client.get<CaveStats>('/api/stats/summary').then(r => r.data),
};
