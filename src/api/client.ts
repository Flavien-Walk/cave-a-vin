import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants';

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
  (err) => {
    const message =
      err.response?.data?.message ??
      (err.code === 'ECONNABORTED' ? 'La requête a expiré.' : 'Erreur réseau.');
    return Promise.reject(new Error(message));
  }
);

export default client;
