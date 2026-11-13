import { useEffect, useRef, type ReactNode } from "react";

/** Modal sobre <dialog> nativo: atrapa el foco, cierra con Esc y devuelve el foco al disparador. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  labelledBy = "dialog-title",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-surface p-0 text-fg shadow-xl backdrop:bg-black/50"
    >
      {open && (
        <div className="p-5 sm:p-6">
          <h2 id={labelledBy} className="text-lg font-semibold">
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
