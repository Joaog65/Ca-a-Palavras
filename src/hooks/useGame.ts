import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ALL_WORDS } from '../lib/wordBank';
import { generateRound } from '../lib/wordSearch';
import { selectionText } from '../lib/selection';
import { cellKey, normalize } from '../lib/normalize';
import type {
  Cell,
  CategoryId,
  ColorId,
  Difficulty,
  FoundWord,
  Round,
  ToastMessage,
} from '../lib/types';

/**
 * Estado e ações do jogo.
 *
 * Toda a lógica de partida fica aqui (fora dos componentes), de modo que a
 * interface seja apenas uma projeção do estado.
 */

const STORAGE_KEY = 'caca-palavras-escolar:prefs';

export interface Preferences {
  color: ColorId;
  category: CategoryId;
  difficulty: Difficulty;
}

export interface GameState {
  round: Round;
  roundNumber: number;
  found: Record<string, FoundWord>;
  color: ColorId;
  category: CategoryId;
  difficulty: Difficulty;
  status: 'playing' | 'won';
  solutionShown: boolean;
  /** Verdadeiro quando o jogador já pediu pelo menos uma dica. */
  usedHint: boolean;
  hint: Cell | null;
  /** Incrementado a cada seleção inválida (dispara a animação de "erro"). */
  shake: number;
}

type Action =
  | { type: 'newRound'; round: Round; category: CategoryId; difficulty: Difficulty }
  | { type: 'restart' }
  | { type: 'found'; wordId: string; cells: Cell[]; color: ColorId }
  | { type: 'revealAll'; color: ColorId }
  | { type: 'setColor'; color: ColorId }
  | { type: 'hint'; cell: Cell }
  | { type: 'clearHint' }
  | { type: 'invalid' };

function readPreferences(): Preferences {
  const fallback: Preferences = {
    color: 'amarelo',
    category: 'materiais',
    difficulty: 'facil',
  };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      color: parsed.color ?? fallback.color,
      category: parsed.category ?? fallback.category,
      difficulty: parsed.difficulty ?? fallback.difficulty,
    };
  } catch {
    return fallback;
  }
}

function writePreferences(prefs: Preferences): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* modo privativo: apenas ignora */
  }
}

function createInitialState(): GameState {
  const prefs = readPreferences();
  const round = generateRound({
    category: prefs.category,
    difficulty: prefs.difficulty,
  });
  return {
    round: { ...round, id: 1 },
    roundNumber: 1,
    found: {},
    color: prefs.color,
    category: prefs.category,
    difficulty: prefs.difficulty,
    status: 'playing',
    solutionShown: false,
    usedHint: false,
    hint: null,
    shake: 0,
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'newRound':
      return {
        ...state,
        round: { ...action.round, id: state.roundNumber + 1 },
        roundNumber: state.roundNumber + 1,
        found: {},
        category: action.category,
        difficulty: action.difficulty,
        status: 'playing',
        solutionShown: false,
        usedHint: false,
        hint: null,
      };

    case 'restart':
      return {
        ...state,
        found: {},
        status: 'playing',
        solutionShown: false,
        usedHint: false,
        hint: null,
      };

    case 'found': {
      if (state.found[action.wordId]) return state;
      const found = {
        ...state.found,
        [action.wordId]: {
          wordId: action.wordId,
          cells: action.cells,
          color: action.color,
          revealed: false,
        },
      };
      const complete = Object.keys(found).length === state.round.words.length;
      return { ...state, found, status: complete ? 'won' : 'playing' };
    }

    case 'revealAll': {
      const found: Record<string, FoundWord> = { ...state.found };
      for (const word of state.round.words) {
        if (found[word.id]) continue;
        found[word.id] = {
          wordId: word.id,
          cells: word.cells,
          color: action.color,
          revealed: true,
        };
      }
      return { ...state, found, status: 'won', solutionShown: true };
    }

    case 'setColor':
      return { ...state, color: action.color };

    case 'hint':
      return { ...state, hint: action.cell, usedHint: true };

    case 'clearHint':
      return { ...state, hint: null };

    case 'invalid':
      return { ...state, shake: state.shake + 1 };

    default:
      return state;
  }
}

/** Resultado da validação de uma seleção. */
export type SelectionOutcome = 'found' | 'already-found' | 'not-in-list' | 'invalid';

