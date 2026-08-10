import { describe, expect, it } from 'vitest';
import { adaptiveQuestions, generalQuestions, groups } from '@/content/quiz';
import { results } from '@/content/results';
import { GROUP_IDS, ROLE_IDS, type GroupId, type RoleId } from '@/content/types';
import {
  ScoringError,
  computeGroupStage,
  computeResult,
  scoreGroups,
  validateQuizData,
  type AnswerMap,
} from '@/lib/scoring';

/**
 * Helpers para montar respostas sem depender da ordem visual das alternativas.
 */

/** Resposta da pergunta geral `index` (0 a 7) apontando para `group`. */
function general(index: number, group: GroupId): [string, string] {
  const question = generalQuestions[index];
  if (!question) throw new Error(`Pergunta geral ${index} inexistente`);
  const option = question.options.find((candidate) => candidate.group === group);
  if (!option) throw new Error(`${question.id} não tem alternativa do grupo ${group}`);
  return [question.id, option.id];
}

/** Oito respostas gerais a partir de uma sequência de grupos. */
function generalAnswers(sequence: readonly GroupId[]): AnswerMap {
  expect(sequence).toHaveLength(8);
  return Object.fromEntries(sequence.map((group, index) => general(index, group))) as AnswerMap;
}

/** Resposta adaptativa: `slot` 0 = pergunta 9, 1 = pergunta 10. */
function adaptive(group: GroupId, slot: 0 | 1, role: RoleId): [string, string] {
  const question = adaptiveQuestions[group][slot];
  const option = question.options.find((candidate) => candidate.role === role);
  if (!option) throw new Error(`${question.id} (${group}) não tem alternativa para ${role}`);
  return [question.id, option.id];
}

function fullAnswers(sequence: readonly GroupId[], group: GroupId, q9: RoleId, q10: RoleId): AnswerMap {
  return {
    ...generalAnswers(sequence),
    ...Object.fromEntries([adaptive(group, 0, q9), adaptive(group, 1, q10)]),
  } as AnswerMap;
}

/** Oito respostas todas do mesmo grupo. */
const allOf = (group: GroupId): GroupId[] => Array.from({ length: 8 }, () => group);

// ---------------------------------------------------------------------------

