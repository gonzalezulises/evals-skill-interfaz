import { cn } from "@/lib/utils";
import { ESTADOS, type Estado } from "@/lib/facturas";

const estilos: Record<Estado, string> = {
  pendiente: "bg-amber-50 text-amber-800 ring-amber-200",
  vencida: "bg-red-50 text-red-700 ring-red-200",
  pagada: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  anulada: "bg-gray-100 text-gray-600 ring-gray-200",
};

const puntos: Record<Estado, string> = {
  pendiente: "bg-amber-500",
  vencida: "bg-red-500",
  pagada: "bg-emerald-500",
  anulada: "bg-gray-400",
};

export function EstadoBadge({ estado, className }: { estado: Estado; className?: string }) {
  const label = ESTADOS.find((e) => e.value === estado)?.label ?? estado;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        estilos[estado],
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", puntos[estado])} />
      {label}
    </span>
  );
}
