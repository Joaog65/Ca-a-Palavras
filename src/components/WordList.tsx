import { COLOR_BY_ID, REVEALED_STYLE } from '../lib/colors';
import type { FoundWord, PlacedWord } from '../lib/types';

interface WordListProps {
  words: PlacedWord[];
  found: Record<string, FoundWord>;
  /** Destaca a palavra na grade (opcional). */
  onFocusWord?: (word: PlacedWord | null) => void;
}

/**
 * Lista de palavras da partida.
 * Palavras encontradas ficam riscadas e com um marcador da cor utilizada.
 */
export function WordList({ words, found, onFocusWord }: WordListProps) {
  return (
    <section className="word-list" aria-label="Palavras para encontrar">
      <header className="word-list__header">
        <h2>Palavras para encontrar</h2>
        <span className="word-list__counter">
          {Object.keys(found).length}/{words.length}
        </span>
      </header>
      <ul className="word-list__items">
        {words.map((word) => {
          const foundWord = found[word.id];
          const isFound = Boolean(foundWord);
          const palette = foundWord
            ? foundWord.revealed
              ? REVEALED_STYLE
              : COLOR_BY_ID[foundWord.color]
            : null;
          return (
            <li
              key={word.id}
              className={`word-list__item${isFound ? ' word-list__item--found' : ''}`}
              onMouseEnter={() => onFocusWord?.(word)}
              onMouseLeave={() => onFocusWord?.(null)}
            >
              <span
                className="word-list__dot"
                style={palette ? { backgroundColor: palette.solid } : undefined}
                aria-hidden="true"
              />
              <span className="word-list__text">{word.text}</span>
              {isFound ? (
                <span className="word-list__flag" aria-label={foundWord?.revealed ? 'revelada' : 'encontrada'}>
                  {foundWord?.revealed ? '👁' : '✓'}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
