import { cn } from "@/lib/utils";
import { ESTILO_ESTADO, estadoInfo, type Estado } from "@/lib/facturas";

export function EstadoBadge({ estado, className }: { estado: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        ESTILO_ESTADO[estado as Estado],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {estadoInfo(estado).singular}
    </span>
  );
}
