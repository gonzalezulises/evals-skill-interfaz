import { useCallback, useEffect, useRef, useState } from "react";
import { fetchInventario, type Articulo } from "@/lib/api";

export const BODEGAS = ["Panamá Pacífico", "Tocumen", "Colón", "David"] as const;

export type Estado = "agotado" | "bajo" | "ok";

export function estadoDe(a: Articulo): Estado {
  if (a.existencia === 0) return "agotado";
  if (a.existencia < a.minimo) return "bajo";
  return "ok";
}

export const ESTADO_META: Record<Estado, { etiqueta: string; chip: string; barra: string; orden: number }> = {
  agotado: { etiqueta: "Agotado", chip: "bg-rose-50 text-rose-800 ring-rose-200", barra: "bg-rose-600", orden: 0 },
  bajo: { etiqueta: "Bajo mínimo", chip: "bg-amber-50 text-amber-900 ring-amber-200", barra: "bg-amber-500", orden: 1 },
  ok: { etiqueta: "En nivel", chip: "bg-emerald-50 text-emerald-800 ring-emerald-200", barra: "bg-emerald-600", orden: 2 },
};

const dinero = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const dineroCent = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const numero = new Intl.NumberFormat("es-PA");
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export const fmt = {
  dinero: (n: number) => dinero.format(n),
  dineroCent: (n: number) => dineroCent.format(n),
  numero: (n: number) => numero.format(n),
  /** "2026-08-19" → "19 ago 2026", sin pasar por Date para no correr el día por zona horaria. */
  fecha: (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return `${d} ${MESES[m - 1]} ${y}`;
  },
  hora: (d: Date) => d.toLocaleTimeString("es-PA", { hour: "2-digit", minute: "2-digit" }),
};

export type Carga =
  | { tipo: "cargando" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "listo"; articulos: Articulo[]; cargadoEn: Date };

/** Pide el inventario de una bodega; ignora respuestas viejas si el usuario cambió de bodega a mitad. */
export function useInventario(bodega: string | undefined) {
  const [carga, setCarga] = useState<Carga>({ tipo: "cargando" });
  const [lento, setLento] = useState(false);
  const turno = useRef(0);

  const cargar = useCallback(() => {
    const mio = ++turno.current;
    setCarga({ tipo: "cargando" });
    setLento(false);
    const aviso = window.setTimeout(() => mio === turno.current && setLento(true), 5000);
    fetchInventario(bodega)
      .then((articulos) => mio === turno.current && setCarga({ tipo: "listo", articulos, cargadoEn: new Date() }))
      .catch((e: unknown) =>
        mio === turno.current && setCarga({ tipo: "error", mensaje: e instanceof Error ? e.message : String(e) }),
      )
      .finally(() => window.clearTimeout(aviso));
  }, [bodega]);

  useEffect(() => {
    cargar();
    return () => {
      turno.current++;
    };
  }, [cargar]);

  return { carga, lento, reintentar: cargar };
}
