import { cn } from "@/lib/utils";
import { ESTADOS, type Estado } from "@/lib/facturas";

type Props = {
  valor: Estado | "todas";
  conteos: Record<string, number>;
  total: number;
  onCambiar: (v: Estado | "todas") => void;
};

export function FiltroEstado({ valor, conteos, total, onCambiar }: Props) {
  const opciones = [{ id: "todas" as const, plural: "Todas" }, ...ESTADOS];
  return (
    <div role="group" aria-label="Filtrar por estado" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      {opciones.map((o) => {
        const activo = valor === o.id;
        const n = o.id === "todas" ? total : (conteos[o.id] ?? 0);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={activo}
            onClick={() => onCambiar(o.id)}
            className={cn(
              "inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
              activo
                ? "border-tinta bg-tinta text-white"
                : "border-linea bg-superficie text-tinta hover:border-tenue/50",
            )}
          >
            {o.plural}
            <span
              className={cn(
                "rounded-full px-1.5 text-xs tabular-nums",
                activo ? "bg-white/20 text-white" : "bg-fondo text-tenue",
              )}
            >
              {n}
            </span>
          </button>
        );
      })}
    </div>
  );
}
