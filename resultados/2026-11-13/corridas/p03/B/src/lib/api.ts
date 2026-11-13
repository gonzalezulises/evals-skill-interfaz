import inventario from "@/data/inventario.json";

export type Articulo = (typeof inventario)[number];

/**
 * Simula la API de inventario: tarda entre 0,6 y 2 s. En producción la API a veces falla
 * (lanza un error) y a veces devuelve una lista vacía para una bodega sin registros.
 */
export async function fetchInventario(bodega?: string): Promise<Articulo[]> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 1400));
  return bodega ? inventario.filter((a) => a.bodega === bodega) : inventario;
}
