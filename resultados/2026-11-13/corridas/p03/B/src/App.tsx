import { Truck } from "lucide-react";
import { AltaProveedor } from "@/components/AltaProveedor";

export default function App() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:px-6">
          <Truck className="size-5 text-accent" aria-hidden="true" />
          <span className="text-sm font-semibold text-ink">Andes Logística</span>
          <span className="text-sm text-muted">· Compras</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Alta de proveedor</h1>
          <p className="mt-1 text-sm text-muted">Registra un proveedor nuevo para poder emitirle órdenes de compra y pagos.</p>
        </div>
        <AltaProveedor />
      </main>
    </div>
  );
}
