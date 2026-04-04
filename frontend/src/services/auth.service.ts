/**
 * services/auth.service.ts
 * Servicio de autenticación conectado al backend real
 */

import { apiClient, clearSession } from '../utils/api';
import { devError } from "../utils/devLog";
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  LoginResponse,
  ApiEnvelope,
} from '../types';

// ============================================
// CONSTANTES
// ============================================

const TOKEN_KEY = 'solucionatech_token';
const LEGACY_TOKEN_KEY = 'token';
const USER_KEY = 'solucionatech_user';

// ============================================
// FUNCIONES PRINCIPALES DE AUTENTICACIÓN
// ============================================

/**
 * Iniciar sesión
 * @param credentials - Email y contraseña del usuario
 * @returns Datos del usuario autenticado y token JWT
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<ApiEnvelope<LoginResponse> & LoginResponse>(
      '/auth/login',
      credentials,
      { requiresAuth: false }
    );

    // Contrato estandar: { success, data: { user, token }, message }
    // TODO: eliminar fallback legacy en fase 2.
    const payload = response.data ?? response;
    const user = payload?.user ?? (response as LoginResponse).user;
    const token = payload?.token ?? (response as LoginResponse).token;

    if (!user || !token) {
      throw new Error('Respuesta invalida de login: faltan user/token');
    }

    setToken(token);
    setUser(user);

    return { user, token };
  } catch (error) {
    devError('Error en login:', error);
    throw error;
  }
};

/**
 * Registrar nuevo usuario
 * @param data - Datos del nuevo usuario (name, email, password, role)
 * @returns Datos del usuario registrado y token JWT
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<ApiEnvelope<AuthResponse> & AuthResponse>(
      '/auth/register',
      data,
      { requiresAuth: false }
    );

    // Contrato estandar: { success, data: { user, token }, message }
    // TODO: eliminar fallback legacy en fase 2.
    const payload = response.data ?? response;
    const user = payload?.user ?? (response as AuthResponse).user;
    const token = payload?.token ?? (response as AuthResponse).token;

    if (!user || !token) {
      throw new Error('Respuesta invalida de registro: faltan user/token');
    }

    setToken(token);
    setUser(user);

    return { user, token };
  } catch (error) {
    devError('Error en register:', error);
    throw error;
  }
};

/**
 * Obtener perfil del usuario autenticado
 * @returns Datos del usuario actual
 */
export const fetchCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get<ApiEnvelope<{ user: User }> & { user: User }>('/auth/me');
    // TODO: eliminar fallback legacy en fase 2.
    const user = response.data?.user ?? response.user;
    setUser(user);
    return user;
  } catch (error) {
    devError('Error en fetchCurrentUser:', error);
    throw error;
  }
};

// Compatibilidad: mantener nombre anterior
export const getProfile = async (): Promise<User> => {
  return fetchCurrentUser();
};

/**
 * Cerrar sesión
 * Limpia el token y los datos del usuario del localStorage
 */
export const logout = (): void => {
  clearSession();
};

// ============================================
// FUNCIONES DE MANEJO DE LOCALSTORAGE
// ============================================

/**
 * Guardar token en localStorage
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(LEGACY_TOKEN_KEY, token);
};

/**
 * Obtener token del localStorage
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
};

/**
 * Eliminar token del localStorage
 */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
};

/**
 * Guardar usuario en localStorage
 */
export const setUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Obtener usuario del localStorage
 */
export const getUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as User;
  } catch (error) {
    devError('Error al parsear usuario:', error);
    return null;
  }
};

/**
 * Eliminar usuario del localStorage
 */
export const removeUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

/**
 * Verificar si el usuario está autenticado
 * @returns true si hay token y usuario en localStorage
 */
export const isAuthenticated = (): boolean => {
  return !!getToken() && !!getUser();
};

/**
 * Obtener el rol del usuario actual
 * @returns 'client' | 'technician' | null
 */
export const getUserRole = (): 'client' | 'technician' | null => {
  const user = getUser();
  return user?.role || null;
};

/**
 * Verificar si el usuario es técnico
 */
export const isTechnician = (): boolean => {
  return getUserRole() === 'technician';
};

/**
 * Verificar si el usuario es cliente
 */
export const isClient = (): boolean => {
  return getUserRole() === 'client';
};


