import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`,
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:bg-primary-hover",
        secondary: "border border-border bg-surface text-fg hover:bg-muted",
        ghost: "text-fg-muted hover:bg-muted hover:text-fg",
        danger: "bg-danger text-white hover:bg-danger-hover dark:text-[#1a0806]",
        dangerOutline: "border border-danger-border bg-surface text-danger hover:bg-danger-soft",
      },
      size: {
        md: "h-10 px-4",
        sm: "h-9 px-3",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

const controlBase = `w-full rounded-lg border bg-surface px-3 text-sm text-fg placeholder:text-fg-muted/70 transition-colors disabled:cursor-not-allowed disabled:bg-muted disabled:text-fg-muted ${focusRing}`;

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(controlBase, "h-10", invalid ? "border-danger" : "border-border", className)}
    {...props}
  />
));
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(controlBase, "h-10 cursor-pointer border-border pr-8", className)} {...props} />
  ),
);
Select.displayName = "Select";

export function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-fg-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        focusRing,
        checked ? "bg-primary" : "bg-border",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export function Card({
  id,
  title,
  description,
  children,
  footer,
  tone = "default",
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  tone?: "default" | "danger";
}) {
  const headingId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "overflow-hidden rounded-xl border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        tone === "danger" ? "border-danger-border" : "border-border",
      )}
    >
      <header className="border-b border-border px-5 py-4 sm:px-6">
        <h2 id={headingId} className={cn("text-base font-semibold", tone === "danger" ? "text-danger" : "text-fg")}>
          {title}
        </h2>
        <p className="mt-1 text-sm text-fg-muted">{description}</p>
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
      {footer && (
        <footer className="flex flex-col-reverse gap-2 border-t border-border bg-muted/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          {footer}
        </footer>
      )}
    </section>
  );
}
