import { useState } from "react";
import { CANALES, EVENTOS, guardar, preferenciasIniciales, type Canal, type EventoId, type Preferencias } from "@/data/cuenta";
import { Button, Card, Switch } from "./ui";

export function NotificacionesSection({ notify }: { notify: (msg: string) => void }) {
  const [guardado, setGuardado] = useState<Preferencias>(preferenciasIniciales);
  const [prefs, setPrefs] = useState<Preferencias>(preferenciasIniciales);
  const [enviando, setEnviando] = useState(false);
  const sucio = JSON.stringify(prefs) !== JSON.stringify(guardado);

  const toggle = (ev: EventoId, canal: Canal, v: boolean) =>
    setPrefs((p) => ({ ...p, [ev]: { ...p[ev], [canal]: v } }));

  const onSave = async () => {
    setEnviando(true);
    setGuardado(await guardar(prefs));
    setEnviando(false);
    notify("Preferencias de notificación guardadas.");
  };

  return (
    <Card
      id="notificaciones"
      title="Notificaciones"
      description="Elige qué avisos recibes y por qué canal."
      footer={
        <>
          <Button variant="ghost" disabled={!sucio || enviando} onClick={() => setPrefs(guardado)}>
            Descartar cambios
          </Button>
          <Button disabled={!sucio} loading={enviando} onClick={onSave}>
            {enviando ? "Guardando…" : "Guardar preferencias"}
          </Button>
        </>
      }
    >
      {/* Cabecera de canales: solo en pantallas medianas en adelante */}
      <div className="hidden grid-cols-[1fr_repeat(3,5.5rem)] items-end gap-2 pb-2 text-xs font-medium uppercase tracking-wide text-fg-muted md:grid" aria-hidden>
        <span>Evento</span>
        {CANALES.map((c) => (
          <span key={c.value} className="text-center">{c.label}</span>
        ))}
      </div>
      <ul className="divide-y divide-border border-y border-border md:border-t-border">
        {EVENTOS.map((ev) => (
          <li key={ev.id} className="grid grid-cols-1 gap-3 py-4 md:grid-cols-[1fr_repeat(3,5.5rem)] md:items-center md:gap-2">
            <div>
              <p id={`ev-${ev.id}`} className="text-sm font-medium text-fg">{ev.label}</p>
              <p className="text-sm text-fg-muted">{ev.descripcion}</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 md:contents" role="group" aria-labelledby={`ev-${ev.id}`}>
              {CANALES.map((c) => (
                <div key={c.value} className="flex items-center gap-2 md:justify-center">
                  <Switch
                    checked={prefs[ev.id][c.value]}
                    onChange={(v) => toggle(ev.id, c.value, v)}
                    label={`${ev.label}: ${c.label}`}
                  />
                  <span className="text-sm text-fg-muted md:sr-only">{c.label}</span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
