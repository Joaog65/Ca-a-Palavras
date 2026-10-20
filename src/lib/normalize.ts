/**
 * Utilidades de texto: normalização de acentos e comparação de palavras.
 *
 * O jogo aceita palavras com acentos (MATEMÁTICA, CIÊNCIAS, PORTUGUÊS...) e a
 * grade pode exibir letras acentuadas. Toda comparação interna é feita sobre a
 * forma "normalizada" (sem acentos e sem espaços), garantindo que a busca
 * funcione mesmo que a grade use letras sem acento.
 */

/** Remove acentos, converte para maiúsculas e apaga espaços/hífens. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/** Versão minúscula e sem acentos, útil para buscas tolerantes. */
export function normalizeLoose(text: string): string {
  return normalize(text).toLowerCase();
}

/** Chave de comparação de células da grade. */
export function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

/** Converte um texto com acentos para o equivalente sem acento. */
export function removeAccents(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Verifica se duas sequências de letras representam a mesma palavra,
 * ignorando acentos, maiúsculas/minúsculas e espaços.
 */
export function sameLetters(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}
