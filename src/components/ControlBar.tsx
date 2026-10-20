interface ControlBarProps {
  onNewGame: () => void;
  onRestart: () => void;
  onHint: () => void;
  onSolution: () => void;
  solutionShown: boolean;
}

/** Botões de controle da partida. */
export function ControlBar({
  onNewGame,
  onRestart,
  onHint,
  onSolution,
  solutionShown,
}: ControlBarProps) {
  return (
    <div className="controls" role="group" aria-label="Controles do jogo">
      <button type="button" className="btn btn--primary" onClick={onNewGame} data-testid="new-game">
        <span aria-hidden="true">🔄</span> Novo jogo
      </button>
      <button
        type="button"
        className="btn btn--ghost"
        onClick={onRestart}
        data-testid="restart"
      >
        <span aria-hidden="true">↺</span> Reiniciar
      </button>
      <button type="button" className="btn btn--ghost" onClick={onHint} data-testid="hint">
        <span aria-hidden="true">💡</span> Dica
      </button>
      <button
        type="button"
        className="btn btn--ghost"
        onClick={onSolution}
        disabled={solutionShown}
        data-testid="solution"
      >
        <span aria-hidden="true">👁️</span> {solutionShown ? 'Solução mostrada' : 'Mostrar solução'}
      </button>
    </div>
  );
}
