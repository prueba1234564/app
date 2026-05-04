import React, { createContext, useContext, useEffect, useState } from 'react';

import * as authService from '../services/authService';

const AuthContext = createContext(null);

const normalizeRoleName = (role) => {
  if (!role) return '';
  
  if (typeof role === 'string') {
    return role;
  }

  return role?.name ?? role?.nombre ?? role?.slug ?? role?.rol ?? '';
};

const extractRoles = (payload) => {
  if (Array.isArray(payload?.roles)) {
    return payload.roles;
  }

  if (Array.isArray(payload?.user?.roles)) {
    return payload.user.roles;
  }

  if (Array.isArray(payload?.usuario?.roles)) {
    return payload.usuario.roles;
  }

  return [];
};

const extractUser = (payload) => payload?.user ?? payload?.usuario ?? payload?.data?.user ?? payload ?? null;

const extractActiveRole = (payload) => {
  const explicitRole =
    payload?.rolActivo ??
    payload?.rol_activo ??
    payload?.activeRole ??
    payload?.active_role ??
    payload?.role ??
    payload?.rol;

  if (explicitRole) {
    return normalizeRoleName(explicitRole);
  }

  const roles = extractRoles(payload);
  if (roles.length === 1) {
    return normalizeRoleName(roles[0]);
  }

  return '';
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState('');
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRoles, setPendingRoles] = useState([]);

  const hydrateAuthState = async () => {
    try {
      const storedToken = await authService.getToken();

      if (!storedToken) {
        return;
      }

      setToken(storedToken);

      const me = await authService.getMe();
      const user = extractUser(me);
      const activeRole = extractActiveRole(me);

      setUsuario(user);
      setRol(activeRole);
      setPendingRoles([]);
    } catch (_error) {
      await authService.logout();
      setUsuario(null);
      setRol('');
      setToken(null);
      setPendingRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    hydrateAuthState();
  }, []);

  const handleLogin = async (email, password) => {
    const response = await authService.login(email, password);
    const user = extractUser(response);
    const availableRoles = extractRoles(response);
    const activeRole = extractActiveRole(response);

    setToken(response.token ?? (await authService.getToken()));
    setUsuario(user);

    if (availableRoles.length > 1 && !activeRole) {
      setRol('');
      setPendingRoles(availableRoles);

      return {
        requiresRoleSelection: true,
        roles: availableRoles,
        user,
      };
    }

    setRol(activeRole || normalizeRoleName(availableRoles[0]));
    setPendingRoles([]);

    return {
      requiresRoleSelection: false,
      roles: availableRoles,
      user,
    };
  };

  const handleSeleccionarRol = async (selectedRole) => {
    const currentToken = await authService.getToken();
    const roleValue = normalizeRoleName(selectedRole);
    const response = await authService.seleccionarRol(roleValue, currentToken);
    const user = extractUser(response) ?? usuario;
    const activeRole = extractActiveRole(response) || roleValue;

    setToken(response.token ?? (await authService.getToken()));
    setUsuario(user);
    setRol(activeRole);
    setPendingRoles([]);

    return {
      user,
      rol: activeRole,
    };
  };

  const handleLogout = async () => {
    await authService.logout();
    setUsuario(null);
    setRol('');
    setToken(null);
    setPendingRoles([]);
  };

  const value = {
    usuario,
    rol,
    token,
    isLoading,
    isAuthenticated: Boolean(token && usuario),
    pendingRoles,
    login: handleLogin,
    seleccionarRol: handleSeleccionarRol,
    logout: handleLogout,
    restoreSession: hydrateAuthState,
  };

  // Debug logging
  console.log('AuthContext - rol:', rol, 'usuario:', usuario);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
};
