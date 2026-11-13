import { AltaProveedor } from "@/components/AltaProveedor";

export default function App() {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
          <span className="text-base font-semibold tracking-tight text-ink">Andes Logística</span>
        </div>
      </header>
      <main>
        <AltaProveedor />
      </main>
    </>
  );
}
