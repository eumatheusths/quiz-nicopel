import { TIEBREAK_ORDER, adaptiveQuestions, generalQuestions, groups } from '@/content/quiz';
import {
  GENERAL_QUESTION_IDS,
  GROUP_IDS,
  type AdaptiveQuestionId,
  type GeneralQuestionId,
  type GroupId,
  type QuestionId,
  type RoleId,
} from '@/content/types';

/**
 * Pontuação do quiz.
 *
 * Todas as funções deste arquivo são puras e determinísticas: as mesmas
 * respostas produzem sempre o mesmo cargo. Nenhuma delas lê `Date`, `Math.random`
 * ou qualquer estado externo.
 */

/** Respostas no formato `{ [idDaPergunta]: idDaOpção }`. */
export type AnswerMap = Partial<Record<QuestionId, string>>;

export type GroupScores = Record<GroupId, number>;
export type RoleScores = Partial<Record<RoleId, number>>;

export interface GroupStage {
  /** Grupo vencedor da camada 1 — define as perguntas 9 e 10. */
  group: GroupId;
  /** Segundo grupo mais pontuado, usado em “Você também pode explorar”. */
  secondaryGroup: GroupId;
  groupScores: GroupScores;
}

export interface QuizResult extends GroupStage {
  /** Cargo final — sempre um único, entre os 16 possíveis. */
  role: RoleId;
  roleScores: RoleScores;
}

export class ScoringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScoringError';
  }
}

// --- Índices derivados do conteúdo -----------------------------------------

const generalById = new Map(generalQuestions.map((q) => [q.id, q] as const));

/** `optionId` → grupo, considerando apenas as perguntas 1 a 8. */
const groupByOptionId = new Map<string, GroupId>();
for (const question of generalQuestions) {
  for (const option of question.options) {
    groupByOptionId.set(option.id, option.group);
  }
}

/** `${group}:${questionId}:${optionId}` → cargo, para as perguntas adaptativas. */
const roleByAdaptiveKey = new Map<string, RoleId>();
for (const groupId of GROUP_IDS) {
  for (const question of adaptiveQuestions[groupId]) {
    for (const option of question.options) {
      roleByAdaptiveKey.set(`${groupId}:${question.id}:${option.id}`, option.role);
    }
  }
}

// --- Camada 1: grande área --------------------------------------------------

function emptyGroupScores(): GroupScores {
  return { A: 0, B: 0, C: 0, D: 0, E: 0 };
}

/** Grupo apontado pela resposta de uma pergunta geral, ou `null`. */
function groupOfGeneralAnswer(questionId: GeneralQuestionId, answers: AnswerMap): GroupId | null {
  const optionId = answers[questionId];
  if (!optionId) return null;
  const question = generalById.get(questionId);
  if (!question) return null;
  // A opção precisa pertencer a esta pergunta — evita respostas cruzadas.
  const option = question.options.find((candidate) => candidate.id === optionId);
  return option ? option.group : null;
}

export function scoreGroups(answers: AnswerMap): GroupScores {
  const scores = emptyGroupScores();
  for (const questionId of GENERAL_QUESTION_IDS) {
    const group = groupOfGeneralAnswer(questionId, answers);
    if (group) scores[group] += 1;
  }
  return scores;
}

/**
 * Desempate da camada 1: entre os grupos empatados, vence o primeiro escolhido
 * na sequência pergunta 8 → 6 → 5. Se nenhuma dessas respostas apontar para um
 * dos empatados, cai na ordem canônica A, B, C, D, E — determinístico sempre.
 */
function breakGroupTie(tied: readonly GroupId[], answers: AnswerMap): GroupId {
  if (tied.length === 1) return tied[0] as GroupId;
  for (const questionId of TIEBREAK_ORDER) {
    const group = groupOfGeneralAnswer(questionId as GeneralQuestionId, answers);
    if (group && tied.includes(group)) return group;
  }
  return tied[0] as GroupId;
}

function rankGroup(scores: GroupScores, answers: AnswerMap, exclude: readonly GroupId[]): GroupId {
  const candidates = GROUP_IDS.filter((group) => !exclude.includes(group));
  const best = Math.max(...candidates.map((group) => scores[group]));
  const tied = candidates.filter((group) => scores[group] === best);
  return breakGroupTie(tied, answers);
}

/**
 * Resolve o grupo vencedor e o secundário a partir das perguntas 1 a 8.
 * Lança `ScoringError` se alguma das oito perguntas não estiver respondida.
 */
export function computeGroupStage(answers: AnswerMap): GroupStage {
  const missing = GENERAL_QUESTION_IDS.filter(
    (questionId) => groupOfGeneralAnswer(questionId, answers) === null,
  );
  if (missing.length > 0) {
    throw new ScoringError(`Respostas ausentes ou inválidas: ${missing.join(', ')}`);
  }

  const groupScores = scoreGroups(answers);
  const group = rankGroup(groupScores, answers, []);
  const secondaryGroup = rankGroup(groupScores, answers, [group]);

  return { group, secondaryGroup, groupScores };
}

// --- Camada 2: cargo específico ---------------------------------------------

