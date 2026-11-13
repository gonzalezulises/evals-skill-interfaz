/**
 * Configuración de la cuenta. Shell con navegación lateral de secciones adaptado de 21st.dev
 * #28366 (felipemenezes098/settings-2); tarjetas de perfil y notificaciones de #28426
 * (olewandowski1/settings-1); zona de cierre de #25081 (cnippet-dev/v-form-12).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2, ShieldAlert, User, Users } from "lucide-react";
import { PerfilSection, NotificacionesSection } from "@/components/perfil";
import { EquipoSection } from "@/components/equipo";
import { CierreSection } from "@/components/cierre";
import { cn } from "@/lib/utils";

const NAV = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "notificaciones", label: "Notificaciones", icon: Bell },
  { id: "equipo", label: "Equipo", icon: Users },
  { id: "cierre", label: "Cerrar cuenta", icon: ShieldAlert },
];

function useSeccionActiva() {
  const [activa, setActiva] = useState(NAV[0].id);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entradas) => {
        const visibles = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visibles[0]) setActiva(visibles[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    NAV.forEach((n) => { const el = document.getElementById(n.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);
  return activa;
}

export default function App() {
  const activa = useSeccionActiva();
  const [aviso, setAviso] = useState<{ id: number; texto: string }>();
  const timer = useRef<number>(undefined);
  const avisar = useCallback((texto: string) => {
    setAviso({ id: Date.now(), texto });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAviso(undefined), 4000);
  }, []);

  return (
    <div className="min-h-svh">
      <a href="#contenido" className="fixed left-4 -top-24 z-50 inline-flex min-h-11 items-center rounded-md bg-card px-4 shadow focus:top-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Saltar al contenido
      </a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground" aria-hidden>AL</span>
          <span className="font-semibold">Andes Logística</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
        <div className="mb-4 lg:mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Configuración de la cuenta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tu perfil, tus avisos y quién tiene acceso a la cuenta.</p>
        </div>

        <div className="lg:grid lg:grid-cols-[13rem_1fr] lg:gap-10">
          {/* Navegación: barra horizontal fija arriba en móvil/tableta, lateral fija en escritorio */}
          <nav aria-label="Secciones de configuración" className="sticky top-0 z-10 -mx-4 mb-6 border-b border-border bg-background/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:top-6 lg:mx-0 lg:mb-0 lg:self-start lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
            <ul className="flex gap-1 overflow-x-auto py-2 lg:flex-col lg:overflow-visible lg:py-0">
              {NAV.map(({ id, label, icon: Icon }) => (
                <li key={id} className="shrink-0">
                  <a
                    href={`#${id}`}
                    aria-current={activa === id ? "true" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-2 whitespace-nowrap rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:min-h-10",
                      activa === id ? "bg-card font-medium text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      id === "cierre" && activa !== id && "text-destructive/80",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <main id="contenido" className="min-w-0 space-y-6">
            <PerfilSection avisar={avisar} />
            <NotificacionesSection avisar={avisar} />
            <EquipoSection avisar={avisar} />
            <CierreSection avisar={avisar} />
          </main>
        </div>
      </div>

      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-6">
        {aviso && (
          <p key={aviso.id} className="pointer-events-auto flex max-w-md items-start gap-2 rounded-md bg-foreground px-4 py-3 text-sm text-white shadow-lg">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-400" aria-hidden />
            {aviso.texto}
          </p>
        )}
      </div>
    </div>
  );
}
