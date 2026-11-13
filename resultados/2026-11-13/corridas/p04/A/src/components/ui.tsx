import { CircleCheck, OctagonAlert, TriangleAlert } from "lucide-react";
import type { Estado, Riesgo } from "@/lib/proyectos";
import { cn } from "@/lib/utils";

const ESTADO = {
  critico: { Icono: OctagonAlert, texto: "Crítico", clase: "text-crit-ink", fondo: "bg-crit-soft" },
  alerta: { Icono: TriangleAlert, texto: "Alerta", clase: "text-warn-ink", fondo: "bg-warn-soft" },
  ok: { Icono: CircleCheck, texto: "En rango", clase: "text-ok-ink", fondo: "" },
} as const;

export const fondoEstado = (e: Estado) => ESTADO[e].fondo;

/** Icono de estado con nombre accesible: el color nunca va solo. */
export function IconoEstado({ estado, className }: { estado: Estado; className?: string }) {
  const { Icono, texto, clase } = ESTADO[estado];
  return <Icono role="img" aria-label={texto} className={cn("size-4 shrink-0", clase, className)} />;
}

export function InsigniaRiesgo({ riesgo }: { riesgo: string }) {
  const r = riesgo as Riesgo;
  const estado: Estado = r === "alto" ? "critico" : r === "medio" ? "alerta" : "ok";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        r === "alto" && "border-crit/40 bg-crit-soft text-crit-ink",
        r === "medio" && "border-warn/50 bg-warn-soft text-warn-ink",
        r === "bajo" && "border-line text-ok-ink",
      )}
    >
      <IconoEstado estado={estado} className="size-3.5" />
      Riesgo {r}
    </span>
  );
}