describe('integridade do conteúdo do quiz', () => {
  it('não tem pergunta sem mapeamento nem alternativa fora do grupo', () => {
    expect(validateQuizData()).toEqual([]);
  });

  it('cobre os 16 cargos, cada um em um único grupo', () => {
    const fromGroups = GROUP_IDS.flatMap((group) => groups[group].roles);
    expect(fromGroups).toHaveLength(16);
    expect(new Set(fromGroups).size).toBe(16);
    expect([...fromGroups].sort()).toEqual([...ROLE_IDS].sort());
  });

  it('mantém o grupo declarado em results.ts igual ao de quiz.ts', () => {
    for (const roleId of ROLE_IDS) {
      const result = results[roleId];
      expect(groups[result.group].roles).toContain(roleId);
    }
  });

  it('tem conteúdo completo para todos os 16 resultados', () => {
    for (const roleId of ROLE_IDS) {
      const result = results[roleId];
      expect(result.name.length).toBeGreaterThan(2);
      expect(result.headline.length).toBeGreaterThan(5);
      expect(result.summary.length).toBeGreaterThan(40);
      expect(result.skills.length).toBeGreaterThanOrEqual(3);
      expect(result.skills.length).toBeLessThanOrEqual(6);
      expect(result.inPractice.length).toBeGreaterThanOrEqual(1);
      expect(result.education.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('camada 1 — pontuação simples de cada grupo', () => {
  it.each(GROUP_IDS)('oito respostas do grupo %s vencem com 8 pontos', (group) => {
    const answers = generalAnswers(allOf(group));
    const stage = computeGroupStage(answers);
    expect(stage.group).toBe(group);
    expect(stage.groupScores[group]).toBe(8);
    expect(stage.secondaryGroup).not.toBe(group);
  });

  it('soma exatamente um ponto por resposta', () => {
    const answers = generalAnswers(['A', 'A', 'A', 'B', 'B', 'C', 'D', 'E']);
    expect(scoreGroups(answers)).toEqual({ A: 3, B: 2, C: 1, D: 1, E: 1 });
  });

  it('elege o grupo com maior pontuação sem precisar de desempate', () => {
    const stage = computeGroupStage(generalAnswers(['A', 'A', 'A', 'A', 'B', 'B', 'C', 'D']));
    expect(stage.group).toBe('A');
    expect(stage.secondaryGroup).toBe('B');
  });

  it('exige as oito respostas gerais', () => {
    const incomplete = generalAnswers(allOf('A'));
    delete incomplete.q4;
    expect(() => computeGroupStage(incomplete)).toThrow(ScoringError);
  });

  it('ignora resposta que não pertence à pergunta', () => {
    const answers = generalAnswers(allOf('A'));
    answers.q3 = 'q7-B'; // id válido, mas de outra pergunta
    expect(() => computeGroupStage(answers)).toThrow(ScoringError);
  });
});

describe('camada 1 — desempate por pergunta 8, depois 6, depois 5', () => {
  it('usa a pergunta 8 quando ela aponta para um dos empatados', () => {
    // A e B empatam em 4. Q8 = B.
    const answers = generalAnswers(['A', 'A', 'A', 'A', 'B', 'B', 'B', 'B']);
    expect(scoreGroups(answers)).toMatchObject({ A: 4, B: 4 });
    expect(computeGroupStage(answers).group).toBe('B');
  });

  it('cai para a pergunta 6 quando a 8 está fora do empate', () => {
    // Q1-Q3 = C, Q4 = D, Q5 = D, Q6 = C, Q7 = D, Q8 = E.
    // C = 4, D = 3, E = 1 → sem empate. Ajustamos para empatar C e D em 3.
    const answers = generalAnswers(['C', 'C', 'C', 'D', 'D', 'D', 'E', 'E']);
    expect(scoreGroups(answers)).toMatchObject({ C: 3, D: 3, E: 2 });
    // Q8 = E (fora do empate) → olha Q6 = D.
    expect(computeGroupStage(answers).group).toBe('D');
  });

  it('cai para a pergunta 5 quando 8 e 6 estão fora do empate', () => {
    // Q5 = A, Q6 = E, Q8 = E; A e B empatados em 3, E com 2.
    const answers = generalAnswers(['A', 'A', 'B', 'B', 'A', 'E', 'B', 'E']);
    expect(scoreGroups(answers)).toMatchObject({ A: 3, B: 3, E: 2 });
    expect(computeGroupStage(answers).group).toBe('A');
  });

  it('resolve empate quíntuplo de forma determinística', () => {
    // Cada grupo com pontuação diferente é impossível em 8 respostas iguais,
    // então usamos o caso real: quatro grupos com 2 e um com 0.
    const answers = generalAnswers(['A', 'A', 'B', 'B', 'C', 'C', 'D', 'D']);
    expect(scoreGroups(answers)).toMatchObject({ A: 2, B: 2, C: 2, D: 2, E: 0 });
    // Q8 = D entra no empate e vence.
    expect(computeGroupStage(answers).group).toBe('D');
    // Repetir produz sempre o mesmo resultado.
    expect(computeGroupStage(answers).group).toBe('D');
  });

  it('escolhe o segundo grupo excluindo o vencedor, com a mesma regra', () => {
    const answers = generalAnswers(['A', 'A', 'A', 'A', 'B', 'B', 'C', 'C']);
    const stage = computeGroupStage(answers);
    expect(stage.group).toBe('A');
    // B e C empatam em 2; Q8 = C.
    expect(stage.secondaryGroup).toBe('C');
  });
});

describe('camada 2 — cargo específico', () => {
  it('produz cada um dos 16 cargos', () => {
    const produced = new Set<RoleId>();

    for (const group of GROUP_IDS) {
      for (const role of groups[group].roles) {
        // Duas respostas iguais na camada 2 = 2 pontos, vitória isolada.
        const answers = fullAnswers(allOf(group), group, role, role);
        const result = computeResult(answers);
        expect(result.group).toBe(group);
        expect(result.role).toBe(role);
        expect(result.roleScores[role]).toBe(2);
        produced.add(result.role);
      }
    }

    expect(produced.size).toBe(16);
  });

  it('usa a pergunta 10 como desempate quando 9 e 10 divergem', () => {
    const answers = fullAnswers(allOf('A'), 'A', 'comercial', 'logistica');
    const result = computeResult(answers);
    expect(result.roleScores).toMatchObject({ comercial: 1, logistica: 1 });
    expect(result.role).toBe('logistica');
  });

  it('aplica o desempate da pergunta 10 em todos os grupos', () => {
    for (const group of GROUP_IDS) {
      const [first, second] = groups[group].roles;
      if (!first || !second) continue;
      const result = computeResult(fullAnswers(allOf(group), group, first, second));
      expect(result.role).toBe(second);
    }
  });

  it('rejeita resposta adaptativa de outro grupo', () => {
    const answers = generalAnswers(allOf('A'));
    // Alternativa válida, mas do grupo B.
    answers.q9 = 'q9B-marketing';
    answers.q10 = 'q10A-comercial';
    expect(() => computeResult(answers)).toThrow(ScoringError);
  });

  it('exige as duas respostas adaptativas', () => {
    const answers = generalAnswers(allOf('E'));
    answers.q9 = 'q9E-producao';
    expect(() => computeResult(answers)).toThrow(ScoringError);
  });
});

describe('determinismo', () => {
  it('as mesmas respostas produzem sempre o mesmo resultado', () => {
    const answers = fullAnswers(['A', 'B', 'C', 'D', 'E', 'B', 'B', 'B'], 'B', 'design', 'ti');
    const first = computeResult(answers);
    for (let attempt = 0; attempt < 25; attempt += 1) {
      expect(computeResult(answers)).toEqual(first);
    }
  });

  it('toda combinação de perfil termina em um único cargo válido', () => {
    // Varre um conjunto amplo de jornadas: para cada grupo dominante, todas as
    // combinações possíveis de perguntas 9 e 10.
    let journeys = 0;
    for (const group of GROUP_IDS) {
      for (const q9 of groups[group].roles) {
        for (const q10 of groups[group].roles) {
          const result = computeResult(fullAnswers(allOf(group), group, q9, q10));
          expect(groups[group].roles).toContain(result.role);
          expect(ROLE_IDS).toContain(result.role);
          journeys += 1;
        }
      }
    }
    expect(journeys).toBe(4 * 4 + 3 * 3 + 4 * 4 + 3 * 3 + 2 * 2);
  });
});