function roleOfAdaptiveAnswer(
  group: GroupId,
  questionId: AdaptiveQuestionId,
  answers: AnswerMap,
): RoleId | null {
  const optionId = answers[questionId];
  if (!optionId) return null;
  return roleByAdaptiveKey.get(`${group}:${questionId}:${optionId}`) ?? null;
}

export function scoreRoles(group: GroupId, answers: AnswerMap): RoleScores {
  const scores: RoleScores = {};
  for (const role of groups[group].roles) {
    scores[role] = 0;
  }
  for (const questionId of ['q9', 'q10'] as const) {
    const role = roleOfAdaptiveAnswer(group, questionId, answers);
    if (role) scores[role] = (scores[role] ?? 0) + 1;
  }
  return scores;
}

/**
 * Resultado completo. A pergunta 10 é o desempate da camada 2: como ela sempre
 * soma um ponto a um cargo do grupo, o cargo escolhido nela está sempre entre
 * os empatados no topo — o resultado nunca fica indefinido.
 */
export function computeResult(answers: AnswerMap): QuizResult {
  const stage = computeGroupStage(answers);
  const { group } = stage;

  const q9Role = roleOfAdaptiveAnswer(group, 'q9', answers);
  const q10Role = roleOfAdaptiveAnswer(group, 'q10', answers);

  if (!q9Role || !q10Role) {
    const missing = [!q9Role && 'q9', !q10Role && 'q10'].filter(Boolean);
    throw new ScoringError(
      `Respostas adaptativas ausentes ou inválidas para o grupo ${group}: ${missing.join(', ')}`,
    );
  }

  const roleScores = scoreRoles(group, answers);
  const candidates = groups[group].roles;
  const best = Math.max(...candidates.map((role) => roleScores[role] ?? 0));
  const tied = candidates.filter((role) => (roleScores[role] ?? 0) === best);

  const role = tied.length === 1 ? (tied[0] as RoleId) : tied.includes(q10Role) ? q10Role : (tied[0] as RoleId);

  return { ...stage, role, roleScores };
}

// --- Auxiliares de interface -------------------------------------------------

/** Perguntas 9 e 10 do grupo vencedor, na ordem de apresentação. */
export function getAdaptiveQuestions(group: GroupId) {
  return adaptiveQuestions[group];
}

/** `true` se todas as oito perguntas gerais já foram respondidas validamente. */
export function hasCompletedGeneralStage(answers: AnswerMap): boolean {
  return GENERAL_QUESTION_IDS.every(
    (questionId) => groupOfGeneralAnswer(questionId, answers) !== null,
  );
}

/**
 * Verificação de integridade do conteúdo do quiz. Roda nos testes unitários e
 * protege contra erros de edição: id duplicado, pergunta sem mapeamento ou
 * alternativa apontando para cargo de outro grupo.
 */
export function validateQuizData(): string[] {
  const problems: string[] = [];
  const seenOptionIds = new Set<string>();

  if (generalQuestions.length !== 8) {
    problems.push(`Esperadas 8 perguntas gerais, encontradas ${generalQuestions.length}.`);
  }

  for (const question of generalQuestions) {
    const seenGroups = new Set<GroupId>();
    if (question.options.length !== 5) {
      problems.push(`${question.id}: esperadas 5 alternativas, encontradas ${question.options.length}.`);
    }
    for (const option of question.options) {
      if (seenOptionIds.has(option.id)) problems.push(`Id de opção duplicado: ${option.id}.`);
      seenOptionIds.add(option.id);
      if (!GROUP_IDS.includes(option.group)) {
        problems.push(`${option.id}: grupo inválido "${option.group}".`);
      }
      if (seenGroups.has(option.group)) {
        problems.push(`${question.id}: grupo ${option.group} aparece mais de uma vez.`);
      }
      seenGroups.add(option.group);
      if (!option.label.trim()) problems.push(`${option.id}: rótulo vazio.`);
    }
  }

  for (const groupId of GROUP_IDS) {
    const pair = adaptiveQuestions[groupId];
    if (pair.length !== 2) {
      problems.push(`Grupo ${groupId}: esperadas 2 perguntas adaptativas.`);
    }
    const groupRoles = new Set<RoleId>(groups[groupId].roles);
    for (const question of pair) {
      if (question.group !== groupId) {
        problems.push(`${question.id} do grupo ${groupId} declara group="${question.group}".`);
      }
      const covered = new Set<RoleId>();
      for (const option of question.options) {
        if (seenOptionIds.has(option.id)) problems.push(`Id de opção duplicado: ${option.id}.`);
        seenOptionIds.add(option.id);
        if (!groupRoles.has(option.role)) {
          problems.push(`${option.id}: cargo "${option.role}" não pertence ao grupo ${groupId}.`);
        }
        if (covered.has(option.role)) {
          problems.push(`${question.id} (${groupId}): cargo ${option.role} repetido.`);
        }
        covered.add(option.role);
        if (!option.label.trim()) problems.push(`${option.id}: rótulo vazio.`);
      }
      for (const role of groupRoles) {
        if (!covered.has(role)) {
          problems.push(`${question.id} (${groupId}): cargo ${role} sem alternativa.`);
        }
      }
    }
  }

  return problems;
}
