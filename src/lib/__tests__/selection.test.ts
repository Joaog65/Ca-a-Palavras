import { describe, expect, it } from 'vitest';
import { projectSelection, selectionText, straightPath } from '../selection';

describe('straightPath', () => {
  it('devolve o caminho horizontal para a direita', () => {
    expect(straightPath({ row: 2, col: 1 }, { row: 2, col: 4 })).toEqual([
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
    ]);
  });

  it('devolve o caminho horizontal para a esquerda', () => {
    expect(straightPath({ row: 2, col: 4 }, { row: 2, col: 1 })).toEqual([
      { row: 2, col: 4 },
      { row: 2, col: 3 },
      { row: 2, col: 2 },
      { row: 2, col: 1 },
    ]);
  });

  it('devolve o caminho vertical para baixo e para cima', () => {
    expect(straightPath({ row: 0, col: 3 }, { row: 3, col: 3 })).toHaveLength(4);
    expect(straightPath({ row: 3, col: 3 }, { row: 0, col: 3 })).toHaveLength(4);
  });

  it('devolve o caminho nas duas diagonais', () => {
    expect(straightPath({ row: 0, col: 0 }, { row: 3, col: 3 })).toEqual([
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 3 },
    ]);
    expect(straightPath({ row: 0, col: 3 }, { row: 3, col: 0 })).toEqual([
      { row: 0, col: 3 },
      { row: 1, col: 2 },
      { row: 2, col: 1 },
      { row: 3, col: 0 },
    ]);
  });

  it('devolve null quando as células não estão alinhadas', () => {
    expect(straightPath({ row: 0, col: 0 }, { row: 2, col: 3 })).toBeNull();
  });

  it('devolve a própria célula quando são iguais', () => {
    expect(straightPath({ row: 1, col: 1 }, { row: 1, col: 1 })).toEqual([{ row: 1, col: 1 }]);
  });
});

describe('projectSelection', () => {
  it('mantém a âncora quando o alvo é a própria âncora', () => {
    expect(projectSelection({ row: 4, col: 4 }, { row: 4, col: 4 }, 12)).toEqual([{ row: 4, col: 4 }]);
  });

  it('projeta um arrasto diagonal imperfeito na diagonal', () => {
    const path = projectSelection({ row: 0, col: 0 }, { row: 3, col: 3 }, 12);
    expect(path).toHaveLength(4);
    expect(path[3]).toEqual({ row: 3, col: 3 });
  });

  it('projeta um arrasto quase horizontal na horizontal', () => {
    const path = projectSelection({ row: 2, col: 0 }, { row: 2, col: 5 }, 12);
    expect(path).toHaveLength(6);
    expect(path.every((cell) => cell.row === 2)).toBe(true);
  });

  it('projeta um arrasto quase vertical na vertical', () => {
    const path = projectSelection({ row: 0, col: 4 }, { row: 4, col: 4 }, 12);
    expect(path).toHaveLength(5);
    expect(path.every((cell) => cell.col === 4)).toBe(true);
  });

  it('nunca sai dos limites da grade', () => {
    const path = projectSelection({ row: 9, col: 9 }, { row: 11, col: 11 }, 12);
    for (const cell of path) {
      expect(cell.row).toBeLessThanOrEqual(11);
      expect(cell.col).toBeLessThanOrEqual(11);
      expect(cell.row).toBeGreaterThanOrEqual(0);
      expect(cell.col).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('selectionText', () => {
  it('lê as letras da grade ignorando acentos', () => {
    const grid = [
      ['M', 'A', 'T'],
      ['X', 'Á', 'L'],
    ];
    expect(selectionText(grid, [{ row: 1, col: 1 }, { row: 1, col: 2 }])).toBe('AL');
  });

  it('devolve string vazia para células fora da grade', () => {
    const grid = [['A']];
    expect(selectionText(grid, [{ row: 5, col: 5 }])).toBe('');
  });
});
