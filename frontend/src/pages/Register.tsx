import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { devError } from "../utils/devLog";

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    role: "client" as "client" | "technician",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contrasenas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("La contrasena debe tener al menos 6 caracteres");
      return;
    }

    const normalizedPhone = formData.phone.trim();
    if (normalizedPhone && (normalizedPhone.length < 7 || normalizedPhone.length > 20)) {
      toast.error("El telefono debe tener entre 7 y 20 caracteres");
      return;
    }

    if (formData.role === "technician" && !formData.address.trim()) {
      toast.error("La direccion es obligatoria para tecnicos");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: normalizedPhone || null,
        address: formData.role === "technician" ? formData.address.trim() : null,
      });

      toast.success("Registro exitoso");

      const redirectPath =
        formData.role === "client" ? "/client/dashboard" : "/technician/dashboard";
      navigate(redirectPath);
    } catch (error) {
      toast.error("Error al registrarse. Intenta con otro correo.");
      devError("Error en registro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showAuth />

      <main className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl">Crear cuenta</CardTitle>
            <CardDescription className="text-center">
              Completa el formulario para registrarte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Juan Perez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="border border-border bg-input-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electronico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="border border-border bg-input-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contrasena</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="border border-border bg-input-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="********"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="border border-border bg-input-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefono celular</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="3001234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="border border-border bg-input-background"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de cuenta</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value as "client" | "technician" })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="client" id="client" />
                    <Label htmlFor="client" className="cursor-pointer font-normal">
                      Cliente (solicitar soporte)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="technician" id="technician" />
                    <Label htmlFor="technician" className="cursor-pointer font-normal">
                      Tecnico (proporcionar soporte)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.role === "technician" && (
                <div className="space-y-2">
                  <Label htmlFor="address">Direccion del punto fisico</Label>
                  <Textarea
                    id="address"
                    placeholder="Calle 123 #45-67, Bogota"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    className="min-h-[96px] border border-border bg-input-background"
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Registrando..." : "Registrarse"}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Ya tienes una cuenta? </span>
                <Link to="/login" className="text-primary hover:underline">
                  Inicia sesion
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
