import { describe, expect, it } from 'vitest';
import {
  DIRECTIONS,
  findAllOccurrences,
  findWordInGrid,
  generateRound,
  pickWords,
  verifyRound,
} from '../wordSearch';
import { CATEGORIES, DIFFICULTIES } from '../wordBank';
import { normalize } from '../normalize';
import type { Cell } from '../types';

/** Constrói uma grade vazia com o tamanho informado. */
function emptyGrid(size: number): string[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => '.'));
}

/** Escreve um texto na grade a partir de uma célula e direção. */
function writeWord(
  grid: string[][],
  text: string,
  start: Cell,
  direction: { row: number; col: number },
): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const row = start.row + direction.row * i;
    const col = start.col + direction.col * i;
    grid[row][col] = text[i];
    cells.push({ row, col });
  }
  return cells;
}

describe('busca nas 8 direções', () => {
  it('encontra a palavra em cada uma das oito direções', () => {
    const word = 'ESCOLA';
    for (const direction of DIRECTIONS) {
      const grid = emptyGrid(12);
      // Começa de um lado que garanta que a palavra caiba na grade.
      const start = {
        row: direction.row < 0 ? 8 : 2,
        col: direction.col < 0 ? 8 : 2,
      };
      const cells = writeWord(grid, word, start, direction);
      const found = findWordInGrid(grid, word);
      expect(found, `direção ${JSON.stringify(direction)}`).not.toBeNull();
      expect(found?.map((cell) => `${cell.row},${cell.col}`)).toEqual(
        cells.map((cell) => `${cell.row},${cell.col}`),
      );
    }
  });

  it('encontra palavras com acentos ignorando a acentuação da grade', () => {
    const grid = emptyGrid(14);
    writeWord(grid, 'MATEMÁTICA', { row: 2, col: 1 }, { row: 0, col: 1 });
    expect(findWordInGrid(grid, 'MATEMATICA')).not.toBeNull();
    expect(findWordInGrid(grid, 'MATEMÁTICA')).not.toBeNull();

    const grid2 = emptyGrid(14);
    writeWord(grid2, 'MATEMATICA', { row: 2, col: 1 }, { row: 0, col: 1 });
    expect(findWordInGrid(grid2, 'MATEMÁTICA')).not.toBeNull();
  });

  it('não encontra palavras que não estão na grade', () => {
    const grid = emptyGrid(10);
    writeWord(grid, 'LAPIS', { row: 0, col: 0 }, { row: 0, col: 1 });
    expect(findWordInGrid(grid, 'BORRACHA')).toBeNull();
  });

  it('encontra palavras que compartilham letras', () => {
    const grid = emptyGrid(12);
    // "CASA" na horizontal e "SALA" na vertical compartilhando o "S" central.
    const casa = writeWord(grid, 'CASA', { row: 4, col: 2 }, { row: 0, col: 1 });
    const sala = writeWord(grid, 'SALA', { row: 4, col: 4 }, { row: 1, col: 0 });
    expect(casa[2]).toEqual(sala[0]);
    expect(findWordInGrid(grid, 'CASA')).not.toBeNull();
    expect(findWordInGrid(grid, 'SALA')).not.toBeNull();
  });

  it('findAllOccurrences devolve todas as ocorrências', () => {
    const grid = emptyGrid(10);
    writeWord(grid, 'LIVRO', { row: 0, col: 0 }, { row: 0, col: 1 });
    writeWord(grid, 'LIVRO', { row: 5, col: 2 }, { row: 0, col: 1 });
    expect(findAllOccurrences(grid, ['LIVRO'])).toHaveLength(2);
  });
});

