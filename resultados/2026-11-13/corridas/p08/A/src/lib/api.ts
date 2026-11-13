import inventario from "@/data/inventario.json";

export type Articulo = (typeof inventario)[number];

/**
 * Para reproducir los casos de producción sin esperar a que ocurran, la URL acepta
 * `?simular=error | vacio | lento | falla-una-vez`. Sin ese parámetro la simulación es la normal.
 */
function modoSimulado(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("simular");
}
let fallosForzados = 0;

/**
 * Simula la API de inventario: tarda entre 0,6 y 2 s. En producción la API a veces falla
 * (lanza un error) y a veces devuelve una lista vacía para una bodega sin registros.
 */
export async function fetchInventario(bodega?: string): Promise<Articulo[]> {
  const modo = modoSimulado();
  const espera = modo === "lento" ? 9000 : 600 + Math.random() * 1400;
  await new Promise((r) => setTimeout(r, espera));
  if (modo === "error") throw new Error("La API de inventario respondió 503");
  if (modo === "falla-una-vez" && fallosForzados++ === 0) throw new Error("La API de inventario respondió 503");
  if (modo === "vacio") return [];
  return bodega ? inventario.filter((a) => a.bodega === bodega) : inventario;
}
