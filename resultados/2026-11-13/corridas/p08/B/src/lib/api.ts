import inventario from "@/data/inventario.json";

export type Articulo = (typeof inventario)[number];

/**
 * Para probar los casos de producción en local: `?sim=error`, `?sim=vacio`, `?sim=lento`
 * o `?sim=aleatorio` (25 % falla, 15 % vacía). Sin el parámetro se comporta igual que antes.
 */
function modoSimulado(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("sim");
}

/**
 * Simula la API de inventario: tarda entre 0,6 y 2 s. En producción la API a veces falla
 * (lanza un error) y a veces devuelve una lista vacía para una bodega sin registros.
 */
export async function fetchInventario(bodega?: string): Promise<Articulo[]> {
  const sim = modoSimulado();
  const extra = sim === "lento" ? 6000 : 0;
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 1400 + extra));
  const azar = Math.random();
  if (sim === "error" || (sim === "aleatorio" && azar < 0.25)) {
    throw new Error("La API de inventario respondió 503");
  }
  if (sim === "vacio" || (sim === "aleatorio" && azar < 0.4)) return [];
  return bodega ? inventario.filter((a) => a.bodega === bodega) : inventario;
}
