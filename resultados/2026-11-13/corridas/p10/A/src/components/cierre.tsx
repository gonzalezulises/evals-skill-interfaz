/** Zona de cierre. Patrón de confirmación por frase tomado de 21st.dev #25081 (cnippet-dev/v-form-12). */
import { useRef, useState, type FormEvent } from "react";
import { TriangleAlert, X } from "lucide-react";
import { Button, Field, Input, SectionCard } from "@/components/ui";

const FRASE = "cerrar andes logística";

export function CierreSection({ avisar }: { avisar: (m: string) => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [valor, setValor] = useState("");
  const [cerrando, setCerrando] = useState(false);
  const confirmado = valor.trim().toLowerCase() === FRASE;

  function abrir() {
    setValor("");
    dialogo.current?.showModal();
  }
  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!confirmado) return;
    setCerrando(true);
    await new Promise((r) => setTimeout(r, 1000));
    setCerrando(false);
    dialogo.current?.close();
    avisar("Solicitud de cierre registrada. Te enviamos un correo con los pasos y la exportación de datos.");
  }

  return (
    <SectionCard id="cierre" tone="danger" titulo="Cerrar la cuenta" descripcion="Esta acción afecta a todo el equipo y no se puede deshacer.">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Todos los usuarios del equipo pierden el acceso de inmediato.</li>
          <li>Órdenes, inventario y despachos se borran a los 30 días.</li>
          <li>Antes de eso puedes descargar una copia de tus datos.</li>
        </ul>
        <Button variant="dangerOutline" onClick={abrir} className="shrink-0">
          Cerrar la cuenta…
        </Button>
      </div>

      <dialog ref={dialogo} aria-labelledby="cierre-dialogo-titulo" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-card p-0 text-foreground shadow-xl">
        <form onSubmit={enviar} className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
            <div className="flex-1 space-y-1">
              <h3 id="cierre-dialogo-titulo" className="font-semibold">¿Cerrar la cuenta de Andes Logística?</h3>
              <p className="text-sm text-muted-foreground">Todo el equipo pierde el acceso y los datos se borran a los 30 días. No se puede deshacer.</p>
            </div>
            <button type="button" onClick={() => dialogo.current?.close()} aria-label="Cancelar y cerrar el diálogo" className="-mr-2 -mt-2 inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <Field id="cierre-frase" label={`Para confirmar, escribe «${FRASE}»`} ayuda="Así evitamos cierres por accidente.">
            <Input id="cierre-frase" value={valor} onChange={(e) => setValor(e.target.value)} autoComplete="off" placeholder={FRASE} aria-describedby="cierre-frase-ayuda" />
          </Field>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => dialogo.current?.close()}>Cancelar</Button>
            <Button type="submit" variant="destructive" disabled={!confirmado} loading={cerrando}>Cerrar la cuenta definitivamente</Button>
          </div>
        </form>
      </dialog>
    </SectionCard>
  );
}
