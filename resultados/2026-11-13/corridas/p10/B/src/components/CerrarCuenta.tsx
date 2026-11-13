import { TriangleAlert } from "lucide-react";
import { useState, type FormEvent } from "react";
import { guardar } from "@/data/cuenta";
import { Dialog } from "./Dialog";
import { Button, Card, Field, Input } from "./ui";

// Patrón inspirado en 21st.dev «Delete Account Form» (cnippet-dev/v-form-12): frase de confirmación.
const NOMBRE_CUENTA = "Andes Logística";

export function CerrarCuentaSection() {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cerrada, setCerrada] = useState(false);
  const coincide = texto.trim() === NOMBRE_CUENTA;

  const cerrar = () => {
    setAbierto(false);
    setTexto("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!coincide) return;
    setEnviando(true);
    await guardar(null);
    setEnviando(false);
    setCerrada(true);
    cerrar();
  };

  return (
    <Card id="cerrar-cuenta" tone="danger" title="Cerrar la cuenta" description="Acción permanente para toda la organización.">
      {cerrada ? (
        <p role="status" className="rounded-lg bg-danger-soft p-3 text-sm text-fg">
          Solicitud de cierre registrada. Te enviamos un correo con los pasos para descargar tus datos durante los próximos 30 días.
        </p>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ul className="list-disc space-y-1 pl-5 text-sm text-fg-muted">
            <li>Se borran órdenes, inventario, tickets y facturas.</li>
            <li>Todas las personas del equipo pierden el acceso.</li>
            <li>No se puede deshacer.</li>
          </ul>
          <Button variant="dangerOutline" className="shrink-0" onClick={() => setAbierto(true)}>
            Cerrar la cuenta…
          </Button>
        </div>
      )}

      <Dialog open={abierto} onClose={cerrar} title="¿Cerrar la cuenta de Andes Logística?" labelledBy="cerrar-title">
        <div className="mt-3 flex gap-3 rounded-lg border border-danger-border bg-danger-soft p-3 text-sm text-fg">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <p>Se borrarán todos los datos y nadie del equipo podrá volver a entrar. Esta acción no se puede deshacer.</p>
        </div>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
          <Field id="confirmar-cierre" label={`Escribe «${NOMBRE_CUENTA}» para confirmar`}>
            <Input
              id="confirmar-cierre"
              autoComplete="off"
              spellCheck={false}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={NOMBRE_CUENTA}
              autoFocus
            />
          </Field>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={cerrar}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger" disabled={!coincide} loading={enviando}>
              Cerrar la cuenta definitivamente
            </Button>
          </div>
        </form>
      </Dialog>
    </Card>
  );
}
