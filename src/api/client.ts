import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { API_URL } from '../constants';
import { useAuthStore } from '../stores/authStore';

const client = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// Injecte le token JWT sur chaque requête
client.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('cave_token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
  } catch { /* ignore */ }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      // Token expiré ou invalide — nettoie le store Zustand (qui gère SecureStore)
      // et redirige vers le login
      try { await useAuthStore.getState().logout(); } catch { /* ignore */ }
      router.replace('/(auth)/login');
      return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'));
    }
    const message =
      err.response?.data?.message ??
      (err.code === 'ECONNABORTED' ? 'La requête a expiré.' : 'Erreur réseau.');
    return Promise.reject(new Error(message));
  }
);

export default client;
