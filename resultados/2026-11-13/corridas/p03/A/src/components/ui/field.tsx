// Estructura de campo adaptada de 21st.dev «Multi-Field Form» (cnippet-dev/v-field-17, demo 25085):
// etiqueta visible + ayuda + error en línea. Reimplementada sin Radix ni react-hook-form.
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { AlertCircle, ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const controlBase =
  "block h-11 w-full rounded-lg border bg-surface px-3 text-base text-ink placeholder:text-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/30 focus-visible:border-primary";

export function Field({
  id, label, help, error, warning, optional, children, className,
}: {
  id: string;
  label: string;
  help?: string;
  error?: string;
  warning?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {optional ? <span className="font-normal text-muted"> (opcional)</span> : null}
      </label>
      {children}
      {help && !error ? <p id={`${id}-ayuda`} className="text-sm text-muted">{help}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-sm font-medium text-danger">
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}
      {warning && !error ? (
        <p id={`${id}-aviso`} className="flex items-start gap-1.5 rounded-md bg-warn-soft px-2.5 py-2 text-sm text-warn">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          {warning}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, { help, error, warning }: { help?: boolean; error?: string; warning?: string }) {
  return [error ? `${id}-error` : help ? `${id}-ayuda` : null, warning && !error ? `${id}-aviso` : null]
    .filter(Boolean)
    .join(" ") || undefined;
}

export function Input({ invalid, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(controlBase, invalid ? "border-danger" : "border-line-strong", className)}
      {...props}
    />
  );
}

export function Select({
  invalid, placeholder, options, className, ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; placeholder: string; options: readonly string[] }) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(controlBase, "appearance-none pr-10", invalid ? "border-danger" : "border-line-strong", !props.value && "text-muted", className)}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o} className="text-ink">{o}</option>)}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}
