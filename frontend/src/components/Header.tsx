import { Link, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { LogOut, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useSocketStatus } from "../hooks/useSocketStatus";
import { toast } from "sonner";

interface HeaderProps {
  showAuth?: boolean;
  showLogout?: boolean;
}

export function Header({ showAuth = false, showLogout = false }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const homePath =
    user?.role === "client"
      ? "/client/dashboard"
      : user?.role === "technician"
        ? "/technician/dashboard"
        : "/";

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada correctamente");
    navigate("/");
  };

  const socketOnline = useSocketStatus();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to={homePath}>
            <Logo />
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${socketOnline ? "bg-emerald-500" : "bg-red-500"
                  }`}
              />
              <span className="text-xs text-slate-500">
                {socketOnline ? "Conectado" : "Desconectado"}
              </span>
            </div>

            {showAuth && !user && (
              <>
                <Button variant="outline" asChild>
                  <Link to="/login">Iniciar sesión</Link>
                </Button>
                <Button className="bg-blue-600 text-white hover:bg-blue-700" asChild>
                  <Link to="/register">Registrarse</Link>
                </Button>
              </>
            )}

            {(showLogout || user) && user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700">
                    {user.role === "client" ? "Cliente" : "Técnico"}
                  </span>
                </div>
                <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
