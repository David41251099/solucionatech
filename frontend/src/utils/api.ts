/**
 * utils/api.ts
 * Cliente HTTP reutilizable con manejo automatico de autenticacion y errores
 */
const RAW_API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_ORIGIN = RAW_API_URL.endsWith("/api") ? RAW_API_URL.slice(0, -4) : RAW_API_URL;
const API_BASE_URL = RAW_API_URL.endsWith("/api") ? RAW_API_URL : `${RAW_API_URL}/api`;
const TOKEN_KEY = "solucionatech_token";
const LEGACY_TOKEN_KEY = "token";
const USER_KEY = "solucionatech_user";

/**
 * Interfaz para opciones de configuracion de peticiones
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
        this.name = "ApiError";
    }
}

/**
 * Obtiene el token de autenticacion del localStorage
 */
const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
};

/**
 * Limpia la sesion del usuario del localStorage
 */
const clearSession = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

/**
 * Cliente HTTP principal
 * Realiza peticiones HTTP con configuracion automatica de headers y manejo de errores
 */
class HttpClient {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    /**
     * Metodo principal para realizar peticiones HTTP
     */
    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { requiresAuth = true, ...fetchOptions } = options;
        const url = `${this.baseURL}${endpoint}`;

        const incomingHeaders = (fetchOptions.headers as Record<string, string>) || {};
        const hasContentType = Object.keys(incomingHeaders).some(
            (key) => key.toLowerCase() === "content-type"
        );
        const headers: Record<string, string> = {
            ...(hasContentType ? {} : { "Content-Type": "application/json" }),
            ...incomingHeaders,
        };

        if (requiresAuth) {
            const token = getToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
        }

        const config: RequestInit = {
            ...fetchOptions,
            headers,
        };

        try {
            const response = await fetch(url, config);

            if (response.status === 204) {
                return {} as T;
            }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 401) {
                    clearSession();
                    throw new ApiError(401, "Sesion expirada. Por favor, inicia sesion nuevamente.");
                }

                const errorMessage =
                    (data as Record<string, unknown>).message ||
                    (data as Record<string, unknown>).error ||
                    "Error en la peticion";

                throw new ApiError(response.status, String(errorMessage), {
                    ...(data as Record<string, unknown>),
                    status: response.status,
                    message: String(errorMessage),
                });
            }

            return data as T;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            if (error instanceof TypeError) {
                throw new ApiError(0, "Error de red. Verifica tu conexion a internet.");
            }

            throw new ApiError(500, "Error inesperado. Intenta nuevamente.");
        }
    }

    async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: "GET",
        });
    }

    async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: "POST",
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: "PUT",
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: "PATCH",
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: "DELETE",
        });
    }
}

export const apiClient = new HttpClient(API_BASE_URL);
export const publicApiUrl = API_ORIGIN.replace(/\/+$/, "");
export const publicApiBaseUrl = API_BASE_URL.replace(/\/+$/, "");

export { getToken, clearSession };
