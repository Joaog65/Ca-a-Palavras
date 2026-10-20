import { describe, expect, it } from 'vitest';
import { normalize, removeAccents, sameLetters } from '../normalize';

describe('normalize', () => {
  it('remove acentos e passa para maiúsculas', () => {
    expect(normalize('MATEMÁTICA')).toBe('MATEMATICA');
    expect(normalize('CIÊNCIAS')).toBe('CIENCIAS');
    expect(normalize('PORTUGUÊS')).toBe('PORTUGUES');
    expect(normalize('Geografia')).toBe('GEOGRAFIA');
  });

  it('ignora espaços, acentos e caracteres especiais', () => {
    expect(normalize('EDUCAÇÃO FÍSICA')).toBe('EDUCACAOFISICA');
    expect(normalize('marcatexto')).toBe('MARCATEXTO');
  });

  it('removeAccents mantém as letras originais', () => {
    expect(removeAccents('ÁÉÍÓÚÂÊÔÃÕÇ')).toBe('AEIOUAEOAOC');
  });

  it('sameLetters compara ignorando acentos', () => {
    expect(sameLetters('MATEMÁTICA', 'matematica')).toBe(true);
    expect(sameLetters('LÁPIS', 'LAPIS')).toBe(true);
    expect(sameLetters('LÁPIS', 'LIVRO')).toBe(false);
  });
});
