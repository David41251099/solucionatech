/**
 * utils/api.ts
 * Cliente HTTP reutilizable con manejo automático de autenticación y errores
 */
const RAW_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const API_ORIGIN = RAW_API_URL.endsWith('/api')
    ? RAW_API_URL.slice(0, -4)
    : RAW_API_URL;
const API_BASE_URL = RAW_API_URL.endsWith('/api')
    ? RAW_API_URL
    : `${RAW_API_URL}/api`;
const TOKEN_KEY = 'solucionatech_token';
const LEGACY_TOKEN_KEY = 'token';
const USER_KEY = 'solucionatech_user';

/**
 * Interfaz para opciones de configuración de peticiones
 */
interface RequestOptions extends RequestInit {
    requiresAuth?: boolean;
}

/**
 * Clase de error personalizada para errores de API
 */
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public data?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Obtiene el token de autenticación del localStorage
 */
const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

/**
 * Limpia la sesión del usuario (localStorage)
 */
const clearSession = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

/**
 * Redirige al usuario a la página de login
 */
const redirectToLogin = (): void => {
    // Limpiar sesión
    clearSession();

    // Redirigir a login solo si no estamos ya ahí
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

/**
 * Cliente HTTP principal
 * Realiza peticiones HTTP con configuración automática de headers y manejo de errores
 */
class HttpClient {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    /**
     * Método principal para realizar peticiones HTTP
     */
    private async request<T>(
        endpoint: string,
        options: RequestOptions = {}
    ): Promise<T> {
        const { requiresAuth = true, ...fetchOptions } = options;

        // Construir URL completa
        const url = `${this.baseURL}${endpoint}`;

        const incomingHeaders = (fetchOptions.headers as Record<string, string>) || {};
        const hasContentType = Object.keys(incomingHeaders).some(
            (key) => key.toLowerCase() === 'content-type'
        );
        const headers: Record<string, string> = {
            ...(hasContentType ? {} : { 'Content-Type': 'application/json' }),
            ...incomingHeaders,
        };

        // Agregar token de autenticación si es requerido
        if (requiresAuth) {
            const token = getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        // Configurar opciones de fetch
        const config: RequestInit = {
            ...fetchOptions,
            headers,
        };

        try {
            // Realizar petición
            const response = await fetch(url, config);

            // Manejar respuesta vacía (204 No Content)
            if (response.status === 204) {
                return {} as T;
            }

            // Parsear respuesta JSON
            const data = await response.json().catch(() => ({}));

            // Manejar errores HTTP
            if (!response.ok) {
                // Caso especial: 401 Unauthorized
                if (response.status === 401) {
                    redirectToLogin();
                    throw new ApiError(401, 'Sesión expirada. Por favor, inicia sesión nuevamente.');
                }

                // Otros errores HTTP
                const errorMessage =
                    (data as Record<string, unknown>).message ||
                    (data as Record<string, unknown>).error ||
                    'Error en la petición';
                throw new ApiError(response.status, String(errorMessage), {
                    ...(data as Record<string, unknown>),
                    status: response.status,
                    message: String(errorMessage),
                });
            }

            return data as T;
        } catch (error) {
            // Si es un ApiError, propagarlo
            if (error instanceof ApiError) {
                throw error;
            }

            // Errores de red o desconocidos
            if (error instanceof TypeError) {
                throw new ApiError(0, 'Error de red. Verifica tu conexión a internet.');
            }

            // Error desconocido
            throw new ApiError(500, 'Error inesperado. Intenta nuevamente.');
        }
    }

    /**
     * Petición GET
     */
    async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'GET',
        });
    }

    /**
     * Petición POST
     */
    async post<T>(
        endpoint: string,
        body?: unknown,
        options?: RequestOptions
    ): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    /**
     * Petición PUT
     */
    async put<T>(
        endpoint: string,
        body?: unknown,
        options?: RequestOptions
    ): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    /**
     * Petición PATCH
     */
    async patch<T>(
        endpoint: string,
        body?: unknown,
        options?: RequestOptions
    ): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    /**
     * Petición DELETE
     */
    async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'DELETE',
        });
    }
}

// Exportar instancia única del cliente HTTP
export const apiClient = new HttpClient(API_BASE_URL);
export const publicApiUrl = API_ORIGIN.replace(/\/+$/, '');
export const publicApiBaseUrl = API_BASE_URL.replace(/\/+$/, '');

// Exportar funciones de utilidad
export { getToken, clearSession, redirectToLogin };
