import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fDelta } from "@/lib/clima";

/* Patrón adaptado de 21st.dev «Charts & KPI Cards» (uvain/revenue-charts-kpi, id 33507):
   tarjeta como <figure>/<figcaption>, KPI que sabe si subir es bueno, delta con icono + texto
   (nunca solo color) y tabla oculta para lectores de pantalla. Reescrito con los tokens locales. */

export function Card({
  title,
  subtitle,
  actions,
  className,
  children,
  id,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      aria-labelledby={id ? `${id}-t` : undefined}
      className={cn("grid min-w-0 content-start gap-4 rounded-2xl bg-surface p-4 ring-1 ring-line sm:p-5", className)}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-0.5">
          <h2 id={id ? `${id}-t` : undefined} className="text-[15px] font-semibold tracking-[-0.01em]">
            {title}
          </h2>
          {subtitle && <p className="text-[13px] text-ink-2">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function Delta({ value, className, suffix }: { value: number; className?: string; suffix?: string }) {
  const r = Math.round(value * 100) / 100;
  const Icon = r > 0 ? ArrowUpRight : r < 0 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium tabular-nums",
        r > 0 ? "text-good" : r < 0 ? "text-bad" : "text-ink-2",
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="sr-only">{r > 0 ? "Sube " : r < 0 ? "Baja " : "Sin cambio "}</span>
      {fDelta(value)}
      {suffix && <span className="ml-1 font-normal text-ink-2">{suffix}</span>}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  unit,
  children,
  onClick,
  actionLabel,
  className,
}: {
  className?: string;
  label: string;
  value: React.ReactNode;
  unit?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  actionLabel?: string;
}) {
  const body = (
    <>
      <p className="text-[13px] font-medium text-ink-2">{label}</p>
      <p className="flex items-baseline gap-1.5">
        <span className="text-[26px] leading-none font-semibold tracking-[-0.02em] tabular-nums">{value}</span>
        {unit && <span className="text-[13px] text-ink-2">{unit}</span>}
      </p>
      {children && <div className="text-[13px]">{children}</div>}
    </>
  );
  const base = cn("grid min-w-0 content-start gap-2 rounded-2xl bg-surface p-4 text-left ring-1 ring-line", className);
  if (!onClick) return <div className={base}>{body}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={actionLabel}
      className={cn(base, "min-h-11 cursor-pointer transition-shadow hover:ring-ink-3")}
    >
      {body}
    </button>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-11 cursor-pointer rounded-[10px] px-3 text-[13px] font-medium sm:min-h-9",
            value === o.value ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-2 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="grid place-items-center gap-1 rounded-xl border border-dashed border-line px-4 py-8 text-center">
      <p className="text-[14px] font-medium">{title}</p>
      {children && <div className="max-w-sm text-[13px] text-ink-2">{children}</div>}
    </div>
  );
}

/** Panel lateral de detalle (dialog modal). Esc cierra, el foco vuelve al disparador. */
export function Drawer({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const prev = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    prev.current = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>("button, [href], select, input, [tabindex]:not([tabindex='-1'])");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      prev.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-surface shadow-2xl outline-none"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line p-4 sm:p-5">
          <div className="grid gap-0.5">
            <h2 id="drawer-title" className="text-[17px] font-semibold">
              {title}
            </h2>
            {subtitle && <div className="text-[13px] text-ink-2">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle"
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>
        <div className="grid flex-1 content-start gap-6 overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
