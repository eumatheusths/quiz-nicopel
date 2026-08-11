import { describe, expect, it } from 'vitest';
import { adaptiveQuestions, generalQuestions, groups } from '@/content/quiz';
import { results } from '@/content/results';
import { GROUP_IDS, ROLE_IDS, type GroupId, type RoleId } from '@/content/types';
import { explainResult, tryExplainResult } from '@/lib/explain';
import type { AnswerMap } from '@/lib/scoring';

function general(index: number, group: GroupId): [string, string] {
  const question = generalQuestions[index];
  if (!question) throw new Error(`Pergunta ${index} inexistente`);
  const option = question.options.find((candidate) => candidate.group === group);
  if (!option) throw new Error(`${question.id} sem alternativa do grupo ${group}`);
  return [question.id, option.id];
}

function adaptive(group: GroupId, slot: 0 | 1, role: RoleId): [string, string] {
  const question = adaptiveQuestions[group][slot];
  const option = question.options.find((candidate) => candidate.role === role);
  if (!option) throw new Error(`${question.id} (${group}) sem alternativa para ${role}`);
  return [question.id, option.id];
}

function answersFor(
  sequence: readonly GroupId[],
  group: GroupId,
  q9: RoleId,
  q10: RoleId,
): AnswerMap {
  return {
    ...Object.fromEntries(sequence.map((groupId, index) => general(index, groupId))),
    ...Object.fromEntries([adaptive(group, 0, q9), adaptive(group, 1, q10)]),
  } as AnswerMap;
}

const allOf = (group: GroupId): GroupId[] => Array.from({ length: 8 }, () => group);

describe('explicação do resultado', () => {
  it('lista exatamente as 10 respostas, na ordem', () => {
    const explanation = explainResult(answersFor(allOf('B'), 'B', 'design', 'design'));

    expect(explanation.steps).toHaveLength(10);
    expect(explanation.steps.map((step) => step.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(explanation.steps.slice(0, 8).every((step) => step.targetKind === 'area')).toBe(true);
    expect(explanation.steps.slice(8).every((step) => step.targetKind === 'cargo')).toBe(true);
  });

  it('cada passo traz o texto da alternativa escolhida e o traço revelado', () => {
    const explanation = explainResult(answersFor(allOf('E'), 'E', 'producao', 'producao'));

    for (const step of explanation.steps) {
      expect(step.prompt.length).toBeGreaterThan(10);
      expect(step.answer.length).toBeGreaterThan(5);
      expect(step.insight.length).toBeGreaterThan(3);
      expect(step.target.length).toBeGreaterThan(3);
    }
  });

  it('o ranking soma 8 e vem ordenado do maior para o menor', () => {
    const explanation = explainResult(
      answersFor(['A', 'A', 'A', 'B', 'B', 'C', 'D', 'E'], 'A', 'comercial', 'comercial'),
    );

    const total = explanation.ranking.reduce((sum, entry) => sum + entry.score, 0);
    expect(total).toBe(8);

    const scores = explanation.ranking.map((entry) => entry.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(explanation.ranking[0]).toMatchObject({ group: 'A', score: 3 });
  });

  it('explica a maioria isolada sem falar em desempate', () => {
    const explanation = explainResult(answersFor(allOf('D'), 'D', 'qualidade', 'qualidade'));

    expect(explanation.wasTiebreak).toBe(false);
    expect(explanation.winningScore).toBe(8);
    expect(explanation.reason).toContain('8 das suas escolhas');
    expect(explanation.reason).not.toContain('empatou');
  });

  it('avisa quando o grupo saiu de desempate', () => {
    // A e B empatam em 4; a pergunta 8 (grupo B) desempata.
    const explanation = explainResult(
      answersFor(['A', 'A', 'A', 'A', 'B', 'B', 'B', 'B'], 'B', 'marketing', 'marketing'),
    );

    expect(explanation.wasTiebreak).toBe(true);
    expect(explanation.reason).toContain('empatou');
  });

  it('explica o desempate da pergunta 10 quando as duas últimas divergem', () => {
    const explanation = explainResult(answersFor(allOf('A'), 'A', 'comercial', 'logistica'));

    expect(explanation.role).toBe('logistica');
    expect(explanation.reason).toContain('pergunta 10');
    expect(explanation.reason).toContain('Logística & Expedição');
  });

  it('não fala em desempate quando as duas últimas concordam', () => {
    const explanation = explainResult(answersFor(allOf('C'), 'C', 'rh', 'rh'));
    expect(explanation.reason).toContain('mesma direção');
    expect(explanation.reason).not.toContain('pergunta 10');
  });

  it('sempre cita o cargo final e a área secundária', () => {
    for (const group of GROUP_IDS) {
      for (const role of groups[group].roles) {
        const explanation = explainResult(answersFor(allOf(group), group, role, role));
        expect(explanation.reason).toContain(results[role].name);
        expect(explanation.reason).toContain(explanation.secondaryGroupName);
        expect(ROLE_IDS).toContain(explanation.role);
      }
    }
  });

  it('é determinística', () => {
    const answers = answersFor(['A', 'B', 'C', 'D', 'E', 'B', 'B', 'B'], 'B', 'ti', 'design');
    const first = explainResult(answers);
    expect(explainResult(answers)).toEqual(first);
  });

  it('a versão tolerante devolve null em vez de lançar', () => {
    expect(tryExplainResult({})).toBeNull();
    expect(tryExplainResult({ q1: 'q1-A' })).toBeNull();

    const incomplete = answersFor(allOf('A'), 'A', 'comercial', 'comercial');
    delete incomplete.q10;
    expect(tryExplainResult(incomplete)).toBeNull();
  });
});

describe('as perguntas não entregam o mapeamento', () => {
  /** Nomes de área e de cargo que não podem aparecer no texto do quiz. */
  const revealing = [
    ...GROUP_IDS.map((group) => groups[group].name),
    ...ROLE_IDS.map((role) => results[role].name),
    'Comercial',
    'Compras',
    'Financeiro',
    'Logística',
    'Marketing',
    'Qualidade',
    'Engenharia',
  ];

  it('nenhuma pergunta geral cita uma área ou um cargo', () => {
    for (const question of generalQuestions) {
      const text = [question.prompt, ...question.options.map((option) => option.label)].join(' ');
      for (const term of revealing) {
        expect(text, `${question.id} cita "${term}"`).not.toContain(term);
      }
    }
  });

  it('as alternativas gerais falam de gostos, não de tarefas de trabalho', () => {
    // "Na empresa", "no trabalho", "cliente", "produção" denunciam o mapeamento.
    const jobWords = ['empresa', 'cliente', 'fornecedor', 'produção', 'fábrica', 'campanha'];
    for (const question of generalQuestions) {
      for (const option of question.options) {
        const label = option.label.toLowerCase();
        for (const word of jobWords) {
          expect(label, `${option.id} usa "${word}"`).not.toContain(word);
        }
      }
    }
  });

  it('toda alternativa tem um traço curto para o resumo', () => {
    for (const question of generalQuestions) {
      for (const option of question.options) {
        expect(option.insight.length).toBeGreaterThan(3);
        expect(option.insight.length).toBeLessThan(32);
      }
    }
    for (const group of GROUP_IDS) {
      for (const question of adaptiveQuestions[group]) {
        for (const option of question.options) {
          expect(option.insight.length).toBeGreaterThan(3);
          expect(option.insight.length).toBeLessThan(32);
        }
      }
    }
  });
});
