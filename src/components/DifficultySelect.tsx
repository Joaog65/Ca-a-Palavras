import { DIFFICULTIES } from '../lib/wordBank';
import type { Difficulty } from '../lib/types';

interface DifficultySelectProps {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

/** Escolha da dificuldade (gera uma nova partida). */
export function DifficultySelect({ value, onChange }: DifficultySelectProps) {
  return (
    <div className="select-block">
      <span className="select-block__label" id="difficulty-label">
        <span aria-hidden="true">🎚️</span> Dificuldade
      </span>
      <div className="segmented" role="group" aria-labelledby="difficulty-label">
        {DIFFICULTIES.map((difficulty) => {
          const selected = difficulty.id === value;
          return (
            <button
              key={difficulty.id}
              type="button"
              className={`segmented__button${selected ? ' segmented__button--active' : ''}`}
              onClick={() => onChange(difficulty.id)}
              aria-pressed={selected}
              title={difficulty.description}
              data-testid={`difficulty-${difficulty.id}`}
            >
              {difficulty.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
