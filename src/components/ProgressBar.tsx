interface ProgressBarProps {
  found: number;
  total: number;
  progress: number;
}

/** Barra de progresso da partida + contador "X de Y palavras encontradas". */
export function ProgressBar({ found, total, progress }: ProgressBarProps) {
  const percent = Math.round(progress * 100);
  return (
    <div className="progress" data-testid="progress">
      <div className="progress__header">
        <span className="progress__label">Palavras encontradas</span>
        <span className="progress__count" data-testid="progress-count">
          <strong>{found}</strong> de {total}
        </span>
      </div>
      <div
        className="progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={found}
        aria-label="Progresso da partida"
      >
        <div className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
