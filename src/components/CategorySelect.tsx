import { CATEGORIES } from '../lib/wordBank';
import type { CategoryId } from '../lib/types';

interface CategorySelectProps {
  value: CategoryId;
  onChange: (category: CategoryId) => void;
}

/** Escolha da categoria de palavras (gera uma nova partida). */
export function CategorySelect({ value, onChange }: CategorySelectProps) {
  return (
    <div className="select-block">
      <label className="select-block__label" htmlFor="category-select">
        <span aria-hidden="true">🗂️</span> Categoria
      </label>
      <select
        id="category-select"
        className="select"
        value={value}
        onChange={(event) => onChange(event.target.value as CategoryId)}
        data-testid="category-select"
      >
        {CATEGORIES.map((category) => (
          <option key={category.id} value={category.id}>
            {category.emoji} {category.label}
          </option>
        ))}
      </select>
    </div>
  );
}
