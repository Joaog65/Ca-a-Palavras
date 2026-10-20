import { CATEGORY_BY_ID, DIFFICULTY_BY_ID, ALL_WORDS } from './wordBank';
import { normalize, removeAccents, cellKey } from './normalize';
import type {
  Cell,
  CategoryId,
  Difficulty,
  Direction,
  PlacedWord,
  Round,
} from './types';

/**
 * Motor de geração do caça-palavras.
 *
 * Responsabilidades:
 *  - sortear palavras da categoria de acordo com a dificuldade;
 *  - posicioná-las na grade nas 8 direções sem sobreposição inválida;
 *  - completar os espaços vazios com letras aleatórias;
 *  - garantir que toda palavra da lista esteja realmente presente na grade.
 */

/** As oito direções de leitura (em ordem: norte, norte-leste, leste, ...). */
export const DIRECTIONS: Direction[] = [
  { row: -1, col: -1 },
  { row: -1, col: 0 },
  { row: -1, col: 1 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
];

/** PRNG determinístico (mulberry32) — usado para repetir partidas nos testes. */
export function createRandom(seed?: number): () => number {
  if (seed === undefined) return Math.random;
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Embaralhamento Fisher-Yates (não muta o array original). */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Alfabeto ponderado para preencher a grade (vogais aparecem mais). */
const FILL_ALPHABET = 'AAAAAAAAAEEEEEEEIIIIOOOOOOUUUBCDFGHJKJKLMNPQRSTVWXYZ';

function randomLetter(random: () => number): string {
  return FILL_ALPHABET[Math.floor(random() * FILL_ALPHABET.length)];
}

/** Rótulo legível para uma direção. */
export function describeDirection(direction: Direction): string {
  const vertical = direction.row === -1 ? 'para cima' : direction.row === 1 ? 'para baixo' : '';
  const horizontal =
    direction.col === -1 ? 'para a esquerda' : direction.col === 1 ? 'para a direita' : '';
  if (vertical && horizontal) return `diagonal ${vertical} e ${horizontal}`;
  return vertical || horizontal || 'horizontal';
}

/**
 * Lê as letras de uma reta a partir de uma célula na direção informada.
 * Retorna null se a reta sair da grade.
 */
export function readLine(
  grid: string[][],
  start: Cell,
  direction: Direction,
  length: number,
): string[] | null {
  const letters: string[] = [];
  for (let i = 0; i < length; i += 1) {
    const row = start.row + direction.row * i;
    const col = start.col + direction.col * i;
    if (row < 0 || row >= grid.length) return null;
    const line = grid[row];
    if (!line || col < 0 || col >= line.length) return null;
    letters.push(line[col]);
  }
  return letters;
}

/**
 * Procura uma palavra na grade, em qualquer uma das 8 direções.
 * Retorna as células da ocorrência ou null.
 */
export function findWordInGrid(grid: string[][], word: string): Cell[] | null {
  const target = normalize(word);
  if (!target) return null;
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      for (const direction of DIRECTIONS) {
        const letters = readLine(grid, { row, col }, direction, target.length);
        if (!letters) continue;
        if (normalize(letters.join('')) === target) {
          return Array.from({ length: target.length }, (_, i) => ({
            row: row + direction.row * i,
            col: col + direction.col * i,
          }));
        }
      }
    }
  }
  return null;
}

/** Grade normalizada (maiúsculas e sem acentos) para buscas rápidas. */
export function normalizeGrid(grid: string[][]): string[][] {
  return grid.map((row) => row.map((letter) => removeAccents(letter).toUpperCase()));
}

/**
 * Encontra todas as ocorrências de um conjunto de palavras na grade.
 * Algoritmo por prefixo: parte de cada célula nas 8 direções e acumula a
 * sequência, verificando a cada passo se ela forma uma palavra conhecida.
 */
export function findAllOccurrences(grid: string[][], words: string[]): Cell[][] {
  const targets = new Map<string, string>();
  for (const word of words) {
    const key = normalize(word);
    if (key.length < 3) continue;
    if (!targets.has(key)) targets.set(key, word);
  }
  if (targets.size === 0) return [];

  const normalized = normalizeGrid(grid);
  const maxLength = Math.max(...Array.from(targets.keys()).map((key) => key.length));
  const occurrences: Cell[][] = [];

  for (let row = 0; row < normalized.length; row += 1) {
    for (let col = 0; col < normalized[row].length; col += 1) {
      for (const direction of DIRECTIONS) {
        let sequence = '';
        for (let step = 0; step < maxLength; step += 1) {
          const r = row + direction.row * step;
          const c = col + direction.col * step;
          if (r < 0 || r >= normalized.length) break;
          const line = normalized[r];
          if (!line || c < 0 || c >= line.length) break;
          sequence += line[c];
          if (targets.has(sequence)) {
            occurrences.push(
              Array.from({ length: sequence.length }, (_, i) => ({
                row: row + direction.row * i,
                col: col + direction.col * i,
              })),
            );
          }
        }
      }
    }
  }
  return occurrences;
}

