/**
 * Gera `docs/PERGUNTAS-E-RESPOSTAS.md` a partir do conteúdo do quiz.
 *
 *   npx tsx scripts/gerar-doc-perguntas.mts
 *
 * O documento é gerado, e não escrito à mão, de propósito: assim ele nunca
 * diverge de `src/content/quiz.ts`. Depois de editar qualquer pergunta, rode
 * este script de novo.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { adaptiveQuestions, generalQuestions, groups, TIEBREAK_ORDER } from '../src/content/quiz';
import { results } from '../src/content/results';
import { GROUP_IDS } from '../src/content/types';

const OUT = 'docs/PERGUNTAS-E-RESPOSTAS.md';

/** Escapa `|` para não quebrar as tabelas do Markdown. */
function cell(text: string): string {
  return text.replace(/\|/g, '\\|');
}

const lines: string[] = [];
const write = (line = '') => lines.push(line);

write('# Perguntas e respostas do quiz');
write();
write('> Documento gerado automaticamente a partir de `src/content/quiz.ts`.');
write('> Para atualizar: `npx tsx scripts/gerar-doc-perguntas.mts`');
write();
write(
  'Todo participante responde **10 perguntas**: as 8 primeiras são iguais para todo mundo e definem a **área**; as 2 últimas mudam conforme a área e definem o **cargo**.',
);
write();

// --------------------------------------------------------------- Como pontua
write('## Como a pontuação funciona');
write();
write(
  '**Camada 1 — perguntas 1 a 8.** Cada pergunta tem exatamente uma alternativa por área. A alternativa escolhida vale 1 ponto para a sua área. A área com mais pontos vence e define quais serão as perguntas 9 e 10.',
);
write();
write(
  `**Empate.** Vence a área da primeira resposta encontrada nesta sequência: ${TIEBREAK_ORDER.map((q) => `pergunta ${q.replace('q', '')}`).join(' → ')}. A área que ficar em segundo lugar aparece no resultado como "Você também pode explorar".`,
);
write();
write(
  '**Camada 2 — perguntas 9 e 10.** Cada alternativa vale 1 ponto para um cargo da área vencedora. Se as duas respostas apontarem para o mesmo cargo, ele vence com 2 pontos. Se apontarem para cargos diferentes, **a pergunta 10 decide**.',
);
write();
write(
  '**Importante:** durante o quiz, nada indica para onde cada alternativa aponta. As perguntas falam de gostos e de jeito de ser, nunca de tarefas de trabalho — é o que impede a pessoa de "escolher" o resultado que quer.',
);
write();

// ------------------------------------------------------------- Resumo áreas
write('## As 5 áreas e os 16 cargos');
write();
write('| Área | Cargos |');
write('| --- | --- |');
for (const groupId of GROUP_IDS) {
  const group = groups[groupId];
  const roleNames = group.roles.map((role) => results[role].name).join(', ');
  write(`| **${cell(group.name)}** (${groupId}) | ${cell(roleNames)} |`);
}
write();
write('---');
write();

// ------------------------------------------- Parte 1: por área (o pedido)
write('## Parte 1 — Respostas que levam a cada área');
write();
write(
  'Esta é a leitura por segmento: para cada área, a alternativa que aponta para ela em cada uma das 8 perguntas gerais, e as perguntas de cargo daquela área.',
);
write();

for (const groupId of GROUP_IDS) {
  const group = groups[groupId];

  write(`### ${group.name}`);
  write();
  write(`*${group.tagline}*`);
  write();
  write(`**Cargos possíveis:** ${group.roles.map((role) => results[role].name).join(' · ')}`);
  write();
  write('#### Perguntas 1 a 8 — alternativa que soma ponto para esta área');
  write();
  write('| # | Pergunta | Alternativa que leva a esta área | Traço revelado |');
  write('| --- | --- | --- | --- |');

  generalQuestions.forEach((question, index) => {
    const option = question.options.find((candidate) => candidate.group === groupId);
    if (!option) return;
    write(
      `| ${index + 1} | ${cell(question.prompt)} | ${cell(option.label)} | ${cell(option.insight)} |`,
    );
  });

  write();
  write('#### Perguntas 9 e 10 — definem o cargo dentro desta área');
  write();

  adaptiveQuestions[groupId].forEach((question, index) => {
    write(`**Pergunta ${9 + index}.** ${question.prompt}`);
    write();
    write('| Alternativa | Leva ao cargo | Traço revelado |');
    write('| --- | --- | --- |');
    for (const option of question.options) {
      write(
        `| ${cell(option.label)} | **${cell(results[option.role].name)}** | ${cell(option.insight)} |`,
      );
    }
    write();
  });

  write('---');
  write();
}

