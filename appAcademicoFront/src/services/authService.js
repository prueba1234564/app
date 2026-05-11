import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../api/axios';

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
    await AsyncStorage.setItem(TOKEN_KEY, token);
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
  const authToken = token ?? (await AsyncStorage.getItem(TOKEN_KEY));

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
    await AsyncStorage.setItem(TOKEN_KEY, finalToken);
  }

  return {
    ...data,
    token: finalToken,
    user: normalizeUser(data),
    roles: normalizeRoles(data),
  };
};

export const logout = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getToken = async () => AsyncStorage.getItem(TOKEN_KEY);

export default {
  login,
  seleccionarRol,
  logout,
  getMe,
  getToken,
};
