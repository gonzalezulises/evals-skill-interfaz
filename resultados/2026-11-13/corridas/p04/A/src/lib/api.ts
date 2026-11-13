import inventario from "@/data/inventario.json";
import proyectosData from "@/data/proyectos.json";
import type { Proyecto } from "@/lib/proyectos";

export type Articulo = (typeof inventario)[number];

/**
 * Simula la API de inventario: tarda entre 0,6 y 2 s. En producción la API a veces falla
 * (lanza un error) y a veces devuelve una lista vacía para una bodega sin registros.
 */
export async function fetchInventario(bodega?: string): Promise<Articulo[]> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 1400));
  return bodega ? inventario.filter((a) => a.bodega === bodega) : inventario;
}

/** Simula la API de proyectos activos. Como la de inventario, en producción puede fallar o venir vacía. */
export async function fetchProyectos(): Promise<Proyecto[]> {
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
  return proyectosData.proyectos;
}
