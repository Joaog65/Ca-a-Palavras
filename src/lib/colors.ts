import type { ColorId } from './types';

/**
 * Paleta do marca-texto.
 * As cores são aplicadas com transparência sobre as células, mantendo as
 * letras escuras e legíveis (efeito "marca-texto" real).
 */
export interface MarkerColor {
  id: ColorId;
  label: string;
  /** Cor sólida (botão da paleta e borda da marcação). */
  solid: string;
  /** Cor translúcida usada no preenchimento da célula. */
  fill: string;
  /** Cor mais escura usada no texto de apoio (ex.: nome da cor na lista). */
  strong: string;
}

export const MARKER_COLORS: MarkerColor[] = [
  {
    id: 'amarelo',
    label: 'Amarelo',
    solid: '#F5C518',
    fill: 'rgba(250, 204, 21, 0.62)',
    strong: '#A16207',
  },
  {
    id: 'verde',
    label: 'Verde',
    solid: '#4ADE80',
    fill: 'rgba(74, 222, 128, 0.55)',
    strong: '#15803D',
  },
  {
    id: 'azul',
    label: 'Azul',
    solid: '#60A5FA',
    fill: 'rgba(96, 165, 250, 0.52)',
    strong: '#1D4ED8',
  },
  {
    id: 'rosa',
    label: 'Rosa',
    solid: '#F9A8D4',
    fill: 'rgba(249, 168, 212, 0.55)',
    strong: '#BE185D',
  },
  {
    id: 'laranja',
    label: 'Laranja',
    solid: '#FDBA74',
    fill: 'rgba(251, 146, 60, 0.55)',
    strong: '#C2410C',
  },
  {
    id: 'roxo',
    label: 'Roxo',
    solid: '#C4B5FD',
    fill: 'rgba(196, 181, 253, 0.6)',
    strong: '#6D28D9',
  },
  {
    id: 'vermelho',
    label: 'Vermelho',
    solid: '#F87171',
    fill: 'rgba(248, 113, 113, 0.55)',
    strong: '#B91C1C',
  },
];

export const COLOR_BY_ID: Record<ColorId, MarkerColor> = MARKER_COLORS.reduce(
  (acc, color) => {
    acc[color.id] = color;
    return acc;
  },
  {} as Record<ColorId, MarkerColor>,
);

/** Cor usada para as palavras reveladas por "Mostrar solução". */
export const REVEALED_STYLE = {
  solid: '#94A3B8',
  fill: 'rgba(148, 163, 184, 0.45)',
  strong: '#475569',
};
