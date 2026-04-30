import client from './client';
import type { CaveStats, CaveValueData, DashboardData } from '../types';

export const statsApi = {
  getSummary: () =>
    client.get<CaveStats>('/api/stats/summary').then(r => r.data),

  getCaveValue: () =>
    client.get<CaveValueData>('/api/stats/cave-value').then(r => r.data),

  getDashboard: () =>
    client.get<DashboardData>('/api/stats/dashboard').then(r => r.data),
};
