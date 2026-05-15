import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import api from '../api/axios';

const storage = {
  getItem: async (key) => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return AsyncStorage.getItem(key);
  },
  setItem: async (key, value) => {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    return AsyncStorage.removeItem(key);
  },
};

const TOKEN_KEY = 'token';

const normalizeRoles = (payload) => {
  if (Array.isArray(payload?.roles)) {
    return payload.roles;
  }

  if (Array.isArray(payload?.user?.roles)) {
    return payload.user.roles;
  }

  return [];
};

const normalizeUser = (payload) => payload?.user ?? payload?.usuario ?? payload?.data?.user ?? null;

const normalizeToken = (payload) =>
  payload?.token ??
  payload?.access_token ??
  payload?.plainTextToken ??
  payload?.data?.token ??
  null;

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const data = response.data;
  const token = normalizeToken(data);

  if (token) {
    await storage.setItem(TOKEN_KEY, token);
  }

  return {
    ...data,
    token,
    user: normalizeUser(data),
    roles: normalizeRoles(data),
  };
};

export const seleccionarRol = async (rol, token) => {
  // Usar el token pasado como parámetro, o leer del storage como fallback
  const authToken = token ?? (await storage.getItem(TOKEN_KEY));

  const response = await api.post(
    '/auth/seleccionar-rol',
    { rol },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );

  const data = response.data;
  const finalToken = normalizeToken(data);

  if (finalToken) {
    await storage.setItem(TOKEN_KEY, finalToken);
  }

  return {
    ...data,
    token: finalToken,
    user: normalizeUser(data),
    roles: normalizeRoles(data),
  };
};

export const logout = async () => {
  await storage.removeItem(TOKEN_KEY);
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getToken = async () => storage.getItem(TOKEN_KEY);

export default {
  login,
  seleccionarRol,
  logout,
  getMe,
  getToken,
};
