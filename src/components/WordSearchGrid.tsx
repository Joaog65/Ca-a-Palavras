import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { COLOR_BY_ID, REVEALED_STYLE } from '../lib/colors';
import { cellKey } from '../lib/normalize';
import { projectSelection, straightPath } from '../lib/selection';
import type { Cell } from '../lib/types';
import type { CellMark } from '../hooks/useGame';

interface WordSearchGridProps {
  grid: string[][];
  size: number;
  cellMarks: Map<string, CellMark>;
  hint: Cell | null;
  /** Células destacadas (ex.: ao passar o mouse sobre a lista de palavras). */
  highlight?: Cell[];
  /** Muda a cada seleção inválida para disparar a animação de erro. */
  shakeToken: number;
  onSelect: (cells: Cell[]) => void;
  onInvalidSelection: () => void;
}

/**
 * Grade interativa.
 *
 * Funciona igual no mouse e no toque thanks aos Pointer Events:
 *  - toque/clique na primeira letra e arraste até a última (as 8 direções);
 *  - toque/clique na primeira letra e depois na última (modo "toque duplo");
 *  - a seleção é projetada na linha reta mais próxima, então o dedo não
 *    precisa percorrer a palavra exatamente.
 */
export function WordSearchGrid({
  grid,
  size,
  cellMarks,
  hint,
  highlight,
  shakeToken,
  onSelect,
  onInvalidSelection,
}: WordSearchGridProps) {
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [preview, setPreview] = useState<Cell[]>([]);
  const [shaking, setShaking] = useState(false);
  const draggingRef = useRef(false);
  const previewRef = useRef<Cell[]>([]);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const updatePreview = useCallback((path: Cell[]) => {
    previewRef.current = path;
    setPreview(path);
  }, []);

  // Animação de "erro" quando a seleção não forma uma palavra.
  useEffect(() => {
    if (shakeToken === 0) return;
    setShaking(true);
    const timer = window.setTimeout(() => setShaking(false), 420);
    return () => window.clearTimeout(timer);
  }, [shakeToken]);

  const previewSet = useMemo(() => new Set(preview.map((cell) => cellKey(cell.row, cell.col))), [preview]);
  const highlightSet = useMemo(
    () => new Set((highlight ?? []).map((cell) => cellKey(cell.row, cell.col))),
    [highlight],
  );
  const hintKey = hint ? cellKey(hint.row, hint.col) : null;

  const cellFromPoint = useCallback((clientX: number, clientY: number): Cell | null => {
    const element = document.elementFromPoint(clientX, clientY);
    if (!element || !('closest' in element)) return null;
    const cellElement = element.closest('[data-cell]') as HTMLElement | null;
    if (!cellElement) return null;
    const row = Number(cellElement.dataset.row);
    const col = Number(cellElement.dataset.col);
    if (!Number.isFinite(row) || !Number.isFinite(col)) return null;
    return { row, col };
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== undefined && event.button !== 0 && event.pointerType === 'mouse') return;
      const cell = cellFromPoint(event.clientX, event.clientY);
      if (!cell) return;

      event.preventDefault();
      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);

      // Modo "toque/clique duplo": se já existe uma âncora, esta seleção a completa.
      if (anchor) {
        if (anchor.row === cell.row && anchor.col === cell.col) {
          setAnchor(null);
          updatePreview([]);
          return;
        }
        const path = straightPath(anchor, cell);
        if (path) {
          setAnchor(null);
          updatePreview([]);
          onSelect(path);
          return;
        }
        // Não estão alinhados: recomeça a partir desta célula.
        onInvalidSelection();
        setAnchor(cell);
        updatePreview([cell]);
        draggingRef.current = true;
        return;
      }

      setAnchor(cell);
      updatePreview([cell]);
      draggingRef.current = true;
    },
    [anchor, cellFromPoint, onInvalidSelection, onSelect, updatePreview],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || !anchor) return;
      event.preventDefault();
      const cell = cellFromPoint(event.clientX, event.clientY);
      if (!cell) return;
      updatePreview(projectSelection(anchor, cell, size));
    },
    [anchor, cellFromPoint, size, updatePreview],
  );

  const endDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);

      const path = previewRef.current;
      if (path.length > 1) {
        updatePreview([]);
        setAnchor(null);
        onSelect(path);
        return;
      }

      // Toque/clique simples: mantém a âncora para completar com um segundo toque.
      updatePreview([]);
    },
    [onSelect, updatePreview],
  );

  const handlePointerCancel = useCallback(() => {
    draggingRef.current = false;
    updatePreview([]);
  }, [updatePreview]);

  return (
    <div
      ref={boardRef}
      className={`board${shaking ? ' board--shake' : ''}`}
      style={{ '--cols': size } as CSSProperties}
      role="grid"
      aria-label={`Grade do caça-palavras com ${size} linhas e ${size} colunas`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={handlePointerCancel}
      onContextMenu={(event) => event.preventDefault()}
    >
      {grid.map((row, rowIndex) =>
        row.map((letter, colIndex) => {
          const key = cellKey(rowIndex, colIndex);
          const mark = cellMarks.get(key);
          const isSelected = previewSet.has(key);
          const isHint = hintKey === key;

          const style: CSSProperties = {};
          if (mark) {
            const palette = mark.revealed ? REVEALED_STYLE : COLOR_BY_ID[mark.color];
            style.backgroundColor = palette.fill;
            style.borderColor = palette.solid;
          }

          const classes = ['cell'];
          if (mark) classes.push('cell--marked');
          if (mark?.revealed) classes.push('cell--revealed');
          if (isSelected) classes.push('cell--selected');
          if (highlightSet.has(key)) classes.push('cell--highlight');
          if (isHint) classes.push('cell--hint');

          return (
            <div
              key={key}
              className={classes.join(' ')}
              data-cell="true"
              data-row={rowIndex}
              data-col={colIndex}
              data-testid={`cell-${rowIndex}-${colIndex}`}
              style={style}
              aria-label={`Linha ${rowIndex + 1}, coluna ${colIndex + 1}: ${letter}`}
            >
              <span className="cell__letter">{letter}</span>
            </div>
          );
        }),
      )}
    </div>
  );
}