/** Opções de geração de uma partida. */
export interface GenerateRoundOptions {
  category: CategoryId;
  difficulty: Difficulty;
  /** Semente opcional para gerar partidas reprodutíveis (útil nos testes). */
  seed?: number;
  /** Quantidade de palavras forçada (usada nos testes). */
  wordCount?: number;
}

/** Sorteia as palavras da rodada conforme a dificuldade. */
export function pickWords(
  category: CategoryId,
  difficulty: Difficulty,
  random: () => number = Math.random,
  forcedCount?: number,
): string[] {
  const config = DIFFICULTY_BY_ID[difficulty];
  const all = CATEGORY_BY_ID[category].words.filter((word) => word.length <= config.maxWordLength);

  // Remove duplicatas (ignorando acentos) mantendo a primeira ocorrência.
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const word of all) {
    const key = normalize(word);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(word);
    }
  }

  const wanted = Math.min(forcedCount ?? config.wordCount, unique.length);
  const pool = [...unique];

  if (difficulty === 'facil') {
    // Palavras mais curtas primeiro (com um pouco de variedade para não ficar repetitivo).
    const shortLimit = Math.min(6, config.maxWordLength);
    pool.sort((a, b) => a.length - b.length || a.localeCompare(b, 'pt-BR'));
    const short = pool.filter((word) => word.length <= shortLimit);
    const rest = pool.filter((word) => word.length > shortLimit);
    const chosen = shuffle(short, random).slice(0, wanted);
    const remaining = Math.max(0, wanted - chosen.length);
    return [...chosen, ...shuffle(rest, random).slice(0, remaining)];
  }

  if (difficulty === 'dificil') {
    // Prefere palavras longas para aumentar a dificuldade.
    pool.sort((a, b) => b.length - a.length || a.localeCompare(b, 'pt-BR'));
    const long = pool.filter((word) => word.length >= 6);
    const rest = pool.filter((word) => word.length < 6);
    const chosen = shuffle(long, random).slice(0, wanted);
    const remaining = Math.max(0, wanted - chosen.length);
    return [...chosen, ...shuffle(rest, random).slice(0, remaining)];
  }

  return shuffle(pool, random).slice(0, wanted);
}

/** Resultado interno da tentativa de posicionamentos. */
interface Placement {
  cells: Cell[];
  direction: Direction;
}

/**
 * Tenta posicionar uma palavra na grade.
 * Uma posição é válida quando todas as células estão dentro da grade e cada
 * célula está vazia ou já contém a mesma letra (ignorando acentos) — o que
 * permite palavras que compartilham letras.
 */
function tryPlace(
  grid: (string | null)[][],
  word: string,
  random: () => number,
): Placement | null {
  const size = grid.length;
  const normalized = normalize(word);
  const length = normalized.length;
  if (length > size) return null;

  for (let attempt = 0; attempt < 400; attempt += 1) {
    const direction = DIRECTIONS[Math.floor(random() * DIRECTIONS.length)];

    // Faixa válida da célula inicial em cada eixo, conforme o sentido da direção.
    const rowFrom = direction.row >= 0 ? 0 : length - 1;
    const rowTo = direction.row >= 0 ? size - length : size - 1;
    const colFrom = direction.col >= 0 ? 0 : length - 1;
    const colTo = direction.col >= 0 ? size - length : size - 1;
    if (rowFrom > rowTo || colFrom > colTo) continue;

    const startRow = rowFrom + Math.floor(random() * (rowTo - rowFrom + 1));
    const startCol = colFrom + Math.floor(random() * (colTo - colFrom + 1));

    const cells: Cell[] = [];
    let valid = true;
    for (let i = 0; i < length; i += 1) {
      const row = startRow + direction.row * i;
      const col = startCol + direction.col * i;
      const existing = grid[row]?.[col];
      if (existing !== null && existing !== undefined && normalize(existing) !== normalized[i]) {
        valid = false;
        break;
      }
      cells.push({ row, col });
    }
    if (valid) return { cells, direction };
  }
  return null;
}

/** Verifica se todas as palavras da lista estão realmente presentes na grade. */
export function verifyRound(round: Round): boolean {
  for (const word of round.words) {
    const letters = word.cells.map((cell) => round.grid[cell.row]?.[cell.col] ?? '');
    if (letters.length !== normalize(word.text).length) return false;
    if (normalize(letters.join('')) !== normalize(word.text)) return false;
  }
  return true;
}

/** Resultado de uma tentativa completa de posicionamentos. */
interface PlacementResult {
  grid: (string | null)[][];
  placed: { text: string; cells: Cell[]; direction: Direction }[];
}

