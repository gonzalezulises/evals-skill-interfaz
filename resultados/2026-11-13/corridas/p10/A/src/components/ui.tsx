/**
 * Primitivas adaptadas de los componentes shadcn que traen los bloques de 21st.dev
 * (button, input, label, card, switch de #28366 y #28426), reimplementadas sin Radix
 * porque el proyecto no lo tiene instalado.
 */
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const foco = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const buttonVariants = cva(
  `inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 sm:min-h-10 ${foco}`,
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-card hover:bg-muted",
        ghost: "hover:bg-muted",
        dangerOutline: "border border-destructive/40 bg-card text-destructive hover:bg-destructive/5",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, loading, children, disabled, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
    {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
    {children}
  </button>
));
Button.displayName = "Button";

const controlBase = `block min-h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground sm:min-h-10 aria-[invalid=true]:border-destructive ${foco}`;

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(controlBase, className)} {...props} />
));
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(controlBase, "pr-8", className)} {...props} />
));
Select.displayName = "Select";

/** Campo con etiqueta visible, ayuda inline y error en el propio campo. */
export function Field({ id, label, ayuda, error, children, className }: { id: string; label: string; ayuda?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : ayuda ? (
        <p id={`${id}-ayuda`} className="text-xs text-muted-foreground">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}

export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("group inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-full", foco)}
    >
      <span className={cn("inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors", checked ? "bg-primary" : "bg-input")}>
        <span className={cn("block size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0")} />
      </span>
    </button>
  );
}

export function SectionCard({ id, titulo, descripcion, children, footer, tone = "default" }: { id: string; titulo: string; descripcion: string; children: ReactNode; footer?: ReactNode; tone?: "default" | "danger" }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className={cn("rounded-lg border bg-card shadow-sm", tone === "danger" ? "border-destructive/40" : "border-border")}>
      <header className="border-b border-border px-4 py-4 sm:px-6">
        <h2 id={`${id}-titulo`} className={cn("text-base font-semibold", tone === "danger" && "text-destructive")}>
          {titulo}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>
      </header>
      <div className="px-4 py-5 sm:px-6">{children}</div>
      {footer && <footer className="flex flex-col-reverse gap-3 border-t border-border bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6">{footer}</footer>}
    </section>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} aria-hidden />;
}
