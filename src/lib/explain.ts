import { adaptiveQuestions, generalQuestions, groups } from '@/content/quiz';
import { results } from '@/content/results';
import {
  ADAPTIVE_QUESTION_IDS,
  GENERAL_QUESTION_IDS,
  type GroupId,
  type QuestionId,
  type RoleId,
} from '@/content/types';
import { computeResult, type AnswerMap, type GroupScores } from './scoring';

/**
 * Transforma as respostas em uma explicação legível.
 *
 * O quiz esconde de propósito para onde cada alternativa aponta enquanto a
 * pessoa responde. Depois do resultado, a lógica deixa de ser um truque e vira
 * conteúdo: aqui montamos o "porquê" — quantas escolhas foram para cada área,
 * o que cada resposta revelou e como as duas últimas definiram o cargo.
 *
 * Função pura, para poder rodar tanto na página quanto na geração do PDF.
 */

export interface AnswerStep {
  /** Número da pergunta, de 1 a 10. */
  number: number;
  questionId: QuestionId;
  prompt: string;
  /** Texto da alternativa escolhida. */
  answer: string;
  /** Traço curto que a escolha revela. */
  insight: string;
  /** Para onde a escolha apontou. */
  target: string;
  /** `area` nas 8 primeiras, `cargo` nas duas últimas. */
  targetKind: 'area' | 'cargo';
}

export interface ResultExplanation {
  role: RoleId;
  roleName: string;
  group: GroupId;
  groupName: string;
  secondaryGroup: GroupId;
  secondaryGroupName: string;
  groupScores: GroupScores;
  /** Pontuação do grupo vencedor, de 0 a 8. */
  winningScore: number;
  /** Ranking das áreas, da mais para a menos escolhida. */
  ranking: { group: GroupId; name: string; score: number }[];
  steps: AnswerStep[];
  /** Parágrafo explicando como se chegou ao cargo. */
  reason: string;
  /** `true` quando o grupo vencedor saiu de desempate, não de maioria isolada. */
  wasTiebreak: boolean;
}

const generalById = new Map(generalQuestions.map((question) => [question.id, question] as const));

/**
 * Monta a explicação completa. Lança se as respostas estiverem incompletas —
 * quem chama já deve ter um resultado válido em mãos.
 */
export function explainResult(answers: AnswerMap): ResultExplanation {
  const computed = computeResult(answers);
  const { group, secondaryGroup, role, groupScores } = computed;

  const steps: AnswerStep[] = [];

  // Perguntas 1 a 8 — cada uma aponta para uma área.
  GENERAL_QUESTION_IDS.forEach((questionId, index) => {
    const question = generalById.get(questionId);
    const optionId = answers[questionId];
    const option = question?.options.find((candidate) => candidate.id === optionId);
    if (!question || !option) return;

    steps.push({
      number: index + 1,
      questionId,
      prompt: question.prompt,
      answer: option.label,
      insight: option.insight,
      target: groups[option.group].name,
      targetKind: 'area',
    });
  });

  // Perguntas 9 e 10 — cada uma aponta para um cargo do grupo vencedor.
  ADAPTIVE_QUESTION_IDS.forEach((questionId, index) => {
    const question = adaptiveQuestions[group][index === 0 ? 0 : 1];
    const optionId = answers[questionId];
    const option = question.options.find((candidate) => candidate.id === optionId);
    if (!option) return;

    steps.push({
      number: 9 + index,
      questionId,
      prompt: question.prompt,
      answer: option.label,
      insight: option.insight,
      target: results[option.role].name,
      targetKind: 'cargo',
    });
  });

  const ranking = (Object.keys(groupScores) as GroupId[])
    .map((groupId) => ({ group: groupId, name: groups[groupId].name, score: groupScores[groupId] }))
    .sort((a, b) => b.score - a.score);

  const winningScore = groupScores[group];
  const tiedCount = ranking.filter((entry) => entry.score === winningScore).length;
  const wasTiebreak = tiedCount > 1;

  const q9 = steps.find((step) => step.questionId === 'q9');
  const q10 = steps.find((step) => step.questionId === 'q10');

  const parts: string[] = [];

  parts.push(
    wasTiebreak
      ? `Nas 8 primeiras perguntas, ${groups[group].name} empatou no topo com ${winningScore} de 10 escolhas. O desempate olhou as suas respostas mais recentes, e essa área ficou com a frente.`
      : `Das 8 primeiras perguntas, ${winningScore} das suas escolhas apontaram para ${groups[group].name} — mais que qualquer outra área.`,
  );

  if (q9 && q10) {
    parts.push(
      q9.target === q10.target
        ? `Depois disso, as duas últimas perguntas foram na mesma direção: ${q10.target}.`
        : `Nas duas últimas, você ficou entre ${q9.target} e ${q10.target}. A pergunta 10 é a que desempata, e ela apontou para ${q10.target}.`,
    );
  }

  parts.push(
    `Por isso o resultado é ${results[role].name}. E como ${groups[secondaryGroup].name} veio logo atrás, vale dar uma olhada nessa área também.`,
  );

  return {
    role,
    roleName: results[role].name,
    group,
    groupName: groups[group].name,
    secondaryGroup,
    secondaryGroupName: groups[secondaryGroup].name,
    groupScores,
    winningScore,
    ranking,
    steps,
    reason: parts.join(' '),
    wasTiebreak,
  };
}

/** Versão tolerante: devolve `null` em vez de lançar quando faltam respostas. */
export function tryExplainResult(answers: AnswerMap): ResultExplanation | null {
  try {
    return explainResult(answers);
  } catch {
    return null;
  }
}
