import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TicketChat } from '../TicketChat';
import { useAuth } from '../../../hooks/useAuth';
import { useChat } from '../../../context/ChatContext';

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../context/ChatContext', () => ({
  useChat: vi.fn(),
}));

const baseUser = {
  id: 'client-1',
  name: 'Client One',
  email: 'client@test.com',
  role: 'client',
};

const buildTicket = (status: 'assigned' | 'resolved' | 'cancelled') => ({
  id: 'ticket-1',
  title: 'Ticket de prueba',
  description: 'Descripcion',
  status,
  category: 'software',
  client_id: 'client-1',
  technician_id: status === 'assigned' || status === 'resolved' ? 'tech-1' : null,
  created_at: '2026-04-04T00:00:00.000Z',
  updated_at: '2026-04-04T00:00:00.000Z',
});

const setBaseAuth = () => {
  vi.mocked(useAuth).mockReturnValue({
    user: baseUser,
    token: 'token',
    isLoading: false,
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    restoreSession: vi.fn(),
    fetchCurrentUser: vi.fn(),
  });
};

const setChatState = (status: 'assigned' | 'resolved' | 'cancelled') => {
  vi.mocked(useChat).mockReturnValue({
    isOpen: true,
    selectedTicketId: 'ticket-1',
    tickets: [buildTicket(status)],
    messages: {
      'ticket-1': [
        {
          id: 'msg-1',
          ticket_id: 'ticket-1',
          sender_id: 'client-1',
          message: 'Historial visible',
          is_system: false,
          created_at: '2026-04-04T00:01:00.000Z',
        },
      ],
    },
    isLoadingTickets: false,
    isLoadingMessages: false,
    isSending: false,
    error: null,
    setIsOpen: vi.fn(),
    toggleOpen: vi.fn(),
    selectTicket: vi.fn(),
    refreshTickets: vi.fn(),
    refreshMessages: vi.fn(),
    sendMessage: vi.fn(),
  });
};

describe('TicketChat closed conversation UX', () => {
  it('hides input and shows closed message when ticket is resolved', () => {
    setBaseAuth();
    setChatState('resolved');

    render(<TicketChat mode="page" defaultTicketId="ticket-1" />);

    expect(screen.getByText(/Historial visible/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Este ticket ha sido finalizado\. La conversación está cerrada\./i)
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Escribe un mensaje/i)).not.toBeInTheDocument();
  });

  it('shows input when ticket is still active', () => {
    setBaseAuth();
    setChatState('assigned');

    render(<TicketChat mode="page" defaultTicketId="ticket-1" />);

    expect(screen.getByPlaceholderText(/Escribe un mensaje/i)).toBeInTheDocument();
  });
});
