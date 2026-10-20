import { useEffect } from 'react';

interface WinOverlayProps {
  open: boolean;
  found: number;
  total: number;
  elapsedSeconds: number;
  usedHint: boolean;
  usedSolution: boolean;
  onPlayAgain: () => void;
  onClose: () => void;
}

const CONFETTI = Array.from({ length: 26 }, (_, index) => index);

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

/** Modal de parabéns exibido quando todas as palavras são encontradas. */
export function WinOverlay({
  open,
  found,
  total,
  elapsedSeconds,
  usedHint,
  usedSolution,
  onPlayAgain,
  onClose,
}: WinOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="win-title">
      <div className="overlay__confetti" aria-hidden="true">
        {CONFETTI.map((index) => (
          <span
            key={index}
            className="confetti"
            style={{
              left: `${(index * 37) % 100}%`,
              animationDelay: `${(index % 8) * 0.12}s`,
              backgroundColor: ['#F5C518', '#4ADE80', '#60A5FA', '#F9A8D4', '#FDBA74', '#C4B5FD', '#F87171'][index % 7],
            }}
          />
        ))}
      </div>
      <div className="overlay__card" data-testid="win-overlay">
        <div className="overlay__emoji" aria-hidden="true">
          🎉
        </div>
        <h2 id="win-title" className="overlay__title">
          Parabéns! Você conseguiu!
        </h2>
        <p className="overlay__text">
          Você encontrou <strong>{found}</strong> de {total} palavras em {formatTime(elapsedSeconds)}.
        </p>
        {usedSolution ? (
          <p className="overlay__note">Você utilizou “Mostrar solução” para completar a partida.</p>
        ) : usedHint ? (
          <p className="overlay__note">Você utilizou uma dica — quase sem ajuda! 👏</p>
        ) : (
          <p className="overlay__note">Sem dicas e sem mostrar a solução. Excelente! 🏆</p>
        )}
        <div className="overlay__actions">
          <button type="button" className="btn btn--primary" onClick={onPlayAgain} data-testid="play-again">
            <span aria-hidden="true">🎮</span> Jogar novamente
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Ver a grade
          </button>
        </div>
      </div>
    </div>
  );
}
