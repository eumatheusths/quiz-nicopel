/**
 * Auditoria de equilíbrio do quiz.
 *
 *   npx tsx scripts/audit-balance.mts [amostras]
 *
 * Simula respostas aleatórias e mede: distribuição de áreas, distribuição de
 * cargos, frequência de empate na camada 1 e viés de posição do embaralhamento.
 * Serve para saber se algum caminho é sistematicamente mais provável que outro.
 */
import { adaptiveQuestions, generalQuestions, groups } from '../src/content/quiz';
import { results } from '../src/content/results';
import { GROUP_IDS, ROLE_IDS, type GroupId } from '../src/content/types';
import { shuffleForDisplay } from '../src/lib/quiz-session';
import { computeResult, scoreGroups, type AnswerMap } from '../src/lib/scoring';

const SAMPLES = Number(process.argv[2] ?? 200_000);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function pct(value: number, total: number): string {
  return `${((value / total) * 100).toFixed(2)}%`;
}

function bar(value: number, total: number, expected: number): string {
  const share = value / total;
  const width = Math.round(share * 120);
  const deviation = ((share - expected) / expected) * 100;
  const sign = deviation >= 0 ? '+' : '';
  return `${'█'.repeat(width).padEnd(28)} ${pct(value, total).padStart(7)}  (${sign}${deviation.toFixed(1)}% vs. esperado)`;
}

// --- Simulação com respostas uniformemente aleatórias ------------------------

const groupWins: Record<string, number> = {};
const roleWins: Record<string, number> = {};
const secondary: Record<string, number> = {};
let tiedAtTop = 0;
let resolvedByFallback = 0;

for (const g of GROUP_IDS) {
  groupWins[g] = 0;
  secondary[g] = 0;
}
for (const r of ROLE_IDS) roleWins[r] = 0;

for (let i = 0; i < SAMPLES; i += 1) {
  const answers: AnswerMap = {};
  for (const question of generalQuestions) {
    answers[question.id] = pick(question.options).id;
  }

  const scores = scoreGroups(answers);
  const best = Math.max(...GROUP_IDS.map((g) => scores[g]));
  const tied = GROUP_IDS.filter((g) => scores[g] === best);
  if (tied.length > 1) tiedAtTop += 1;

  // O desempate cai na ordem canônica A–E quando nem q8, nem q6, nem q5
  // apontam para um dos empatados.
  if (tied.length > 1) {
    const tiebreakGroups = (['q8', 'q6', 'q5'] as const).map((qid) => {
      const question = generalQuestions.find((q) => q.id === qid);
      const chosen = question?.options.find((o) => o.id === answers[qid]);
      return chosen?.group;
    });
    if (!tiebreakGroups.some((g) => g && tied.includes(g))) resolvedByFallback += 1;
  }

  // Camada 2: respostas aleatórias entre os cargos do grupo vencedor.
  const stageGroup = tied.length === 1 ? (tied[0] as GroupId) : undefined;
  const winner =
    stageGroup ??
    ((): GroupId => {
      for (const qid of ['q8', 'q6', 'q5'] as const) {
        const question = generalQuestions.find((q) => q.id === qid);
        const chosen = question?.options.find((o) => o.id === answers[qid]);
        if (chosen && tied.includes(chosen.group)) return chosen.group;
      }
      return tied[0] as GroupId;
    })();

  const pair = adaptiveQuestions[winner];
  answers.q9 = pick(pair[0].options).id;
  answers.q10 = pick(pair[1].options).id;

  const result = computeResult(answers);
  groupWins[result.group] = (groupWins[result.group] ?? 0) + 1;
  secondary[result.secondaryGroup] = (secondary[result.secondaryGroup] ?? 0) + 1;
  roleWins[result.role] = (roleWins[result.role] ?? 0) + 1;
}

console.log(`\n=== ${SAMPLES.toLocaleString('pt-BR')} respostas aleatórias ===\n`);

console.log('ÁREA VENCEDORA  (esperado: 20% cada)');
for (const g of GROUP_IDS) {
  console.log(`  ${groups[g].name.padEnd(38)} ${bar(groupWins[g] ?? 0, SAMPLES, 1 / 5)}`);
}

console.log('\nÁREA SECUNDÁRIA  (esperado: 20% cada)');
for (const g of GROUP_IDS) {
  console.log(`  ${groups[g].name.padEnd(38)} ${bar(secondary[g] ?? 0, SAMPLES, 1 / 5)}`);
}

console.log('\nCARGO FINAL  (esperado: 6,25% cada, se todos fossem igualmente prováveis)');
const sortedRoles = [...ROLE_IDS].sort((a, b) => (roleWins[b] ?? 0) - (roleWins[a] ?? 0));
for (const r of sortedRoles) {
  const groupSize = groups[results[r].group].roles.length;
  console.log(
    `  ${results[r].name.padEnd(38)} ${bar(roleWins[r] ?? 0, SAMPLES, 1 / 16)}  [grupo com ${groupSize} cargos]`,
  );
}

console.log('\nDESEMPATE NA CAMADA 1');
console.log(`  Empate no topo:                 ${pct(tiedAtTop, SAMPLES)}`);
console.log(
  `  Resolvido pela ordem A–E:       ${pct(resolvedByFallback, SAMPLES)} do total  (${pct(resolvedByFallback, tiedAtTop || 1)} dos empates)`,
);

// --- Viés de posição do embaralhamento --------------------------------------

console.log('\n=== EMBARALHAMENTO: em que posição cada área aparece ===');
const POSITION_SAMPLES = 60_000;
const positions: Record<GroupId, number[]> = { A: [], B: [], C: [], D: [], E: [] };
for (const g of GROUP_IDS) positions[g] = [0, 0, 0, 0, 0];

for (let i = 0; i < POSITION_SAMPLES; i += 1) {
  const seed = Math.floor(Math.random() * 2 ** 31);
  for (const question of generalQuestions) {
    const shuffled = shuffleForDisplay(question.options, seed, question.id);
    shuffled.forEach((option, index) => {
      const slot = positions[option.group];
      if (slot) slot[index] = (slot[index] ?? 0) + 1;
    });
  }
}

const totalPerGroup = POSITION_SAMPLES * generalQuestions.length;
console.log('  (esperado: 20% em cada uma das 5 posições)');
for (const g of GROUP_IDS) {
  const row = (positions[g] ?? [])
    .map((count) => pct(count, totalPerGroup).padStart(7))
    .join(' ');
  console.log(`  ${g}: ${row}`);
}