describe('geração automática da grade', () => {
  for (const category of CATEGORIES) {
    for (const difficulty of DIFFICULTIES) {
      it(`gera uma partida válida — ${category.label} / ${difficulty.label}`, () => {
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const round = generateRound({
            category: category.id,
            difficulty: difficulty.id,
            seed: attempt * 977 + 13,
          });

          // Todas as palavras da lista existem de fato na grade.
          expect(verifyRound(round)).toBe(true);
          for (const word of round.words) {
            const found = findWordInGrid(round.grid, word.text);
            expect(found, `palavra ${word.text} ausente na grade`).not.toBeNull();
            const letters = word.cells.map((cell) => round.grid[cell.row][cell.col]);
            expect(normalize(letters.join(''))).toBe(normalize(word.text));
          }

          // Sem palavras duplicadas na mesma rodada.
          const normalized = round.words.map((word) => normalize(word.text));
          expect(new Set(normalized).size).toBe(normalized.length);

          // Tamanho da grade e limite de palavras coerentes com a dificuldade.
          expect(round.size).toBe(difficulty.size);
          expect(round.words.length).toBeLessThanOrEqual(difficulty.wordCount);
          expect(round.words.length).toBeGreaterThan(0);

          // Todas as palavras pertencem à categoria escolhida.
          const categoryWords = new Set(category.words.map((word) => normalize(word)));
          for (const word of round.words) {
            expect(categoryWords.has(normalize(word.text))).toBe(true);
          }
        }
      });
    }
  }

  it('posiciona as palavras nas oito direções ao longo de várias partidas', () => {
    const usedDirections = new Set<string>();
    for (let seed = 0; seed < 40; seed += 1) {
      const round = generateRound({ category: 'variadas', difficulty: 'dificil', seed });
      for (const word of round.words) {
        usedDirections.add(`${word.direction.row},${word.direction.col}`);
      }
    }
    // As 8 direções devem aparecer em alguma partida.
    expect(usedDirections.size).toBe(8);
  });

  it('gera palavras diferentes entre partidas', () => {
    const first = generateRound({ category: 'materiais', difficulty: 'medio', seed: 1 });
    const second = generateRound({ category: 'materiais', difficulty: 'medio', seed: 2 });
    const firstKey = first.words.map((word) => word.cells.map((c) => `${c.row},${c.col}`).join('-'));
    const secondKey = second.words.map((word) => word.cells.map((c) => `${c.row},${c.col}`).join('-'));
    expect(firstKey.join('|')).not.toBe(secondKey.join('|'));
  });

  it('respeita o limite de comprimento de palavra da dificuldade', () => {
    const facil = pickWords('disciplinas', 'facil');
    for (const word of facil) expect(word.length).toBeLessThanOrEqual(7);

    const medio = pickWords('disciplinas', 'medio');
    for (const word of medio) expect(word.length).toBeLessThanOrEqual(9);
  });

  it('prioriza palavras curtas no nível fácil', () => {
    const words = pickWords('materiais', 'facil', Math.random, 5);
    const average = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    expect(average).toBeLessThanOrEqual(6.5);
  });

  it('evita que letras aleatórias formem palavras do banco fora da lista', () => {
    const bank = CATEGORIES.flatMap((category) => category.words);
    let accidents = 0;
    const rounds = 12;
    for (let seed = 0; seed < rounds; seed += 1) {
      const round = generateRound({ category: 'materiais', difficulty: 'medio', seed: seed * 31 });
      const list = new Set(round.words.map((word) => normalize(word.text)));
      for (const occurrence of findAllOccurrences(round.grid, bank)) {
        const letters = occurrence.map((cell) => round.grid[cell.row][cell.col]).join('');
        if (!list.has(normalize(letters))) accidents += 1;
      }
    }
    // No máximo ~1 palavra acidental por partida (o jogo limpa o que consegue).
    expect(accidents).toBeLessThanOrEqual(rounds);
  });

  it('gera palavras que compartilham letras entre si', () => {
    let shared = 0;
    for (let seed = 0; seed < 20; seed += 1) {
      const round = generateRound({ category: 'variadas', difficulty: 'medio', seed: seed * 17 });
      const occupied = new Map<string, string>();
      for (const word of round.words) {
        for (const cell of word.cells) {
          const key = `${cell.row},${cell.col}`;
          const owner = occupied.get(key);
          if (owner && owner !== word.id) shared += 1;
          else occupied.set(key, word.id);
        }
      }
    }
    expect(shared).toBeGreaterThan(0);
  });
});
