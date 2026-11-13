import { Bell, CircleCheck, OctagonAlert, User, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CerrarCuentaSection } from "@/components/CerrarCuenta";
import { EquipoSection } from "@/components/Equipo";
import { NotificacionesSection } from "@/components/Notificaciones";
import { PerfilSection } from "@/components/Perfil";
import { cn } from "@/lib/utils";

const SECCIONES = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "notificaciones", label: "Notificaciones", icon: Bell },
  { id: "equipo", label: "Equipo", icon: Users },
  { id: "cerrar-cuenta", label: "Cerrar cuenta", icon: OctagonAlert },
] as const;

function useSeccionActiva() {
  const [activa, setActiva] = useState<string>(SECCIONES[0].id);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiva(visible.target.id);
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );
    SECCIONES.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);
  return [activa, setActiva] as const;
}

export default function App() {
  const [activa, setActiva] = useSeccionActiva();
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number>(undefined);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <div className="min-h-dvh">
      <a href="#contenido" className="sr-only z-50 rounded bg-surface px-3 py-2 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg">A</span>
          <span className="font-semibold">Andes Logística</span>
        </div>
        {/* Navegación por secciones en móvil y tableta */}
        <nav aria-label="Secciones de configuración" className="border-t border-border lg:hidden">
          <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 py-1.5 [scrollbar-width:none] sm:px-4">
            {SECCIONES.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={() => setActiva(s.id)}
                  aria-current={activa === s.id ? "location" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    activa === s.id ? "bg-muted text-fg" : "text-fg-muted hover:text-fg",
                    s.id === "cerrar-cuenta" && "text-danger",
                  )}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[13rem_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <nav aria-label="Secciones de configuración" className="sticky top-20">
            <ul className="flex flex-col gap-0.5">
              {SECCIONES.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={() => setActiva(id)}
                    aria-current={activa === id ? "location" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      activa === id ? "bg-surface text-fg shadow-sm ring-1 ring-border" : "text-fg-muted hover:bg-muted hover:text-fg",
                      id === "cerrar-cuenta" && "text-danger hover:text-danger",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main id="contenido" className="flex min-w-0 max-w-3xl flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Configuración de la cuenta</h1>
            <p className="mt-1 text-sm text-fg-muted">Tu perfil, tus avisos y el acceso de tu equipo.</p>
          </div>
          <PerfilSection notify={notify} />
          <NotificacionesSection notify={notify} />
          <EquipoSection notify={notify} />
          <CerrarCuentaSection />
        </main>
      </div>

      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        {toast && (
          <div className="pointer-events-auto flex items-center gap-2 rounded-lg bg-fg px-4 py-3 text-sm text-bg shadow-lg">
            <CircleCheck className="size-4 shrink-0 text-success" aria-hidden />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
