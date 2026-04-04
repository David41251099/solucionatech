/**
 * services/ticket.service.ts
 * Servicio de gestión de tickets conectado al backend real
 */

import { apiClient, ApiError, getToken, publicApiBaseUrl } from '../utils/api';
import { devError } from '../utils/devLog';
import type {
    Ticket,
    CreateTicketDTO,
    UpdateTicketDTO,
    UpdateTicketStatusDTO,
    AssignTechnicianDTO,
    TicketsResponse,
    TicketResponse,
    MessageResponse,
    TicketMessage,
    TicketMessagesResponse,
    TicketMessageResponse,
    ApiEnvelope,
} from '../types';

const unwrapData = <T>(response: unknown): T => {
    if (response && typeof response === 'object' && 'data' in response) {
        return (response as { data: T }).data;
    }
    return response as T;
};

const unwrapField = <T>(response: unknown, key: string): T => {
    const payload = unwrapData<Record<string, unknown>>(response);
    if (payload && typeof payload === 'object' && key in payload) {
        return payload[key] as T;
    }

    if (response && typeof response === 'object' && key in response) {
        return (response as Record<string, unknown>)[key] as T;
    }

    throw new Error(`Respuesta invalida: falta campo ${key}`);
};

// ============================================
// FUNCIONES CRUD DE TICKETS
// ============================================

/**
 * Crear nuevo ticket
 * Solo disponible para usuarios con rol 'client'
 * @param data - Datos del ticket (title, description, category)
 * @returns Ticket creado
 */
export const createTicket = async (data: CreateTicketDTO): Promise<Ticket> => {
    try {
        const response = await apiClient.post<TicketResponse & MessageResponse>(
            '/tickets',
            data
        );

        return unwrapField<Ticket>(response, 'ticket');
    } catch (error) {
        devError('Error al crear ticket:', error);
        throw error;
    }
};

/**
 * Obtener lista de tickets
 * - Cliente: retorna solo sus tickets
 * - Tecnico: retorna todos los tickets
 * @returns Array de tickets
 */
export const getTickets = async (): Promise<Ticket[]> => {
    try {
        const response = await apiClient.get<TicketsResponse>('/tickets');

        return unwrapField<Ticket[]>(response, 'tickets');
    } catch (error) {
        devError('Error al obtener tickets:', error);
        throw error;
    }
};

const buildTicketQuery = (
    params: { statuses?: Ticket['status'][]; limit?: number; offset?: number } = {}
): string => {
    const query = new URLSearchParams();

    if (params.statuses && params.statuses.length > 0) {
        query.set('status', params.statuses.join(','));
    }

    if (params.limit !== undefined) {
        query.set('limit', String(params.limit));
    }

    if (params.offset !== undefined) {
        query.set('offset', String(params.offset));
    }

    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
};

/**
 * Obtener lista de tickets por estado
 * @param statuses - Estados a filtrar
 * @param limit - Limite de resultados
 * @param offset - Offset de resultados
 * @returns Array de tickets filtrados
 */
export const getTicketsByStatus = async (
    statuses: Ticket['status'][],
    limit?: number,
    offset?: number
): Promise<Ticket[]> => {
    try {
        const query = buildTicketQuery({ statuses, limit, offset });
        const response = await apiClient.get<TicketsResponse>(`/tickets${query}`);

        return unwrapField<Ticket[]>(response, 'tickets');
    } catch (error) {
        devError('Error al obtener tickets por estado:', error);
        throw error;
    }
};

/**
 * Obtener lista de tickets disponibles (pending)
 * Solo disponible para tecnicos
 * @returns Array de tickets disponibles
 */
export const getAvailableTickets = async (
    limit?: number,
    offset?: number
): Promise<Ticket[]> => {
    try {
        const response = await apiClient.get<TicketsResponse>(
            `/tickets${buildTicketQuery({ statuses: ['pending'], limit, offset })}`
        );

        return unwrapField<Ticket[]>(response, 'tickets');
    } catch (error) {
        devError('Error al obtener tickets disponibles:', error);
        throw error;
    }
};

/**
 * Obtener lista de tickets asignados al tecnico autenticado
 * Solo disponible para tecnicos
 * @param limit - Limite de resultados
 * @param offset - Offset de resultados
 * @returns Array de tickets asignados/en progreso
 */
export const getMyTickets = async (
    limit?: number,
    offset?: number,
    statuses?: Ticket['status'][]
): Promise<Ticket[]> => {
    try {
        const query = buildTicketQuery({ statuses, limit, offset });
        const response = await apiClient.get<TicketsResponse>(`/tickets/my-tickets${query}`);

        return unwrapField<Ticket[]>(response, 'tickets');
    } catch (error) {
        devError('Error al obtener mis tickets:', error);
        throw error;
    }
};

/**
 * Obtener ticket por ID
 * - Cliente: solo puede ver sus propios tickets
 * - Tecnico: puede ver cualquier ticket
 * @param id - ID del ticket
 * @returns Datos del ticket
 */
