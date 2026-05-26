import type { AllowedCity } from "../constants/cities";

/**
 * types/index.ts
 * Tipos TypeScript para la aplicación SolucionaTech
 */

// ============================================
// TIPOS DE USUARIO Y AUTENTICACIÓN
// ============================================

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'client' | 'technician';
    city: AllowedCity;
    phone?: string | null;
    address?: string | null;
    created_at?: string;
    createdAt?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    role: 'client' | 'technician';
    city: AllowedCity;
    phone?: string | null;
    address?: string | null;
}

export interface TicketContactInfo {
    clientPhone?: string | null;
    technicianPhone?: string | null;
    technicianAddress?: string | null;
}

export interface LoginResponse {
    user: User;
    token: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

// ============================================
// TIPOS DE TICKETS
// ============================================

export type TicketStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
export type TicketCategory = 'general' | 'hardware' | 'software' | 'network';

export interface Ticket {
    id: string;
    title: string;
    description: string;
    status: TicketStatus;
    city: AllowedCity;
    category?: TicketCategory | string | null;
    client_id: string;
    technician_id: string | null;
    created_at: string;
    updated_at: string;
    // Datos relacionados del JOIN
    client_name?: string;
    client_email?: string;
    technician_name?: string | null;
    technician_email?: string | null;
    file_url?: string | null;
    fileUrl?: string | null;
    attachment_url?: string | null;
    attachmentUrl?: string | null;
    file_urls?: string[] | null;
    attachments?: string[] | null;
    contactInfo?: TicketContactInfo;
}

export interface CreateTicketDTO {
    title: string;
    description: string;
    category?: TicketCategory | string | null;
    file_url?: string | null;
    attachment_url?: string | null;
}

export interface UpdateTicketDTO {
    description?: string;
    technician_id?: string | null;
}

export interface UpdateTicketStatusDTO {
    status: TicketStatus;
}

export interface AssignTechnicianDTO {
    technicianId?: string;
}

export interface TicketMessage {
    id: string;
    ticket_id: string;
    sender_id: string | null;
    message: string;
    is_system: boolean;
    created_at: string;
    sender_name?: string | null;
    sender_role?: User['role'] | null;
    file_url?: string | null;
    fileUrl?: string | null;
    type?: 'text' | 'image' | 'video' | 'file';
    ticketId?: string;
    senderId?: string | null;
    content?: string | null;
    createdAt?: string;
}

// ============================================
// TIPOS DE RESPUESTAS DE LA API
// ============================================

export interface TicketsResponse {
    tickets: Ticket[];
}

export interface TicketResponse {
    ticket: Ticket;
}

export interface MessageResponse {
    message: string;
}

export interface TicketMessagesResponse {
    messages: TicketMessage[];
}

export interface TicketMessageResponse {
    message: TicketMessage;
}

export interface ErrorResponse {
    error: string;
}

export interface ApiEnvelope<T> {
    success: boolean;
    data: T;
    message?: string;
}

// ============================================
// TIPOS DE CONFIGURACIÓN
// ============================================

export interface ApiConfig {
    baseURL: string;
    timeout?: number;
}

// ============================================
// TIPOS DE GUIAS (AUTO-DIAGNOSTICO)
// ============================================

export type GuideCategory = 'hardware' | 'software' | 'red';

export interface Guide {
    id: string;
    title: string;
    category: GuideCategory;
    problem: string;
    steps: string[];
    image: string;
    tags: string[];
}