export interface CellMark {
  color: ColorId;
  revealed: boolean;
  wordId: string;
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const hintTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(toastTimer.current);
      window.clearTimeout(hintTimer.current);
    },
    [],
  );

  useEffect(() => {
    writePreferences({ color: state.color, category: state.category, difficulty: state.difficulty });
  }, [state.color, state.category, state.difficulty]);

  const notify = useCallback((text: string, tone: ToastMessage['tone']) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, tone });
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  /** Cria uma nova partida (nova grade e nova lista de palavras). */
  const newGame = useCallback(
    (category: CategoryId = state.category, difficulty: Difficulty = state.difficulty) => {
      const round = generateRound({ category, difficulty });
      dispatch({ type: 'newRound', round, category, difficulty });
      notify('Nova partida gerada! Boa sorte!', 'info');
    },
    [state.category, state.difficulty, notify],
  );

  /** Limpa as marcações, mantendo a mesma grade e a mesma lista de palavras. */
  const restart = useCallback(() => {
    dispatch({ type: 'restart' });
    notify('Partida reiniciada. As marcações foram limpas.', 'info');
  }, [notify]);

  /** Troca a cor do marca-texto (as palavras já encontradas mantêm a cor original). */
  const setColor = useCallback((color: ColorId) => {
    dispatch({ type: 'setColor', color });
  }, []);

  /** Troca a categoria e gera uma nova partida. */
  const changeCategory = useCallback(
    (category: CategoryId) => {
      if (category === state.category) return;
      const round = generateRound({ category, difficulty: state.difficulty });
      dispatch({ type: 'newRound', round, category, difficulty: state.difficulty });
      notify('Categoria alterada. Nova partida gerada!', 'info');
    },
    [state.category, state.difficulty, notify],
  );

  /** Troca a dificuldade e gera uma nova partida. */
  const changeDifficulty = useCallback(
    (difficulty: Difficulty) => {
      if (difficulty === state.difficulty) return;
      const round = generateRound({ category: state.category, difficulty });
      dispatch({ type: 'newRound', round, category: state.category, difficulty });
      notify('Dificuldade alterada. Nova partida gerada!', 'info');
    },
    [state.category, state.difficulty, notify],
  );

  /**
   * Valida a seleção do jogador.
   * Retorna o resultado para que a interface possa animar conforme o caso.
   */
  const submitSelection = useCallback(
    (cells: Cell[]): SelectionOutcome => {
      if (cells.length === 0) return 'invalid';
      const text = selectionText(state.round.grid, cells);
      if (!text) return 'invalid';

      const match = state.round.words.find((word) => normalize(word.text) === text);
      if (match) {
        if (state.found[match.id]) {
          notify(`${match.text} já foi encontrada! Que tal outra?`, 'info');
          return 'already-found';
        }
        dispatch({ type: 'found', wordId: match.id, cells, color: state.color });
        notify(`🎉 Você encontrou ${match.text}!`, 'success');
        return 'found';
      }

      const outside = ALL_WORDS.find((word) => normalize(word) === text);
      if (outside) {
        dispatch({ type: 'invalid' });
        notify(`${outside} não faz parte da lista desta partida.`, 'error');
        return 'not-in-list';
      }

      dispatch({ type: 'invalid' });
      notify('Essa seleção não formou uma palavra da lista.', 'error');
      return 'invalid';
    },
    [state.round, state.found, state.color, notify],
  );

  /** Destaca temporariamente uma letra de uma palavra ainda não encontrada. */
  const requestHint = useCallback(() => {
    const remaining = state.round.words.filter((word) => !state.found[word.id]);
    if (remaining.length === 0) {
      notify('Todas as palavras já foram encontradas!', 'info');
      return;
    }
    const word = remaining[Math.floor(Math.random() * remaining.length)];
    const cell = word.cells[Math.floor(Math.random() * word.cells.length)];
    dispatch({ type: 'hint', cell });
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => dispatch({ type: 'clearHint' }), 2800);
    notify('Dica: uma letra da próxima palavra está piscando.', 'info');
  }, [state.round.words, state.found, notify]);

  /** Revela todas as palavras restantes com marcações distintas. */
  const revealSolution = useCallback(() => {
    dispatch({ type: 'revealAll', color: state.color });
    notify('Solução revelada!', 'info');
  }, [state.color, notify]);

  /** Avisa que uma seleção não fez sentido (células não alinhadas). */
  const reportInvalid = useCallback(() => {
    dispatch({ type: 'invalid' });
    notify('As letras precisam estar em linha reta.', 'error');
  }, [notify]);

  /** Mapa de marcações por célula (para colorir a grade). */
  const cellMarks = useMemo(() => {
    const map = new Map<string, CellMark>();
    for (const foundWord of Object.values(state.found)) {
      for (const cell of foundWord.cells) {
        const key = cellKey(cell.row, cell.col);
        if (!map.has(key)) {
          map.set(key, {
            color: foundWord.color,
            revealed: foundWord.revealed,
            wordId: foundWord.wordId,
          });
        }
      }
    }
    return map;
  }, [state.found]);

  const foundCount = Object.keys(state.found).length;
  const totalWords = state.round.words.length;
  const progress = totalWords === 0 ? 0 : foundCount / totalWords;

  return {
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
    notify,
  };
}
