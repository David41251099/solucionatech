import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconBook2, IconSearch, IconTool } from "@tabler/icons-react";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { EmptyState } from "../components/ui/EmptyState";
import { guides, guideCategories } from "../data/guides";
import { useAuth } from "../hooks/useAuth";
import type { Guide, GuideCategory } from "../types";

const getEscalationTarget = (guideId: string, userRole?: "client" | "technician"): string => {
  if (!userRole) {
    return `/login?next=${encodeURIComponent("/client/create-ticket")}&guide=${encodeURIComponent(guideId)}`;
  }

  if (userRole === "client") {
    return "/client/create-ticket";
  }

  return "/technician/dashboard";
};

export function Guides() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<"all" | GuideCategory>("all");
  const [search, setSearch] = useState("");
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(guides[0]?.id ?? null);

  const filteredGuides = useMemo(() => {
    const query = search.trim().toLowerCase();

    return guides.filter((guide) => {
      const categoryMatch = selectedCategory === "all" ? true : guide.category === selectedCategory;

      const textMatch =
        !query ||
        guide.title.toLowerCase().includes(query) ||
        guide.problem.toLowerCase().includes(query) ||
        guide.tags.some((tag) => tag.toLowerCase().includes(query));

      return categoryMatch && textMatch;
    });
  }, [selectedCategory, search]);

  const selectedGuide: Guide | null = useMemo(() => {
    if (!filteredGuides.length) return null;
    const match = filteredGuides.find((guide) => guide.id === selectedGuideId);
    return match ?? filteredGuides[0];
  }, [filteredGuides, selectedGuideId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showAuth />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Auto-diagnóstico SolucionaTech</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Guías técnicas para resolver problemas comunes</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-500">
            Flujo oficial: auto-diagnóstico con guías en lenguaje claro, y si no funciona, escalamiento a ticket para atención con técnico por chat.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/">Volver al inicio</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={user?.role === "client" ? "/client/create-ticket" : "/login?next=%2Fclient%2Fcreate-ticket"}>
                Ir directo a soporte
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <Card className="rounded-xl border border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Filtrar guías</CardTitle>
                <CardDescription className="text-sm text-slate-500">Busca por problema, palabra clave o categoría.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Ej: wifi, pantalla, impresora..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pl-9 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {guideCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`rounded-lg border px-3 py-1 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 ${
                        selectedCategory === category.id
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-slate-300 text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Resultados ({filteredGuides.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredGuides.length === 0 ? (
                  <EmptyState icon={<IconBook2 className="h-5 w-5" />} title="No se encontraron guías" description="Prueba con otra categoría o palabra clave." />
                ) : (
                  <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
                    {filteredGuides.map((guide) => (
                      <button
                        key={guide.id}
                        type="button"
                        onClick={() => setSelectedGuideId(guide.id)}
                        className={`w-full rounded-lg border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 ${
                          selectedGuide?.id === guide.id
                            ? "border-blue-400 bg-blue-50"
                            : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300"
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-900">{guide.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{guide.problem}</p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>

          <section>
            {selectedGuide ? (
              <Card className="rounded-xl border border-slate-200 bg-white">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-900">{selectedGuide.title}</CardTitle>
                      <CardDescription className="mt-2 text-sm text-slate-500">{selectedGuide.problem}</CardDescription>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700" variant="secondary">{selectedGuide.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedGuide.image && (
                    <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                      <div className="mb-2 flex items-center gap-2">
                        <IconTool className="h-4 w-4" />
                        <span>Referencia visual</span>
                      </div>
                      <img
                        src={selectedGuide.image}
                        alt={selectedGuide.title}
                        className="mt-2 max-h-60 w-full cursor-pointer rounded-lg border border-slate-200 object-contain transition-all duration-200 hover:scale-[1.01] hover:opacity-90"
                      />
                    </div>
                  )}

                  <h3 className="mb-3 text-base font-semibold text-slate-900">Pasos sugeridos</h3>
                  <ol className="space-y-3">
                    {selectedGuide.steps.map((step, index) => (
                      <li key={`${selectedGuide.id}-${index}`} className="flex gap-3 rounded-md border border-slate-200 p-3">
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">{index + 1}</span>
                        <span className="text-sm text-slate-700">{step}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {selectedGuide.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="border-slate-300 text-slate-600">#{tag}</Badge>
                    ))}
                  </div>

                  <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm font-medium text-slate-900">La guía no resolvió tu problema?</p>
                    <p className="mt-1 text-sm text-slate-500">Escala a soporte: crea un ticket y un técnico te acompañará por chat.</p>
                    <div className="mt-4">
                      <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => navigate(getEscalationTarget(selectedGuide.id, user?.role))}>
                        No funcionó {"->"} Solicitar ayuda
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <EmptyState icon={<IconBook2 className="h-5 w-5" />} title="Selecciona una guía" description="Elige una guía de la lista para ver el detalle." />
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

export default Guides;
