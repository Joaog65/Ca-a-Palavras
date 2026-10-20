import type { ToastMessage } from '../lib/types';

interface ToastProps {
  toast: ToastMessage | null;
}

/** Mensagem temporária que aparece acima da grade. */
export function Toast({ toast }: ToastProps) {
  if (!toast) return null;
  return (
    <div
      className={`toast toast--${toast.tone}`}
      role="status"
      aria-live="polite"
      key={toast.id}
      data-testid="toast"
    >
      {toast.text}
    </div>
  );
}