/** Tenta posicionar todas as palavras de uma lista de uma só vez. */
function placeAll(words: string[], size: number, random: () => number): PlacementResult | null {
  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  );
  const placed: { text: string; cells: Cell[]; direction: Direction }[] = [];

  for (const text of words) {
    const placement = tryPlace(grid, text, random);
    if (!placement) return null;
    for (let i = 0; i < placement.cells.length; i += 1) {
      const cell = placement.cells[i];
      // Preserva a letra já existente (pode estar acentuada por outra palavra).
      if (grid[cell.row][cell.col] === null) grid[cell.row][cell.col] = text[i];
    }
    placed.push({ text, cells: placement.cells, direction: placement.direction });
  }

  return { grid, placed };
}

/**
 * Gera uma partida completa: grade, palavras posicionadas e lista de palavras.
 * A lista retornada contém exatamente as palavras presentes na grade.
 */
export function generateRound(options: GenerateRoundOptions): Round {
  const random = createRandom(options.seed);
  const config = DIFFICULTY_BY_ID[options.difficulty];
  const size = config.size;

  const words = pickWords(options.category, options.difficulty, random, options.wordCount);
  // Do maior para o menor: palavras longas são mais difíceis de encaixar.
  let ordered = [...words].sort((a, b) => normalize(b).length - normalize(a).length);

  // Tenta várias vezes com todas as palavras; se ainda assim não couber,
  // descarta a palavra mais longa e tenta novamente (a lista acompanha a grade).
  for (let round = 0; round < 3; round += 1) {
    const result = placeAll(ordered, size, random);
    if (result) {
      const built = buildRound(result, size, options, random);
      if (verifyRound(built)) return built;
    }
  }

  while (ordered.length > 1) {
    ordered = ordered.slice(0, -1);
    const result = placeAll(ordered, size, random);
    if (!result) continue;
    const built = buildRound(result, size, options, random);
    if (verifyRound(built)) return built;
  }

  return generateFallbackRound(options, size);
}

/** Monta a rodada final a partir dos posicionamentos (preenchimento + limpeza). */
function buildRound(
  result: PlacementResult,
  size: number,
  options: GenerateRoundOptions,
  random: () => number,
): Round {
  // Completa os espaços vazios com letras aleatórias.
  const filled: string[][] = result.grid.map((row) =>
    row.map((cell) => cell ?? randomLetter(random)),
  );

  const locked = new Set<string>();
  for (const word of result.placed) {
    for (const cell of word.cells) locked.add(cellKey(cell.row, cell.col));
  }

  removeAccidentalWords(filled, locked, random);

  return {
    id: 0,
    size,
    grid: filled,
    words: result.placed
      .map<PlacedWord>((word, index) => ({
        id: `w${index}`,
        text: word.text,
        cells: word.cells,
        direction: word.direction,
        category: options.category,
      }))
      .sort((a, b) => a.text.localeCompare(b.text, 'pt-BR')),
    category: options.category,
    difficulty: options.difficulty,
  };
}

/**
 * Remove palavras do banco que surgiram "por acaso" no preenchimento,
 * para que o jogador nunca encontre uma palavra que não está na lista.
 * Só células livres (fora das palavras posicionadas) podem ser alteradas.
 */
function removeAccidentalWords(
  grid: string[][],
  locked: Set<string>,
  random: () => number,
): void {
  const bank = ALL_WORDS;
  const maxPasses = 20;

  for (let pass = 0; pass < maxPasses; pass += 1) {
    const occurrences = findAllOccurrences(grid, bank);
    let changed = false;

    for (const occurrence of occurrences) {
      const freeCells = occurrence.filter((cell) => !locked.has(cellKey(cell.row, cell.col)));
      if (freeCells.length === 0) continue; // faz parte de uma palavra posicionada
      const target = freeCells[Math.floor(random() * freeCells.length)];
      const current = grid[target.row][target.col];
      const alternatives = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(
        (letter) => letter !== current,
      );
      grid[target.row][target.col] = alternatives[Math.floor(random() * alternatives.length)];
      changed = true;
    }

    if (!changed) break;
  }
}

/** Partida mínima usada apenas em caso de falha extrema da geração. */
function generateFallbackRound(options: GenerateRoundOptions, size: number): Round {
  const random = createRandom(options.seed);
  const text = 'ESCOLA';
  const grid: string[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => randomLetter(random)),
  );
  const cells: Cell[] = Array.from({ length: text.length }, (_, i) => ({ row: 0, col: i }));
  cells.forEach((cell, i) => {
    grid[cell.row][cell.col] = text[i];
  });
  return {
    id: 0,
    size,
    grid,
    words: [
      {
        id: 'w0',
        text,
        cells,
        direction: { row: 0, col: 1 },
        category: options.category,
      },
    ],
    category: options.category,
    difficulty: options.difficulty,
  };
}
