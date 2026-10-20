import { useEffect } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Diálogo de confirmação usado antes de apagar o progresso da partida. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="overlay overlay--dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="overlay__card overlay__card--small" data-testid="confirm-dialog">
        <h2 id="confirm-title" className="overlay__title overlay__title--small">
          {title}
        </h2>
        <p className="overlay__text">{message}</p>
        <div className="overlay__actions">
          <button
            type="button"
            className="btn btn--danger"
            onClick={onConfirm}
            data-testid="confirm-accept"
          >
            {confirmLabel}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onCancel} data-testid="confirm-cancel">
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
