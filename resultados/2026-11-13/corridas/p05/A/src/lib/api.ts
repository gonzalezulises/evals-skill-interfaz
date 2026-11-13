import inventario from "@/data/inventario.json";
import facturas from "@/data/facturas.json";

export type Articulo = (typeof inventario)[number];

/**
 * Simula la API de inventario: tarda entre 0,6 y 2 s. En producción la API a veces falla
 * (lanza un error) y a veces devuelve una lista vacía para una bodega sin registros.
 */
export async function fetchInventario(bodega?: string): Promise<Articulo[]> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 1400));
  return bodega ? inventario.filter((a) => a.bodega === bodega) : inventario;
}

export type Factura = (typeof facturas)[number];

/**
 * Simula la API de facturas del cliente: tarda entre 0,6 y 1,4 s. Para ver los estados de la
 * pantalla sin una API real, `?simular=error` hace que falle y `?simular=vacio` devuelve [].
 */
export async function fetchFacturas(): Promise<Factura[]> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));
  const simular = new URLSearchParams(window.location.search).get("simular");
  if (simular === "error") throw new Error("La API de facturación no respondió.");
  if (simular === "vacio") return [];
  return facturas;
}
