import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, FileEdit, PackageCheck, Send, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const focusRing =
  "outline-none focus-visible:ring-[3px] focus-visible:ring-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-surface";

const ESTADO_ESTILO: Record<string, { label: string; cls: string; Icon: typeof Send }> = {
  borrador: { label: "Borrador", cls: "bg-surface-active text-muted", Icon: FileEdit },
  aprobada: { label: "Aprobada", cls: "bg-accent-soft text-accent", Icon: CheckCircle2 },
  enviada: { label: "Enviada", cls: "bg-accent-soft text-accent", Icon: Send },
  "recibida parcial": { label: "Recibida parcial", cls: "bg-warn-soft text-warn", Icon: CircleDashed },
  recibida: { label: "Recibida", cls: "bg-ok-soft text-ok", Icon: PackageCheck },
  cancelada: { label: "Cancelada", cls: "bg-surface-active text-soft", Icon: XCircle },
};

export function EstadoBadge({ estado }: { estado: string }) {
  const e = ESTADO_ESTILO[estado] ?? ESTADO_ESTILO.borrador;
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", e.cls)}>
      <e.Icon aria-hidden="true" className="size-3.5" />
      {e.label}
    </span>
  );
}

export function AtrasoBadge({ dias }: { dias: number }) {
  if (dias <= 0) return <span className="text-xs text-soft">—</span>;
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger tabular-nums">
      <AlertTriangle aria-hidden="true" className="size-3.5" />
      {dias} {dias === 1 ? "día" : "días"}
    </span>
  );
}

export function Panel({ title, subtitle, action, children, className, id }: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("min-w-0 rounded-2xl border border-line bg-surface shadow-[var(--shadow)]", className)}>
      <header className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4 sm:px-5">
        <div className="min-w-0">
          <h2 id={id} className="text-sm font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-soft">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-surface-active", className)} />;
}
