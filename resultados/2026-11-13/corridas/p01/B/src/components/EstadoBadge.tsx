import { cn } from "@/lib/utils";

const ESTILO: Record<string, string> = {
  borrador: "bg-surface-2 text-muted",
  aprobada: "bg-accent-soft text-accent",
  enviada: "bg-accent-soft text-accent",
  "recibida parcial": "bg-warn-soft text-warn",
  recibida: "bg-ok-soft text-ok",
  cancelada: "bg-surface-2 text-muted",
};

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium first-letter:uppercase", ESTILO[estado])}>
      {estado}
    </span>
  );
}
