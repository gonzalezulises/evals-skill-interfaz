// Adaptado de «File Dropzone» de joyco en 21st.dev (id 19201): zona de arrastre con
// validación de tipo y tamaño, tarjeta del archivo elegido y botón para quitarlo.
import { useId, useRef, useState, type DragEvent } from "react";
import { AlertCircle, FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_MB, formatoTamano } from "@/lib/proveedor";

type Props = {
  name: string;
  label: string;
  ayuda: string;
  archivo: File | null;
  error?: string;
  onChange: (archivo: File | null) => void;
};

export function CampoArchivo({ name, label, ayuda, archivo, error, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const id = useId();
  const ayudaId = `${id}-ayuda`;
  const errorId = `${id}-error`;

  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onChange(f);
  };

  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-ink" id={`${id}-label`}>
        {label} <span className="text-danger" aria-hidden="true">*</span>
      </p>
      <p id={ayudaId} className="mt-0.5 text-xs text-muted">
        {ayuda}
      </p>

      <input
        ref={inputRef}
        id={name}
        name={name}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="sr-only"
        tabIndex={-1}
        aria-labelledby={`${id}-label`}
        aria-describedby={cn(ayudaId, error && errorId)}
        aria-invalid={!!error}
        aria-required="true"
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {archivo ? (
        <div
          className={cn(
            "mt-2 flex items-center gap-3 rounded-lg border bg-surface-2 p-3",
            error ? "border-danger" : "border-line",
          )}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-line bg-surface">
            <FileText className="size-5 text-accent" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink" title={archivo.name}>{archivo.name}</p>
            <p className="text-xs text-muted">{formatoTamano(archivo.size)}</p>
          </div>
          <button
            type="button"
            id={`${name}-accion`}
            aria-label={`Cambiar ${label.toLowerCase()}`}
            onClick={() => inputRef.current?.click()}
            className="min-h-11 shrink-0 cursor-pointer rounded-md px-3 text-sm font-medium text-accent hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Cambiar
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Quitar ${archivo.name}`}
            title="Quitar archivo"
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-danger-soft hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setArrastrando(false)}
          onDrop={soltar}
          className={cn(
            "mt-2 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-5 text-center transition-colors",
            arrastrando ? "border-accent bg-accent-soft" : error ? "border-danger bg-danger-soft/40" : "border-line-strong bg-surface-2",
          )}
        >
          <Upload className="size-5 text-muted" aria-hidden="true" />
          <p className="text-sm text-ink">
            <span className="hidden sm:inline">Arrastra el archivo aquí o </span>
            <button
              type="button"
              id={`${name}-accion`}
              aria-label={`Elegir ${label.toLowerCase()}`}
              aria-describedby={cn(ayudaId, error && errorId)}
              onClick={() => inputRef.current?.click()}
              className="min-h-11 cursor-pointer rounded-md px-1 font-medium text-accent underline underline-offset-2 hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:min-h-0"
            >
              <span className="sm:hidden">Elegir archivo</span>
              <span className="hidden sm:inline">elígelo</span>
            </button>
          </p>
          <p className="text-xs text-muted">PDF, JPG o PNG · máx. {MAX_MB} MB</p>
        </div>
      )}

      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
