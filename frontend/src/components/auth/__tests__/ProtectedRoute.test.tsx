import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '../../../hooks/useAuth';

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login when user has no token/session', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      restoreSession: vi.fn(),
      fetchCurrentUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={<ProtectedRoute><div>Zona privada</div></ProtectedRoute>}
          />
          <Route path="/login" element={<div>Pantalla login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Pantalla login/i)).toBeInTheDocument();
    expect(screen.queryByText(/Zona privada/i)).not.toBeInTheDocument();
  });

  it('allows access when token/session exists', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'tech-1',
        name: 'Tech Uno',
        email: 'tech@test.com',
        role: 'technician',
        city: 'Bucaramanga',
      },
      token: 'valid-token',
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      restoreSession: vi.fn(),
      fetchCurrentUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={<ProtectedRoute><div>Zona privada</div></ProtectedRoute>}
          />
          <Route path="/login" element={<div>Pantalla login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Zona privada/i)).toBeInTheDocument();
    expect(screen.queryByText(/Pantalla login/i)).not.toBeInTheDocument();
  });
});
