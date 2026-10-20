import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from './hooks/useGame';
import { WordSearchGrid } from './components/WordSearchGrid';
import { WordList } from './components/WordList';
import { ColorPicker } from './components/ColorPicker';
import { ControlBar } from './components/ControlBar';
import { CategorySelect } from './components/CategorySelect';
import { DifficultySelect } from './components/DifficultySelect';
import { ProgressBar } from './components/ProgressBar';
import { Toast } from './components/Toast';
import { WinOverlay } from './components/WinOverlay';
import { ConfirmDialog } from './components/ConfirmDialog';
import { CATEGORY_BY_ID, DIFFICULTY_BY_ID } from './lib/wordBank';
import type { CategoryId, Difficulty, PlacedWord } from './lib/types';

/** Ações que podem pedir confirmação antes de apagar o progresso. */
type PendingAction =
  | { type: 'new-game' }
  | { type: 'restart' }
  | { type: 'category'; category: CategoryId }
  | { type: 'difficulty'; difficulty: Difficulty }
  | { type: 'solution' };

export default function App() {
  const {
    state,
    toast,
    foundCount,
    totalWords,
    progress,
    cellMarks,
    newGame,
    restart,
    setColor,
    changeCategory,
    changeDifficulty,
    submitSelection,
    requestHint,
    revealSolution,
    reportInvalid,
  } = useGame();

  const [pending, setPending] = useState<PendingAction | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<CategoryId>(state.category);
  const [focusedWord, setFocusedWord] = useState<PlacedWord | null>(null);
  const [winVisible, setWinVisible] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number>(Date.now());

  // Mantém o select sincronizado com a categoria realmente em uso.
  useEffect(() => {
    setCategoryDraft(state.category);
  }, [state.category]);

  // Cronômetro da partida (reinicia a cada nova grade).
  useEffect(() => {
    startedAtRef.current = Date.now();
    setElapsed(0);
    setWinVisible(false);
  }, [state.round.id]);

  // Mostra a janela de parabéns assim que a partida termina.
  useEffect(() => {
    if (state.status === 'won') {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      setWinVisible(true);
    }
  }, [state.status]);

  const hasProgress = foundCount > 0;

  const runAction = useCallback(
    (action: PendingAction) => {
      switch (action.type) {
        case 'new-game':
          newGame();
          break;
        case 'restart':
          restart();
          break;
        case 'category':
          changeCategory(action.category);
          break;
        case 'difficulty':
          changeDifficulty(action.difficulty);
          break;
        case 'solution':
          revealSolution();
          break;
        default:
          break;
      }
    },
    [changeCategory, changeDifficulty, newGame, restart, revealSolution],
  );

  const askOrRun = useCallback(
    (action: PendingAction) => {
      if (hasProgress) {
        setPending(action);
        return;
      }
      runAction(action);
    },
    [hasProgress, runAction],
  );

  const handleCategoryChange = useCallback(
    (category: CategoryId) => {
      setCategoryDraft(category);
      if (category === state.category) return;
      askOrRun({ type: 'category', category });
    },
    [askOrRun, state.category],
  );

  const handleDifficultyChange = useCallback(
    (difficulty: Difficulty) => {
      if (difficulty === state.difficulty) return;
      askOrRun({ type: 'difficulty', difficulty });
    },
    [askOrRun, state.difficulty],
  );

  const confirm = useCallback(() => {
    if (!pending) return;
    runAction(pending);
    setPending(null);
  }, [pending, runAction]);

  const cancel = useCallback(() => {
    setPending(null);
    setCategoryDraft(state.category);
  }, [state.category]);

  const handleSelect = useCallback(
    (cells: { row: number; col: number }[]) => {
      submitSelection(cells);
    },
    [submitSelection],
  );

  const handleInvalid = useCallback(() => {
    reportInvalid();
  }, [reportInvalid]);

  const highlightCells = useMemo(
    () => (focusedWord ? focusedWord.cells : undefined),
    [focusedWord],
  );

  const categoryInfo = CATEGORY_BY_ID[state.category];
  const difficultyInfo = DIFFICULTY_BY_ID[state.difficulty];

  const confirmContent = useMemo(() => {
    if (!pending) return null;
    switch (pending.type) {
      case 'new-game':
        return {
          title: 'Começar um novo jogo?',
          message:
            'Você já encontrou palavras nesta partida. Ao iniciar um novo jogo, as marcações e o progresso atual serão apagados.',
          confirmLabel: 'Sim, novo jogo',
        };
      case 'restart':
        return {
          title: 'Reiniciar a partida?',
          message:
            'As marcações desta partida serão apagadas, mas a grade e a lista de palavras serão mantidas.',
          confirmLabel: 'Sim, reiniciar',
        };
      case 'category':
        return {
          title: 'Trocar a categoria?',
          message: `A categoria "${CATEGORY_BY_ID[pending.category].label}" vai gerar uma nova partida e apagar o progresso atual (${foundCount} palavra(s) encontrada(s)).`,
          confirmLabel: 'Sim, trocar',
        };
      case 'difficulty':
        return {
          title: 'Trocar a dificuldade?',
          message: `A dificuldade "${DIFFICULTY_BY_ID[pending.difficulty].label}" vai gerar uma nova partida e apagar o progresso atual (${foundCount} palavra(s) encontrada(s)).`,
          confirmLabel: 'Sim, trocar',
        };
      case 'solution':
        return {
          title: 'Mostrar a solução?',
          message:
            'Todas as palavras restantes serão reveladas e a partida será encerrada. Você pode continuar jogando depois.',
          confirmLabel: 'Sim, mostrar',
        };
      default:
        return null;
    }
  }, [pending, foundCount]);

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <span className="app__logo" aria-hidden="true">
            ✏️
          </span>
          <div>
            <h1 className="app__title">Caça-Palavras Escolar</h1>
            <p className="app__subtitle">
              {categoryInfo.emoji} {categoryInfo.label} · Dificuldade {difficultyInfo.label} ·{' '}
              {state.round.size}×{state.round.size}
            </p>
          </div>
        </div>
        <ProgressBar found={foundCount} total={totalWords} progress={progress} />
      </header>

      <main className="app__main">
        <section className="app__play" aria-label="Área de jogo">
          <div className="toolbar">
            <CategorySelect value={categoryDraft} onChange={handleCategoryChange} />
            <DifficultySelect value={state.difficulty} onChange={handleDifficultyChange} />
          </div>

          <ColorPicker value={state.color} onChange={setColor} />

          <ControlBar
            onNewGame={() => askOrRun({ type: 'new-game' })}
            onRestart={() => askOrRun({ type: 'restart' })}
            onHint={requestHint}
            onSolution={() => askOrRun({ type: 'solution' })}
            solutionShown={state.solutionShown}
          />

          <div className="toast-slot">
            <Toast toast={toast} />
          </div>

          <div className="board-wrapper">
            <WordSearchGrid
              grid={state.round.grid}
              size={state.round.size}
              cellMarks={cellMarks}
              hint={state.hint}
              highlight={highlightCells}
              shakeToken={state.shake}
              onSelect={handleSelect}
              onInvalidSelection={handleInvalid}
            />
          </div>

          <p className="board-hint">
            <span aria-hidden="true">👉</span> Clique na primeira letra e arraste até a última (ou
            toque na primeira e depois na última). Funciona nas 8 direções.
          </p>
        </section>

        <aside className="app__side" aria-label="Lista de palavras">
          <WordList
            words={state.round.words}
            found={state.found}
            onFocusWord={setFocusedWord}
          />
        </aside>
      </main>

      <WinOverlay
        open={winVisible}
        found={foundCount}
        total={totalWords}
        elapsedSeconds={elapsed}
        usedHint={state.usedHint}
        usedSolution={state.solutionShown}
        onPlayAgain={() => {
          setWinVisible(false);
          newGame();
        }}
        onClose={() => setWinVisible(false)}
      />

      <ConfirmDialog
        open={Boolean(pending && confirmContent)}
        title={confirmContent?.title ?? ''}
        message={confirmContent?.message ?? ''}
        confirmLabel={confirmContent?.confirmLabel}
        onConfirm={confirm}
        onCancel={cancel}
      />
    </div>
  );
}
