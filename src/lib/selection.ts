import { DIRECTIONS } from './wordSearch';
import { normalize } from './normalize';
import type { Cell, Direction } from './types';

/**
 * Lógica de seleção de letras.
 *
 * Toda a interação (mouse, toque ou teclado) converte a escolha do jogador em
 * uma sequência de células em linha reta, usando uma das 8 direções.
 */

/** Retorna a direção normalizada entre duas células (ou null se coincidirem). */
export function directionBetween(from: Cell, to: Cell): Direction | null {
  const dr = Math.sign(to.row - from.row);
  const dc = Math.sign(to.col - from.col);
  if (dr === 0 && dc === 0) return null;
  return { row: dr, col: dc };
}

/**
 * Caminho exato entre duas células, somente se elas estiverem alinhadas
 * horizontalmente, verticalmente ou na diagonal (passo de 1).
 */
export function straightPath(from: Cell, to: Cell): Cell[] | null {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  if (dr === 0 && dc === 0) return [from];

  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  if (Math.abs(dr) !== Math.abs(dc) && dr !== 0 && dc !== 0) return null;

  const direction = { row: Math.sign(dr), col: Math.sign(dc) };
  const cells: Cell[] = [];
  for (let i = 0; i <= steps; i += 1) {
    cells.push({ row: from.row + direction.row * i, col: from.col + direction.col * i });
  }
  return cells;
}

/**
 * Projeta o alvo na reta mais próxima da âncora, entre as 8 direções possíveis.
 * É o que faz o arraste "puxar" a seleção para uma linha reta, mesmo quando o
 * dedo do jogador não percorre exatamente a linha da palavra.
 */
export function projectSelection(anchor: Cell, target: Cell, size: number): Cell[] {
  if (anchor.row === target.row && anchor.col === target.col) return [anchor];

  const dr = target.row - anchor.row;
  const dc = target.col - anchor.col;

  let best: { direction: Direction; distance: number; projection: number } | null = null;

  for (const direction of DIRECTIONS) {
    const denom = direction.row * direction.row + direction.col * direction.col;
    // "projection" é o número de passos ao longo da direção.
    const projection = (dr * direction.row + dc * direction.col) / denom;
    if (projection <= 0) continue; // o alvo está "atrás" da âncora nesta direção
    // Distância perpendicular (em células) do alvo até a reta da direção.
    const distance =
      Math.abs(dr * direction.col - dc * direction.row) / Math.sqrt(denom);
    const better =
      !best ||
      distance < best.distance ||
      (distance === best.distance && projection > best.projection);
    if (better) best = { direction, distance, projection };
  }

  if (!best) return [anchor];

  // Quantas células ainda cabem na grade a partir da âncora, nesta direção.
  const rowLimit =
    best.direction.row > 0
      ? size - 1 - anchor.row
      : best.direction.row < 0
        ? anchor.row
        : Number.POSITIVE_INFINITY;
  const colLimit =
    best.direction.col > 0
      ? size - 1 - anchor.col
      : best.direction.col < 0
        ? anchor.col
        : Number.POSITIVE_INFINITY;
  const maxSteps = Math.min(rowLimit, colLimit);
  const steps = Math.max(0, Math.min(Math.round(best.projection), maxSteps));

  const cells: Cell[] = [];
  for (let i = 0; i <= steps; i += 1) {
    cells.push({
      row: anchor.row + best.direction.row * i,
      col: anchor.col + best.direction.col * i,
    });
  }
  return cells;
}

/** Lê o texto (sem acentos, em maiúsculas) de uma sequência de células. */
export function selectionText(grid: string[][], cells: Cell[]): string {
  return normalize(
    cells
      .map((cell) => grid[cell.row]?.[cell.col] ?? '')
      .join(''),
  );
}

/** Chave estável para comparar dois conjuntos de células. */
export function cellsKey(cells: Cell[]): string {
  return cells.map((cell) => `${cell.row},${cell.col}`).join('|');
}

/** Verifica se dois conjuntos de células são iguais (mesmo conjunto, qualquer ordem). */
export function sameCells(a: Cell[], b: Cell[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(cellsKey(a).split('|'));
  return cellsKey(b).split('|').every((key) => setA.has(key));
}
