import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Guides } from "../Guides";
import { useAuth } from "../../hooks/useAuth";

const navigateMock = vi.fn();

vi.mock("../../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("Guides page", () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it("renders guides page and list", () => {
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
      <MemoryRouter>
        <Guides />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /resolver problemas comunes/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText("PC no enciende").length).toBeGreaterThan(0);
  });

  it("filters guides by search text", () => {
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
      <MemoryRouter>
        <Guides />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Ej: wifi, pantalla, impresora..."), {
      target: { value: "wifi" },
    });

    expect(screen.getByText("Sin conexion WiFi")).toBeInTheDocument();
    expect(screen.queryByText("PC no enciende")).not.toBeInTheDocument();
  });

  it("routes unauthenticated users to login with next param", () => {
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
      <MemoryRouter>
        <Guides />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /solicitar ayuda/i }));
    expect(navigateMock).toHaveBeenCalledWith(
      "/login?next=%2Fclient%2Fcreate-ticket&guide=guide-1"
    );
  });

  it("routes authenticated client users to create ticket", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "client-1",
        name: "Cliente",
        email: "client@test.com",
        role: "client",
      },
      token: "token",
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      restoreSession: vi.fn(),
      fetchCurrentUser: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Guides />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /solicitar ayuda/i }));
    expect(navigateMock).toHaveBeenCalledWith("/client/create-ticket");
  });
});