export const getTicketById = async (id: string): Promise<Ticket> => {
    try {
        const response = await apiClient.get<TicketResponse>(`/tickets/${id}`);

        return unwrapField<Ticket>(response, 'ticket');
    } catch (error) {
        devError('Error al obtener ticket:', error);
        throw error;
    }
};

/**
 * Actualizar ticket
 * Solo disponible para tecnicos
 * @param id - ID del ticket
 * @param data - Datos a actualizar (description, technician_id)
 * @returns Ticket actualizado
 */
export const updateTicket = async (
    id: string,
    data: UpdateTicketDTO
): Promise<Ticket> => {
    try {
        const response = await apiClient.put<TicketResponse & MessageResponse>(
            `/tickets/${id}`,
            data
        );

        return unwrapField<Ticket>(response, 'ticket');
    } catch (error) {
        devError('Error al actualizar ticket:', error);
        throw error;
    }
};

/**
 * Asignar tecnico a un ticket
 * Solo disponible para tecnicos
 * @param id - ID del ticket
 * @param technicianId - ID del tecnico (opcional, si no se env?a se auto-asigna)
 * @returns Ticket actualizado
 */
export const assignTechnician = async (
    id: string,
    technicianId?: string
): Promise<Ticket> => {
    try {
        const body: AssignTechnicianDTO = technicianId ? { technicianId } : {};

        const response = await apiClient.patch<TicketResponse & MessageResponse>(
            `/tickets/${id}/assign`,
            body
        );

        return unwrapField<Ticket>(response, 'ticket');
    } catch (error) {
        devError('Error al asignar tecnico:', error);
        throw error;
    }
};

/**
 * Tomar ticket (auto-asignacion al tecnico autenticado)
 * Solo disponible para tecnicos
 * @param id - ID del ticket
 * @returns Ticket actualizado
 */
export const assignTicket = async (id: string): Promise<Ticket> => {
    return assignTechnician(id);
};

/**
 * Tomar ticket (técnico): pending -> assigned
 * @param id - ID del ticket
 * @returns Ticket actualizado
 */
export const acceptTicket = async (id: string): Promise<Ticket> => {
    return assignTicket(id);
};

/**
 * Iniciar trabajo (técnico): assigned -> in_progress
 * @param id - ID del ticket
 * @returns Ticket actualizado
 */
export const startTicketWork = async (id: string): Promise<Ticket> => {
    try {
        const response = await apiClient.patch<TicketResponse & MessageResponse>(
            `/tickets/${id}/status`,
            { status: 'in_progress' }
        );

        return unwrapField<Ticket>(response, 'ticket');
    } catch (error) {
        devError('Error al iniciar trabajo del ticket:', error);
        throw error;
    }
};

/**
 * Actualizar estado de un ticket
 * Solo disponible para tecnicos
 * @param id - ID del ticket
 * @param status - Nuevo estado (pending, assigned, in_progress, resolved)
 * @returns Ticket actualizado
 */
export const updateTicketStatus = async (
    id: string,
    status: UpdateTicketStatusDTO['status']
): Promise<Ticket> => {
    try {
        const body: UpdateTicketStatusDTO = { status };

        const response = await apiClient.patch<TicketResponse & MessageResponse>(
            `/tickets/${id}/status`,
            body
        );

        return unwrapField<Ticket>(response, 'ticket');
    } catch (error) {
        devError('Error al actualizar estado:', error);
        throw error;
    }
};

/**
 * Obtener historial de mensajes de un ticket
 * @param id - ID del ticket
 * @returns Array de mensajes
 */
export const getTicketMessages = async (id: string): Promise<TicketMessage[]> => {
    try {
        const response = await apiClient.get<TicketMessagesResponse>(`/tickets/${id}/messages`);

        return unwrapField<TicketMessage[]>(response, 'messages');
    } catch (error) {
        devError('Error al obtener mensajes:', error);
        throw error;
    }
};

/**
 * Enviar mensaje en un ticket
 * @param id - ID del ticket
 * @param message - Texto del mensaje
 * @returns Mensaje creado
 */
export const sendTicketMessage = async (
    id: string,
    message?: string,
    file_url?: string
): Promise<TicketMessage> => {
    try {
        const response = await apiClient.post<TicketMessageResponse>(
            `/tickets/${id}/messages`,
            { message, file_url: file_url }
        );

        return unwrapField<TicketMessage>(response, 'message');
    } catch (error) {
        devError('Error al enviar mensaje:', error);
        throw error;
    }
};

export const createTicketWithAttachments = async (formData: FormData): Promise<Ticket> => {
    try {
        const token = getToken();
        const response = await fetch(`${publicApiBaseUrl}/tickets`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: formData,
        });

        const payload = await response.json().catch(() => ({} as Record<string, unknown>));

        if (!response.ok) {
            const errorMessage =
                (payload?.error as string) ||
                (payload?.message as string) ||
                'No se pudo crear el ticket.';
            throw new ApiError(response.status, errorMessage, payload);
        }

        return unwrapField<Ticket>(payload, 'ticket');
    } catch (error) {
        devError('Error al crear ticket con adjuntos:', error);
        throw error;
    }
};

