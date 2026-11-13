import { cn } from "@/lib/utils";

const COLOR: Record<string, string> = {
  crítica: "bg-p-critica",
  alta: "bg-p-alta",
  media: "bg-p-media",
  baja: "bg-p-baja",
};

export const colorPrioridad = (p: string) => COLOR[p] ?? "bg-p-baja";

export function PrioridadPill({ prioridad, className }: { prioridad: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm capitalize", className)}>
      <span className={cn("size-2.5 rounded-full", colorPrioridad(prioridad))} aria-hidden />
      {prioridad}
    </span>
  );
}
