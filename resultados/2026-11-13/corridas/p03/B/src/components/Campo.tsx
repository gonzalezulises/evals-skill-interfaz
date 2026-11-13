import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Base = { name: string; label: string; ayuda?: string; error?: string; className?: string };

const control = (error?: string) =>
  cn(
    "block w-full min-h-11 rounded-md border bg-surface px-3 text-base text-ink placeholder:text-muted/70 transition-colors sm:text-sm",
    "focus:outline-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/25",
    error ? "border-danger" : "border-line-strong hover:border-muted",
  );

function Envoltura({ name, label, ayuda, error, className, children }: Base & { children: ReactNode }) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label} <span className="text-danger" aria-hidden="true">*</span>
      </label>
      <div className="mt-1.5">{children}</div>
      {ayuda && (
        <p id={`${name}-ayuda`} className="mt-1 text-xs text-muted">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="mt-1.5 flex items-start gap-1.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (name: string, ayuda?: string, error?: string) =>
  cn(ayuda && `${name}-ayuda`, error && `${name}-error`) || undefined;

export function CampoTexto({
  name,
  label,
  ayuda,
  error,
  className,
  ...rest
}: Base & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "className">) {
  return (
    <Envoltura {...{ name, label, ayuda, error, className }}>
      <input
        id={name}
        name={name}
        aria-invalid={!!error}
        aria-required="true"
        aria-describedby={describedBy(name, ayuda, error)}
        className={control(error)}
        {...rest}
      />
    </Envoltura>
  );
}

export function CampoSelect({
  name,
  label,
  ayuda,
  error,
  className,
  opciones,
  ...rest
}: Base & { opciones: readonly string[] } & Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "className">) {
  return (
    <Envoltura {...{ name, label, ayuda, error, className }}>
      <div className="relative">
        <select
          id={name}
          name={name}
          aria-invalid={!!error}
          aria-required="true"
          aria-describedby={describedBy(name, ayuda, error)}
          className={cn(control(error), "cursor-pointer appearance-none pr-10")}
          {...rest}
        >
          <option value="">Selecciona…</option>
          {opciones.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      </div>
    </Envoltura>
  );
}