// ---------------------------------- Parte 2: perguntas gerais na íntegra
write('## Parte 2 — As 8 perguntas gerais, com todas as alternativas');
write();
write('A ordem das alternativas é embaralhada na tela a cada sessão. A ordem abaixo é a do código.');
write();

generalQuestions.forEach((question, index) => {
  write(`### Pergunta ${index + 1}`);
  write();
  write(`**${question.prompt}**`);
  write();
  write('| Alternativa | Área | Traço revelado |');
  write('| --- | --- | --- |');
  for (const option of question.options) {
    write(
      `| ${cell(option.label)} | ${cell(groups[option.group].name)} | ${cell(option.insight)} |`,
    );
  }
  write();
});

write('---');
write();

// ------------------------------------------- Parte 3: perguntas adaptativas
write('## Parte 3 — As perguntas 9 e 10, por área');
write();
write(
  'A pessoa vê apenas o par correspondente à área que venceu nas 8 primeiras perguntas. Ninguém responde mais de um par.',
);
write();

for (const groupId of GROUP_IDS) {
  write(`### ${groups[groupId].name}`);
  write();
  adaptiveQuestions[groupId].forEach((question, index) => {
    write(`**Pergunta ${9 + index}.** ${question.prompt}`);
    write();
    for (const option of question.options) {
      write(`- ${option.label} → **${results[option.role].name}**`);
    }
    write();
  });
}

write('---');
write();

// ------------------------------------------------------ Parte 4: resultados
write('## Parte 4 — O que cada cargo entrega como resultado');
write();

for (const groupId of GROUP_IDS) {
  write(`### ${groups[groupId].name}`);
  write();
  for (const roleId of groups[groupId].roles) {
    const result = results[roleId];
    write(`#### ${result.name}`);
    write();
    write(`*${result.headline}*`);
    write();
    write(result.summary);
    write();
    write(`**Habilidades:** ${result.skills.join(' · ')}`);
    write();
    write('**Na prática, você pode:**');
    for (const item of result.inPractice) write(`- ${item}`);
    write();
    write(`**Formações:** ${result.education.join(' · ')}`);
    write();
  }
}

// ------------------------------------------------------------ Conferências
write('---');
write();
write('## Conferência de integridade');
write();

const totalGeneral = generalQuestions.length;
const totalOptions = generalQuestions.reduce((sum, q) => sum + q.options.length, 0);
const totalAdaptiveOptions = GROUP_IDS.reduce(
  (sum, groupId) =>
    sum + adaptiveQuestions[groupId].reduce((inner, q) => inner + q.options.length, 0),
  0,
);
const totalRoles = GROUP_IDS.reduce((sum, groupId) => sum + groups[groupId].roles.length, 0);

write('| Item | Valor |');
write('| --- | --- |');
write(`| Perguntas gerais | ${totalGeneral} |`);
write(`| Alternativas gerais | ${totalOptions} (${totalGeneral} × 5 áreas) |`);
write(`| Pares de perguntas adaptativas | ${GROUP_IDS.length} (um por área) |`);
write(`| Alternativas adaptativas | ${totalAdaptiveOptions} |`);
write(`| Cargos possíveis | ${totalRoles} |`);
write(`| Perguntas por participante | 10 |`);
write();
write(
  'O teste `validateQuizData()` reprova o build se alguma pergunta ficar sem alternativa de uma área, se uma alternativa apontar para cargo de outra área ou se houver id duplicado.',
);
write();

await mkdir('docs', { recursive: true });
await writeFile(OUT, `${lines.join('\n')}\n`, 'utf8');
console.log(`${OUT} gerado — ${lines.length} linhas`);
