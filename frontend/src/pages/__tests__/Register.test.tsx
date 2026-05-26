import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Register } from "../Register";
import { useAuth } from "../../hooks/useAuth";

const navigateMock = vi.fn();
const registerMock = vi.fn();

vi.mock("../../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../hooks/useSocketStatus", () => ({
  useSocketStatus: () => true,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("Register page", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    registerMock.mockReset();
    registerMock.mockResolvedValue(undefined);
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as typeof ResizeObserver;

    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      register: registerMock,
      logout: vi.fn(),
      restoreSession: vi.fn(),
      fetchCurrentUser: vi.fn(),
    });
  });

  it("renders the fixed allowed cities in the selector", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const citySelect = screen.getByLabelText(/ciudad/i);
    expect(citySelect).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Piedecuesta" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Bucaramanga" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Floridablanca" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /gir/i })).toBeInTheDocument();
  });

  it("submits the selected city with the register payload", async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: "Juan Perez" },
    });
    fireEvent.change(screen.getByLabelText(/correo electronico/i), {
      target: { value: "juan@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/^contrasena$/i), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contrasena/i), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText(/telefono celular/i), {
      target: { value: "3001234567" },
    });
    fireEvent.change(screen.getByLabelText(/ciudad/i), {
      target: { value: "Bucaramanga" },
    });

    fireEvent.click(screen.getByRole("button", { name: /registrarse/i }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: "Juan Perez",
        email: "juan@test.com",
        password: "123456",
        role: "client",
        phone: "3001234567",
        city: "Bucaramanga",
        address: null,
      });
    });
  });
});