export const sendMessageWithAttachment = async (
    id: string,
    formData: FormData
): Promise<TicketMessage> => {
    try {
        const token = getToken();
        const multipartData = new FormData();

        const message = formData.get('message');
        if (typeof message === 'string' && message.trim()) {
            multipartData.append('message', message.trim());
        }

        const primaryFile = formData.get('file');
        const fallbackFile = formData.get('files');
        const resolvedFile =
            primaryFile instanceof File
                ? primaryFile
                : fallbackFile instanceof File
                  ? fallbackFile
                  : null;

        if (resolvedFile) {
            multipartData.append('file', resolvedFile);
        }

        const response = await fetch(`${publicApiBaseUrl}/tickets/${id}/messages`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: multipartData,
        });
        const data = (await response.json().catch(() => ({} as Record<string, unknown>))) as
            | (ApiEnvelope<{ message: TicketMessage }> & { ticketMessage?: TicketMessage })
            | TicketMessageResponse
            | Record<string, unknown>;

        if (!response.ok) {
            const errorMessage =
                (data as Record<string, unknown>)?.error as string ||
                (data as Record<string, unknown>)?.message as string ||
                'No se pudo enviar el mensaje con adjunto.';
            throw new ApiError(response.status, errorMessage, data);
        }

        const createdMessage =
            (data as ApiEnvelope<{ message: TicketMessage }>).data?.message ||
            (data as TicketMessageResponse).message ||
            (data as { ticketMessage?: TicketMessage }).ticketMessage;

        if (!createdMessage) {
            throw new ApiError(response.status, 'Respuesta invalida del servidor al enviar adjunto.');
        }

        return createdMessage;
    } catch (error) {
        devError('Error al enviar mensaje con adjunto:', error);
        throw error;
    }
};

/**
 * Cancelar ticket (cliente)
 * @param id - ID del ticket
 * @returns Ticket actualizado
 */
export const cancelTicket = async (id: string): Promise<Ticket> => {
    try {
        const response = await apiClient.patch<TicketResponse & MessageResponse>(
            `/tickets/${id}/cancel`
        );

        return unwrapField<Ticket>(response, 'ticket');
    } catch (error) {
        devError('Error al cancelar ticket:', error);
        throw error;
    }
};

/**
 * Liberar ticket (técnico asignado)
 * @param id - ID del ticket
 * @returns Ticket actualizado
 */
export const releaseTicket = async (id: string): Promise<Ticket> => {
    try {
        const response = await apiClient.patch<TicketResponse & MessageResponse>(
            `/tickets/${id}/release`
        );

        return unwrapField<Ticket>(response, 'ticket');
    } catch (error) {
        devError('Error al liberar ticket:', error);
        throw error;
    }
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Filtrar tickets por estado
 * @param tickets - Array de tickets
 * @param status - Estado a filtrar
 * @returns Tickets filtrados
 */
export const filterTicketsByStatus = (
    tickets: Ticket[],
    status: Ticket['status']
): Ticket[] => {
    return tickets.filter((ticket) => ticket.status === status);
};

/**
 * Obtener tickets asignados a un técnico especa?fico
 * @param tickets - Array de tickets
 * @param technicianId - ID del tecnico
 * @returns Tickets asignados al técnico
 */
export const getTicketsByTechnician = (
    tickets: Ticket[],
    technicianId: string
): Ticket[] => {
    return tickets.filter((ticket) => ticket.technician_id === technicianId);
};

/**
 * Obtener tickets sin asignar
 * @param tickets - Array de tickets
 * @returns Tickets sin tecnico asignado
 */
export const getUnassignedTickets = (tickets: Ticket[]): Ticket[] => {
    return tickets.filter((ticket) => !ticket.technician_id);
};

/**
 * Contar tickets por estado
 * @param tickets - Array de tickets
 * @returns Objeto con conteo por estado
 */
export const countTicketsByStatus = (
    tickets: Ticket[]
): Record<Ticket['status'], number> => {
    return tickets.reduce(
        (acc, ticket) => {
            acc[ticket.status] = (acc[ticket.status] || 0) + 1;
            return acc;
        },
        {} as Record<Ticket['status'], number>
    );
};

/**
 * Obtener badge de color seg?n el estado del ticket
 * @param status - Estado del ticket
 * @returns Color para el badge
 */
export const getStatusColor = (
    status: Ticket['status']
): string => {
    const colors: Record<Ticket['status'], string> = {
        pending: 'gray',
        assigned: 'blue',
        in_progress: 'orange',
        resolved: 'green',
        cancelled: 'red',
    };

    return colors[status] || 'gray';
};

/**
 * Formatear fecha a formato legible
 * @param dateString - Fecha en formato ISO
 * @returns Fecha formateada
 */
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

/**
 * Obtener tiempo transcurrido desde la creación del ticket
 * @param createdAt - Fecha de creación
 * @returns Texto con tiempo transcurrido
 */
export const getTimeAgo = (createdAt: string): string => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
        return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
        return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    } else {
        return `Hace ${diffDays} d?a${diffDays !== 1 ? 's' : ''}`;
    }
};


