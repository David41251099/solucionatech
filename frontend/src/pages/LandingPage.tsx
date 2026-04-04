import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { FileText, CheckSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function LandingPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const handleCreateTicket = () => {
    if (isLoading) return;

    if (!user) {
      navigate("/login?next=%2Fclient%2Fcreate-ticket");
      return;
    }

    if (user.role === "client") {
      navigate("/client/create-ticket");
      return;
    }

    navigate("/technician/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showAuth />

      <main>
        <section className="px-4 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold text-foreground">
              Soporte técnico simple y rápido
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Primero intenta resolver con auto-diagnóstico y, si no funciona, escala a soporte.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link to="/guides">Ver guías de auto-diagnóstico</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleCreateTicket}
                className="border-secondary text-secondary hover:bg-secondary/10"
                disabled={isLoading}
              >
                {isLoading ? "Cargando..." : "Escalar a soporte"}
              </Button>
            </div>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-2 transition-colors hover:border-primary/20">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                    <FileText className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="mb-3 text-2xl font-semibold">Auto-diagnóstico</h3>
                  <p className="text-muted-foreground">
                    Encuentra guías prácticas por categoría para resolver fallas comunes.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 transition-colors hover:border-primary/20">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <CheckSquare className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="mb-3 text-2xl font-semibold">Escalamiento guiado</h3>
                  <p className="text-muted-foreground">
                    Si la guía no funciona, crea ticket y continúa por chat en tiempo real.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-accent px-4 py-16">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-4 text-3xl font-bold">¿Listo para comenzar?</h2>
            <p className="mb-6 text-muted-foreground">
              Usa las guías para auto-solución o ingresa para gestionar tickets de soporte.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" asChild>
                <Link to="/guides">Ver guías</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Registrarse gratis</Link>
              </Button>
              <Button variant="ghost" asChild className="border border-primary/30 text-primary">
                <Link to="/backend-docs">Documentación Backend</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto max-w-7xl text-center text-muted-foreground">
          <p>&copy; 2026 SolucionaTech. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
