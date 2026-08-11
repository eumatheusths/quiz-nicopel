/**
 * Auditoria de estabilidade do quiz.
 *
 *   npx tsx scripts/audit-stability.mts [amostras]
 *
 * Mede o quanto o resultado depende de uma única escolha:
 *  - com que frequência o cargo é decidido só pela pergunta 10;
 *  - o que acontece com área e cargo quando uma resposta muda.
 *
 * É o teste de robustez do instrumento: um quiz cujo resultado vira a cada
 * clique trocado está medindo ruído, não afinidade.
 */
import { adaptiveQuestions, generalQuestions, groups } from '../src/content/quiz';
import { GENERAL_QUESTION_IDS, GROUP_IDS, type GroupId } from '../src/content/types';
import { computeGroupStage, computeResult, type AnswerMap } from '../src/lib/scoring';

const SAMPLES = Number(process.argv[2] ?? 100_000);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function pct(part: number, total: number): string {
  return `${((part / total) * 100).toFixed(1)}%`;
}

/** Gera uma jornada completa e coerente com o grupo vencedor. */
function randomJourney(): AnswerMap {
  const answers: AnswerMap = {};
  for (const question of generalQuestions) answers[question.id] = pick(question.options).id;

  const group = computeGroupStage(answers).group;
  const pair = adaptiveQuestions[group];
  answers.q9 = pick(pair[0].options).id;
  answers.q10 = pick(pair[1].options).id;
  return answers;
}

// --- 1. Peso da pergunta 10 --------------------------------------------------

let decidedByQ10Alone = 0;
const byGroupSize: Record<number, { total: number; q10: number }> = {};

for (let i = 0; i < SAMPLES; i += 1) {
  const answers = randomJourney();
  const result = computeResult(answers);
  const size = groups[result.group].roles.length;

  byGroupSize[size] ??= { total: 0, q10: 0 };
  const bucket = byGroupSize[size];
  if (!bucket) continue;
  bucket.total += 1;

  // Empate 1×1 na camada 2 significa que só a pergunta 10 decidiu.
  const top = Math.max(...groups[result.group].roles.map((r) => result.roleScores[r] ?? 0));
  if (top === 1) {
    decidedByQ10Alone += 1;
    bucket.q10 += 1;
  }
}

console.log(`\n=== ${SAMPLES.toLocaleString('pt-BR')} jornadas aleatórias ===\n`);
console.log('QUANTO O CARGO DEPENDE SÓ DA PERGUNTA 10');
console.log(`  No total:                       ${pct(decidedByQ10Alone, SAMPLES)}`);
for (const size of Object.keys(byGroupSize).sort()) {
  const bucket = byGroupSize[Number(size)];
  if (!bucket) continue;
  console.log(
    `  Em áreas com ${size} cargos:          ${pct(bucket.q10, bucket.total)}  (${bucket.total.toLocaleString('pt-BR')} jornadas)`,
  );
}

// --- 2. Sensibilidade a uma única resposta trocada ---------------------------

let areaChanged = 0;
let roleChanged = 0;
let roleChangedWhenAreaKept = 0;
let keptArea = 0;

for (let i = 0; i < SAMPLES; i += 1) {
  const answers = randomJourney();
  const before = computeResult(answers);

  // Troca uma das 8 perguntas gerais por outra alternativa qualquer.
  const questionId = pick(GENERAL_QUESTION_IDS);
  const question = generalQuestions.find((q) => q.id === questionId);
  if (!question) continue;
  const others = question.options.filter((o) => o.id !== answers[questionId]);
  const changed: AnswerMap = { ...answers, [questionId]: pick(others).id };

  // O grupo pode mudar; nesse caso as respostas 9 e 10 são refeitas, como no app.
  const stage = computeGroupStage(changed);
  if (stage.group !== before.group) {
    const pair = adaptiveQuestions[stage.group];
    changed.q9 = pick(pair[0].options).id;
    changed.q10 = pick(pair[1].options).id;
  }

  const after = computeResult(changed);
  if (after.group !== before.group) areaChanged += 1;
  else {
    keptArea += 1;
    if (after.role !== before.role) roleChangedWhenAreaKept += 1;
  }
  if (after.role !== before.role) roleChanged += 1;
}

console.log('\nSE A PESSOA TROCAR UMA DAS 8 RESPOSTAS GERAIS');
console.log(`  A área muda:                    ${pct(areaChanged, SAMPLES)}`);
console.log(`  A área se mantém:               ${pct(keptArea, SAMPLES)}`);
console.log(
  `  ...e mesmo assim o cargo muda:  ${pct(roleChangedWhenAreaKept, keptArea || 1)} dos casos em que a área se manteve`,
);
console.log(`  O cargo muda (qualquer motivo):  ${pct(roleChanged, SAMPLES)}`);

// --- 3. Perfil consistente: o quiz acerta quem tem preferência clara? --------

console.log('\nPERFIL CONSISTENTE (a pessoa escolhe a mesma área em N das 8 perguntas)');
for (const hits of [4, 5, 6, 7, 8]) {
  let correct = 0;
  const attempts = 20_000;

  for (let i = 0; i < attempts; i += 1) {
    const target = pick(GROUP_IDS) as GroupId;
    const order = [...GENERAL_QUESTION_IDS].sort(() => Math.random() - 0.5);
    const answers: AnswerMap = {};

    order.forEach((questionId, index) => {
      const question = generalQuestions.find((q) => q.id === questionId);
      if (!question) return;
      const option =
        index < hits
          ? question.options.find((o) => o.group === target)
          : pick(question.options.filter((o) => o.group !== target));
      if (option) answers[questionId] = option.id;
    });

    if (computeGroupStage(answers).group === target) correct += 1;
  }

  console.log(`  ${hits} de 8 respostas na mesma área → acerta a área em ${pct(correct, attempts)}`);
}
