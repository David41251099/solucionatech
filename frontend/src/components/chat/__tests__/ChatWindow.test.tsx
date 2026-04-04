import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatWindow } from '../ChatWindow';
import { useTicketConversation } from '../../../hooks/useTicketConversation';

vi.mock('../../../hooks/useTicketConversation', () => ({
  useTicketConversation: vi.fn(),
}));

const buildConversationState = (overrides = {}) => ({
  messages: [],
  draft: '',
  setDraft: vi.fn(),
  selectedFile: null,
  setSelectedFile: vi.fn(),
  isLoading: false,
  isSending: false,
  error: null,
  sendMessage: vi.fn(),
  ...overrides,
});

const buildTicket = (overrides = {}) => ({
  id: 'ticket-1',
  title: 'Ticket de prueba',
  description: 'Descripcion',
  status: 'assigned',
  category: 'software',
  client_id: 'client-1',
  technician_id: 'tech-1',
  created_at: '2026-04-04T00:00:00.000Z',
  updated_at: '2026-04-04T00:00:00.000Z',
  ...overrides,
});

describe('ChatWindow', () => {
  it('shows unavailable state when no ticket is selected', () => {
    vi.mocked(useTicketConversation).mockReturnValue(buildConversationState());

    render(<ChatWindow ticket={null} currentUserId="client-1" />);

    expect(screen.getByText(/Selecciona un ticket/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Escribe un mensaje/i)).not.toBeInTheDocument();
  });

  it('renders chat history for selected ticket', () => {
    vi.mocked(useTicketConversation).mockReturnValue(
      buildConversationState({
        messages: [
          {
            id: 'msg-1',
            ticket_id: 'ticket-1',
            sender_id: 'client-1',
            message: 'Hola, necesito ayuda',
            is_system: false,
            created_at: '2026-04-04T00:01:00.000Z',
          },
          {
            id: 'msg-2',
            ticket_id: 'ticket-1',
            sender_id: 'tech-1',
            message: 'Claro, revisemos',
            is_system: false,
            created_at: '2026-04-04T00:02:00.000Z',
          },
        ],
      })
    );

    render(<ChatWindow ticket={buildTicket()} currentUserId="client-1" />);

    expect(screen.getByText(/Hola, necesito ayuda/i)).toBeInTheDocument();
    expect(screen.getByText(/Claro, revisemos/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Escribe un mensaje/i)).toBeInTheDocument();
  });
});
