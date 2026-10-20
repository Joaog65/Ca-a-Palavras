import type { CategoryId, Difficulty, DifficultyConfig } from './types';

/**
 * Banco de palavras do ambiente escolar, organizado por categoria.
 * As palavras podem conter acentos (o jogo normaliza tudo na comparação).
 */
export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  description: string;
  words: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'materiais',
    label: 'Materiais escolares',
    emoji: '🎒',
    description: 'Tudo o que você usa para estudar',
    words: [
      'CADERNO',
      'LÁPIS',
      'BORRACHA',
      'CANETA',
      'RÉGUA',
      'TESOURA',
      'ESTOJO',
      'PINCEL',
      'GIZ',
      'MOCHILA',
      'LIVRO',
      'FICHÁRIO',
      'ÁBACO',
      'COLA',
      'LAPISEIRA',
    ],
  },
  {
    id: 'disciplinas',
    label: 'Disciplinas',
    emoji: '📚',
    description: 'As matérias que você aprende na escola',
    words: [
      'MATEMÁTICA',
      'PORTUGUÊS',
      'CIÊNCIAS',
      'HISTÓRIA',
      'GEOGRAFIA',
      'ARTES',
      'MÚSICA',
      'BIOLOGIA',
      'FÍSICA',
      'QUÍMICA',
      'LITERATURA',
      'INGLÊS',
    ],
  },
  {
    id: 'profissionais',
    label: 'Profissionais da escola',
    emoji: '👩‍🏫',
    description: 'Quem trabalha e aprende na escola',
    words: [
      'PROFESSOR',
      'PROFESSORA',
      'ALUNO',
      'ALUNA',
      'DIRETOR',
      'DIRETORA',
      'SECRETÁRIA',
      'BIBLIOTECÁRIA',
      'COORDENADOR',
      'MONITOR',
      'PORTEIRO',
      'PEDAGOGO',
    ],
  },
  {
    id: 'espacos',
    label: 'Espaços da escola',
    emoji: '🏫',
    description: 'Onde a escola acontece',
    words: [
      'ESCOLA',
      'SALA',
      'QUADRO',
      'BIBLIOTECA',
      'LABORATÓRIO',
      'PÁTIO',
      'CORREDOR',
      'REFEITÓRIO',
      'COPA',
      'RECEPÇÃO',
      'GINÁSIO',
      'AUDITÓRIO',
    ],
  },
  {
    id: 'atividades',
    label: 'Atividades escolares',
    emoji: '✏️',
    description: 'O que você faz durante o dia letivo',
    words: [
      'RECREIO',
      'PROVA',
      'TAREFA',
      'NOTA',
      'AULA',
      'ATIVIDADE',
      'TRABALHO',
      'PROJETO',
      'LEITURA',
      'ESCRITA',
      'CÁLCULO',
      'DESENHO',
      'ESTUDAR',
      'APRENDER',
    ],
  },
  {
    id: 'variadas',
    label: 'Categorias variadas',
    emoji: '🌈',
    description: 'Palavras seis, valores e discovers da escola',
    words: [
      'RECEBER',
      'CONHECER',
      'ESCOLHER',
      'AMIZADE',
      'RESPEITO',
      'CORAGEM',
      'ALEGRIA',
      'CRIATIVIDADE',
      'DIVERSIDADE',
      'PARTICIPAR',
      'COMPARTILHAR',
      'PERGUNTAR',
      'RESPOSTA',
      'DESAFIO',
      'SUCESSO',
    ],
  },
];

export const CATEGORY_BY_ID: Record<CategoryId, Category> = CATEGORIES.reduce(
  (acc, category) => {
    acc[category.id] = category;
    return acc;
  },
  {} as Record<CategoryId, Category>,
);

/** Todas as palavras do banco, sem repetições (ignorando acentos). */
export const ALL_WORDS: string[] = (() => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const category of CATEGORIES) {
    for (const word of category.words) {
      const key = word
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(word);
      }
    }
  }
  return result;
})();

export const DIFFICULTIES: DifficultyConfig[] = [
  {
    id: 'facil',
    label: 'Fácil',
    description: 'Grade pequena e palavras curtas',
    size: 10,
    wordCount: 7,
    maxWordLength: 7,
    descriptionDirections: 'Direções simples (horizontal, vertical e diagonais)',
  },
  {
    id: 'medio',
    label: 'Médio',
    description: 'Grade maior e mais palavras',
    size: 12,
    wordCount: 10,
    maxWordLength: 9,
    descriptionDirections: 'Horizontal, vertical e diagonais nos dois sentidos',
  },
  {
    id: 'dificil',
    label: 'Difícil',
    description: 'Grade grande, muitas palavras e direções variadas',
    size: 14,
    wordCount: 14,
    maxWordLength: 12,
    descriptionDirections: 'Todas as oito direções, com palavras longas',
  },
];

export const DIFFICULTY_BY_ID: Record<Difficulty, DifficultyConfig> = DIFFICULTIES.reduce(
  (acc, difficulty) => {
    acc[difficulty.id] = difficulty;
    return acc;
  },
  {} as Record<Difficulty, DifficultyConfig>,
);
