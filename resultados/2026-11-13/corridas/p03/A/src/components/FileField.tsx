// Adaptado de 21st.dev «File Upload» (uvain/file-upload, demo 27137): zona de soltar con contador de
// profundidad para el drag, y archivo rechazado que se muestra con el motivo en vez de desaparecer.
// Aquí es de un solo archivo, sin subida propia (el envío del formulario lo lleva) y con los tokens del proyecto.
import { useRef, useState } from "react";
import { CheckCircle2, FileText, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { ARCHIVO_TIPOS, formatoBytes } from "@/lib/proveedor";

export function FileField({
  id, label, help, file, error, onChange, onBlur,
}: {
  id: string;
  label: string;
  help: string;
  file: File | null;
  error?: string;
  onChange: (f: File | null) => void;
  onBlur: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const titleId = `${id}-titulo`;
  const desc = error ? `${id}-error` : `${id}-ayuda`;

  return (
    <div className="flex flex-col gap-1.5" role="group" aria-labelledby={titleId}>
      <p id={titleId} className="text-sm font-medium text-ink">{label}</p>
      <input
        ref={inputRef}
        id={id}
        type="file"
        hidden
        accept={ARCHIVO_TIPOS.join(",")}
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {file ? (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border px-3 py-2",
            error ? "border-danger bg-danger-soft" : "border-line bg-surface",
          )}
        >
          <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-md", error ? "bg-surface text-danger" : "bg-primary-soft text-primary")}>
            <FileText className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{file.name}</p>
            <p className="flex items-center gap-1 text-sm text-muted">
              {error ? (
                <span className="text-danger">No se puede usar</span>
              ) : (
                <>
                  <CheckCircle2 aria-hidden className="size-4 text-success" /> {formatoBytes(file.size)} · listo
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="hidden h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium text-primary hover:bg-primary-soft sm:inline-flex"
          >
            Cambiar
          </button>
          <button
            type="button"
            aria-label={`Quitar ${file.name}`}
            onClick={() => { onChange(null); onBlur(); }}
            className="grid size-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 aria-hidden className="size-5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-describedby={desc}
          aria-invalid={error ? true : undefined}
          onClick={() => inputRef.current?.click()}
          onBlur={onBlur}
          onDragEnter={(e) => { e.preventDefault(); depth.current += 1; setDragging(true); }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => { e.preventDefault(); depth.current = Math.max(0, depth.current - 1); if (!depth.current) setDragging(false); }}
          onDrop={(e) => {
            e.preventDefault();
            depth.current = 0;
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) { onChange(f); onBlur(); }
          }}
          className={cn(
            "flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-4 text-center transition-colors",
            dragging ? "border-primary bg-primary-soft" : error ? "border-danger bg-danger-soft/60" : "border-line-strong/60 bg-surface hover:border-primary hover:bg-primary-soft/50",
          )}
        >
          <UploadCloud aria-hidden className={cn("size-6", dragging ? "text-primary" : "text-muted")} />
          <span className="text-sm font-medium text-ink">
            {dragging ? "Suelta el archivo aquí" : <>Elige un archivo <span className="font-normal text-muted">o arrástralo aquí</span></>}
          </span>
        </button>
      )}

      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-danger">{error}</p>
      ) : (
        <p id={`${id}-ayuda`} className="text-sm text-muted">{help}</p>
      )}
    </div>
  );
}
