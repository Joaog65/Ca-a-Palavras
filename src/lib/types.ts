/**
 * Tipos compartilhados do Caça-Palavras Escolar.
 */

/** Coordenada de uma célula da grade. */
export interface Cell {
  row: number;
  col: number;
}

/** As oito direções possíveis (passos de linha/coluna). */
export interface Direction {
  row: number;
  col: number;
}

/** Nível de dificuldade do jogo. */
export type Difficulty = 'facil' | 'medio' | 'dificil';

/** Identificador de categoria de palavras. */
export type CategoryId =
  | 'materiais'
  | 'disciplinas'
  | 'profissionais'
  | 'espacos'
  | 'atividades'
  | 'variadas';

/** Cores disponíveis para o marca-texto. */
export type ColorId = 'amarelo' | 'verde' | 'azul' | 'rosa' | 'laranja' | 'roxo' | 'vermelho';

/** Uma palavra posicionada na grade. */
export interface PlacedWord {
  /** Identificador estável da palavra dentro da rodada. */
  id: string;
  /** Texto exibido ao jogador, com acentos e maiúsculas. */
  text: string;
  /** Células ocupadas pela palavra, na ordem da leitura. */
  cells: Cell[];
  /** Direção da leitura (a última célula é a ponta). */
  direction: Direction;
  /** Categoria de origem da palavra. */
  category: CategoryId;
}

/** Uma partida (grade + lista de palavras) gerada pelo motor do jogo. */
export interface Round {
  /** Identificador da rodada (incrementa a cada novo jogo). */
  id: number;
  /** Tamanho da grade (linhas x colunas). */
  size: number;
  /** Letras da grade; pode conter acentos nas células de palavras posicionadas. */
  grid: string[][];
  /** Palavras posicionadas (todas realmente presentes na grade). */
  words: PlacedWord[];
  /** Categoria escolhida. */
  category: CategoryId;
  /** Dificuldade escolhida. */
  difficulty: Difficulty;
}

/** Uma palavra encontrada pelo jogador. */
export interface FoundWord {
  /** Id da palavra em `Round.words`. */
  wordId: string;
  /** Cor do marca-texto no momento em que a palavra foi encontrada. */
  color: ColorId;
  /** Células marcadas. */
  cells: Cell[];
  /** Verdadeiro quando a palavra foi revelada por "Mostrar solução". */
  revealed: boolean;
}

/** Configuração de cada nível de dificuldade. */
export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  description: string;
  /** Lado da grade. */
  size: number;
  /** Quantidade de palavras na rodada. */
  wordCount: number;
  /** Comprimento máximo de palavra permitido. */
  maxWordLength: number;
  /** Se true, o embaralhamento usa apenas direções cardeais + diagonais completas. */
  descriptionDirections: string;
}

/** Mensagem temporária exibida ao jogador. */
export interface ToastMessage {
  id: number;
  text: string;
  tone: 'info' | 'success' | 'error';
}
