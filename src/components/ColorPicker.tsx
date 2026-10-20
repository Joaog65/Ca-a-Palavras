import type { CSSProperties } from 'react';
import { MARKER_COLORS } from '../lib/colors';
import type { ColorId } from '../lib/types';

interface ColorPickerProps {
  value: ColorId;
  onChange: (color: ColorId) => void;
}

/**
 * Paleta do marca-texto.
 * A cor selecionada fica claramente destacada e pode ser trocada a qualquer
 * momento, inclusive durante a partida.
 */
export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="color-picker" role="group" aria-label="Cor do marca-texto">
      <div className="color-picker__title">
        <span aria-hidden="true">🖍️</span>
        <span>Cor do marca-texto</span>
      </div>
      <div className="color-picker__palette">
        {MARKER_COLORS.map((color) => {
          const selected = color.id === value;
          return (
            <button
              key={color.id}
              type="button"
              className={`color-swatch${selected ? ' color-swatch--selected' : ''}`}
              style={{ '--swatch': color.solid } as CSSProperties}
              onClick={() => onChange(color.id)}
              aria-pressed={selected}
              aria-label={`Cor ${color.label}${selected ? ' (selecionada)' : ''}`}
              title={color.label}
              data-testid={`color-${color.id}`}
            >
              <span className="color-swatch__paint" aria-hidden="true" />
              <span className="color-swatch__label">{color.label}</span>
              {selected ? <span className="color-swatch__check" aria-hidden="true">✓</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
