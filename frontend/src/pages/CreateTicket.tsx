import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";
import { useAuth } from "../hooks/useAuth";
import { ALLOWED_CITIES } from "../constants/cities";
import { createTicketWithAttachments } from "../services/ticket.service";

export function CreateTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
  });
  const userCity = user?.city ?? null;
  const hasAllowedCity = !!userCity && ALLOWED_CITIES.includes(userCity);

  useEffect(() => {
    if (!files.length) {
      setPreviewUrls([]);
      return;
    }

    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleClearFiles = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);
      setIsSubmitting(true);
      if (!hasAllowedCity) {
        toast.error("Tu perfil no tiene una ciudad de cobertura valida.");
        return;
      }
      if (files.length > 5) {
        toast.error("Maximo 5 imagenes");
        return;
      }
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("category", formData.category);
      files.forEach((file) => {
        payload.append("files", file);
      });

      await createTicketWithAttachments(payload);

      toast.success("Ticket creado correctamente");
      navigate("/client/dashboard");
    } catch {
      setError("No se pudo crear el ticket. Intenta nuevamente.");
      toast.error("No se pudo crear el ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showLogout />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate("/client/dashboard")} className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </Button>

        <Card className="rounded-xl border border-slate-200 bg-white shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-900">Crear Nuevo Ticket</CardTitle>
            <CardDescription className="text-sm text-slate-500">Completa el formulario para reportar tu problema técnico.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-slate-700">Título del problema</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Ej: No puedo acceder al sistema"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-semibold text-slate-700">Categoría</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="hardware">Hardware</option>
                  <option value="software">Software</option>
                  <option value="network">Red</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Ciudad del ticket</Label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {hasAllowedCity ? userCity : "No disponible"}
                </div>
                <p className="text-sm text-slate-500">
                  La ciudad se toma automaticamente desde tu perfil.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Descripción detallada</Label>
                <Textarea
                  id="description"
                  placeholder="Describe el problema con el mayor detalle posible..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={6}
                  className="resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-slate-500">Incluye pasos para reproducir el problema y mensajes de error.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Adjuntar archivo (opcional)</Label>
                {!!previewUrls.length && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {previewUrls.map((url, index) => (
                        <div key={`${url}-${index}`} className="relative">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="max-h-[120px] w-full rounded-xl border border-slate-200 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
                            aria-label={`Eliminar imagen ${index + 1}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleClearFiles}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100"
                    >
                      <X className="h-3.5 w-3.5" />
                      Limpiar adjuntos
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    id={fileInputId}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      const selectedFiles = Array.from(event.target.files || []);

                      setFiles((previous) => {
                        const existingKeys = new Set(
                          previous.map((file) => `${file.name}-${file.size}-${file.lastModified}`)
                        );
                        const incoming = selectedFiles.filter((file) => {
                          const key = `${file.name}-${file.size}-${file.lastModified}`;
                          if (existingKeys.has(key)) return false;
                          existingKeys.add(key);
                          return true;
                        });

                        const combined = [...previous, ...incoming];
                        if (combined.length > 5) {
                          toast.error("Maximo 5 imagenes");
                          return previous;
                        }

                        return combined;
                      });

                      event.currentTarget.value = "";
                    }}
                    className="sr-only"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label
                        htmlFor={fileInputId}
                        className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100"
                        aria-label="Adjuntar archivo"
                      >
                        <Paperclip className="h-5 w-5" />
                      </label>
                    </TooltipTrigger>
                    <TooltipContent side="top">Adjuntar archivo</TooltipContent>
                  </Tooltip>
                  {!!files.length && (
                    <span className="text-xs text-slate-500">
                      {files.length} archivo(s) seleccionado(s)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700" disabled={isSubmitting || !hasAllowedCity}>
                  {isSubmitting ? "Creando..." : "Crear Ticket"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/client/dashboard")} disabled={isSubmitting}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
