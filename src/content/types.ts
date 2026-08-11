/**
 * Tipos compartilhados do conteúdo do quiz.
 *
 * Tudo aqui é editorial: alterar textos, cargos ou colaboradores não deveria
 * exigir mudança em nenhum componente. A lógica vive em `src/lib/scoring.ts`.
 */

/** As cinco grandes áreas avaliadas nas perguntas 1 a 8. */
export type GroupId = 'A' | 'B' | 'C' | 'D' | 'E';

export const GROUP_IDS: readonly GroupId[] = ['A', 'B', 'C', 'D', 'E'] as const;

/** Os 16 cargos possíveis como resultado final. */
export type RoleId =
  | 'comercial'
  | 'compras'
  | 'financeiro'
  | 'logistica'
  | 'marketing'
  | 'design'
  | 'ti'
  | 'rh'
  | 'administrativo'
  | 'endomarketing'
  | 'sst'
  | 'pcp'
  | 'engenharia-produto'
  | 'qualidade'
  | 'producao'
  | 'operador-maquinas';

export const ROLE_IDS: readonly RoleId[] = [
  'comercial',
  'compras',
  'financeiro',
  'logistica',
  'marketing',
  'design',
  'ti',
  'rh',
  'administrativo',
  'endomarketing',
  'sst',
  'pcp',
  'engenharia-produto',
  'qualidade',
  'producao',
  'operador-maquinas',
] as const;

/** Identificadores das perguntas gerais, em ordem de apresentação. */
export type GeneralQuestionId = 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8';

export const GENERAL_QUESTION_IDS: readonly GeneralQuestionId[] = [
  'q1',
  'q2',
  'q3',
  'q4',
  'q5',
  'q6',
  'q7',
  'q8',
] as const;

/** Identificadores das perguntas adaptativas. */
export type AdaptiveQuestionId = 'q9' | 'q10';

export const ADAPTIVE_QUESTION_IDS: readonly AdaptiveQuestionId[] = ['q9', 'q10'] as const;

export type QuestionId = GeneralQuestionId | AdaptiveQuestionId;

/** Nomes dos ícones disponíveis em `src/components/ui/Icon.tsx`. */
export type IconName =
  | 'handshake'
  | 'lightbulb'
  | 'users'
  | 'chart'
  | 'wrench'
  | 'truck'
  | 'palette'
  | 'monitor'
  | 'heart'
  | 'clipboard'
  | 'megaphone'
  | 'shield'
  | 'calendar'
  | 'ruler'
  | 'check-badge'
  | 'factory'
  | 'gear'
  | 'coins'
  | 'cart'
  | 'sparkles'
  | 'target'
  | 'box'
  | 'route'
  | 'search';

export interface GroupDefinition {
  id: GroupId;
  /** Nome curto exibido em “Você também pode explorar”. */
  name: string;
  /** Descrição de uma linha da grande área. */
  tagline: string;
  /** Cargos que pertencem a este grupo — a fonte da verdade da camada 2. */
  roles: readonly RoleId[];
}

export interface GeneralOption {
  /** Estável e único no quiz inteiro. Ex.: `q1-A`. */
  id: string;
  label: string;
  group: GroupId;
  icon: IconName;
  /**
   * Duas ou três palavras dizendo o traço que essa escolha revela.
   * Só aparece no resumo de respostas do resultado — nunca durante o quiz,
   * para não entregar de antemão para onde cada alternativa aponta.
   */
  insight: string;
}

export interface GeneralQuestion {
  id: GeneralQuestionId;
  prompt: string;
  options: readonly GeneralOption[];
}

export interface AdaptiveOption {
  /** Ex.: `q9A-comercial`. */
  id: string;
  label: string;
  role: RoleId;
  icon: IconName;
  /** Traço revelado pela escolha, exibido no resumo de respostas. */
  insight: string;
}

export interface AdaptiveQuestion {
  id: AdaptiveQuestionId;
  group: GroupId;
  prompt: string;
  options: readonly AdaptiveOption[];
}

/**
 * Card de colaborador real. Nunca preencher `quote` sem depoimento autorizado:
 * quando `status` é `pending`, a interface mostra o placeholder institucional.
 */
export interface Collaborator {
  id: string;
  /** Primeiro nome, como fornecido pela Nicopel. */
  name: string;
  /** Cargo exato. `null` enquanto não confirmado. */
  role: string | null;
  /** Caminho em /public/collaborators. `null` enquanto não houver foto autorizada. */
  photo: string | null;
  /** Texto alternativo da foto. */
  photoAlt: string | null;
  /** Depoimento de ~3 linhas. `null` enquanto não confirmado. */
  quote: string | null;
  /** Tempo de casa — exibido somente se confirmado. */
  tenure: string | null;
  status: 'confirmed' | 'pending';
}

export interface ResultContent {
  id: RoleId;
  group: GroupId;
  /** Nome do cargo/área como aparece no resultado. */
  name: string;
  /** Título curto e inspirador. */
  headline: string;
  /** Resumo de 2 a 4 linhas. */
  summary: string;
  /** 3 a 6 habilidades exibidas em chips. */
  skills: readonly string[];
  /** Bloco “Na prática, você pode...”. */
  inPractice: readonly string[];
  /** Formações correlacionadas. */
  education: readonly string[];
  icon: IconName;
  /** Id do colaborador associado, quando houver. */
  collaboratorId: string | null;
  /** Observação interna sobre o que ainda falta confirmar. */
  contentStatus: 'confirmed' | 'pending-collaborator';
}
