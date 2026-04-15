import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  user:      AuthUser | null;
  token:     string | null;
  isLoading: boolean;

  // Actions
  login:       (email: string, password: string) => Promise<void>;
  register:    (name: string, email: string, password: string) => Promise<void>;
  logout:      () => Promise<void>;
  loadSession: () => Promise<boolean>;
  updateMe:    (name?: string, password?: string) => Promise<void>;
}

const TOKEN_KEY = '@cave_token';
const USER_KEY  = '@cave_user';

async function apiFetch(path: string, options: RequestInit & { token?: string } = {}) {
  const { token, ...rest } = options;
  const res = await fetch(API_URL + path, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? 'Erreur réseau.');
  return data;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:      null,
  token:     null,
  isLoading: true,

  loadSession: async () => {
    try {
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      if (token && userJson) {
        const user = JSON.parse(userJson) as AuthUser;
        set({ user, token, isLoading: false });
        // Vérifie que le token est encore valide
        try {
          const { user: fresh } = await apiFetch('/api/auth/me', { token });
          set({ user: fresh });
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh));
        } catch {
          // Token expiré — déconnexion silencieuse
          await get().logout();
          return false;
        }
        return true;
      }
    } catch { /* ignore */ }
    set({ isLoading: false });
    return false;
  },

  login: async (email, password) => {
    const { token, user } = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
    ]);
    set({ user, token });
  },

  register: async (name, email, password) => {
    const { token, user } = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
    ]);
    set({ user, token });
  },

  logout: async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    set({ user: null, token: null, isLoading: false });
  },

  updateMe: async (name, password) => {
    const { token } = get();
    const { user } = await apiFetch('/api/auth/me', {
      method: 'PUT',
      token: token!,
      body: JSON.stringify({ name, password }),
    });
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },
}));
