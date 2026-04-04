import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TicketListSidebar } from '../TicketListSidebar';

const onSelect = vi.fn();

describe('TicketListSidebar states', () => {
  it('shows loading state', () => {
    render(
      <TicketListSidebar
        items={[]}
        isLoading
        error={null}
        selectedTicketId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText(/Cargando conversaciones/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(
      <TicketListSidebar
        items={[]}
        isLoading={false}
        error="No se pudieron cargar los chats activos."
        selectedTicketId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText(/No se pudieron cargar los chats activos/i)).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(
      <TicketListSidebar
        items={[]}
        isLoading={false}
        error={null}
        selectedTicketId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText(/No hay tickets activos para mostrar/i)).toBeInTheDocument();
  });
});
