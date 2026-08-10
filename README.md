# Quiz de Carreiras Nicopel

Quiz em formato de descoberta de perfil para a **Feira da Empregabilidade
UNOPAR**, em 13 de agosto de 2026, às 19h. A pessoa responde 10 perguntas
rápidas pelo celular (via QR code no estande) e descobre **um cargo que existe
de verdade** na estrutura da Nicopel Embalagens.

> Descubra em qual área o seu perfil se encaixa

**O que ainda depende da Nicopel está em [CONTENT_PENDING.md](./CONTENT_PENDING.md).**

---

## Sumário

- [Como funciona](#como-funciona)
- [Stack](#stack)
- [Instalação](#instalação)
- [Rodar localmente](#rodar-localmente)
- [Configurar o banco](#configurar-o-banco)
- [Editar conteúdo](#editar-conteúdo)
- [Painel administrativo](#painel-administrativo)
- [Rodar os testes](#rodar-os-testes)
- [Publicar na Vercel](#publicar-na-vercel)
- [Exportar as inscrições](#exportar-as-inscrições)
- [Checklist pré-evento](#checklist-pré-evento)
- [Exclusão dos dados após a finalidade](#exclusão-dos-dados-após-a-finalidade)
- [Decisões de projeto](#decisões-de-projeto)

---

## Como funciona

```
Landing → Introdução → 8 perguntas gerais → 2 perguntas adaptativas
        → Processamento (≤ 1,2 s) → Convite do sorteio (opcional)
        → Resultado (1 dos 16 cargos) → História da Nicopel → CTAs
```

**Camada 1 (perguntas 1–8).** Cada alternativa vale 1 ponto para um dos cinco
grupos (A a E). O grupo vencedor define quais serão as perguntas 9 e 10.
Empate: vence o primeiro grupo escolhido na sequência pergunta 8 → 6 → 5; se
nenhuma delas apontar para um dos empatados, a ordem canônica A–E resolve.

**Camada 2 (perguntas 9–10).** As alternativas apontam para cargos do grupo
vencedor, 1 ponto cada. Em empate, a pergunta 10 decide.

Toda a pontuação vive em [`src/lib/scoring.ts`](src/lib/scoring.ts): funções
puras, determinísticas e cobertas por testes. As mesmas respostas produzem
sempre o mesmo cargo.

### Grupos e cargos

| Grupo | Área | Cargos |
| ----- | ---- | ------ |
| A | Negócios & Logística | Comercial, Compras, Financeiro, Logística & Expedição |
| B | Comunicação & Tecnologia | Marketing, Design & Arte, Tecnologia da Informação |
| C | Pessoas, Saúde & Administração | RH, Administrativo & Gestão, Endomarketing, SST |
| D | Engenharia, Qualidade & Planejamento | Engenharia de Produção & PCP, Engenharia de Produto, Qualidade |
| E | Produção & Operação | Produção / Fabril, Operador de Máquinas |

### O sorteio é sempre opcional

O convite aparece **depois** do cálculo e **antes** da revelação. Recusar,
pular, fechar ou apertar `Esc` revela o resultado na hora, sem coletar nada.
Nenhuma opção vem pré-selecionada. Se o cadastro falhar, a pessoa vê o
resultado do mesmo jeito.

---

## Stack

| Camada | Escolha |
| ------ | ------- |
| Framework | Next.js 16 (App Router) + React 19 |
| Linguagem | TypeScript em modo estrito |
| Estilo | Tailwind CSS 4 |
| Formulário | React Hook Form + Zod 4 |
| Banco | Postgres + Drizzle ORM |
| Testes | Vitest (unitários) + Playwright (fluxo) |
| Deploy | Vercel |

Animações são CSS puro — nenhuma biblioteca de animação, nenhuma requisição
externa em tempo de execução. A fonte Inter é auto-hospedada no build.

---

## Instalação

Requer **Node.js 20 ou superior**.

```bash
npm install
```

```bash
cp .env.example .env.local
```

O quiz roda sem nenhuma variável configurada. Elas só são necessárias para o
sorteio (`DATABASE_URL`), o painel (`ADMIN_*`) e os metadados de produção
(`NEXT_PUBLIC_SITE_URL`).

---

## Rodar localmente

```bash
npm run dev
```

Abra <http://localhost:3000>.

| Script | O que faz |
| ------ | --------- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sem emitir |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes de fluxo (Playwright) |
| `npm run verify` | lint + tipos + testes + build |
| `npm run db:generate` | Gera as migrations a partir do schema |
| `npm run db:migrate` | Aplica as migrations |
| `npm run admin:hash` | Gera o hash da senha do painel |

---

## Configurar o banco

O banco é **opcional por design**: sem ele o quiz funciona inteiro e apenas a
inscrição no sorteio fica indisponível, com uma mensagem clara. Isso é o que
garante que o resultado nunca dependa da rede no dia do evento.

### 1. Provisionar

Na Vercel: **Storage → Create Database → Neon** (ou Supabase) pelo Marketplace.
A `DATABASE_URL` é injetada automaticamente nos ambientes escolhidos. Para rodar
local, copie a connection string para o `.env.local`.

### 2. Migrar

```bash
npm run db:migrate
```

O SQL versionado está em [`drizzle/`](./drizzle). Para alterar o schema, edite
[`src/lib/schema.ts`](src/lib/schema.ts), rode `npm run db:generate` e revise o
SQL gerado antes de aplicar.

### Modelo de dados

`raffle_entries` guarda uma linha por inscrição confirmada: nome, contato
(e-mail e/ou telefone normalizados), curso, instituição, resultado do quiz, os
dois consentimentos, a versão do texto aceito, os carimbos de tempo e
`deleted_at` para exclusão lógica.

Dois índices únicos parciais impedem que o mesmo contato se inscreva duas vezes
no mesmo evento — e, por ignorarem registros excluídos, permitem reinscrição
depois de uma remoção a pedido.

`admin_audit_log` registra exportações e exclusões, sem nenhum dado pessoal.

---

## Editar conteúdo

Todo o texto vive em `src/content/`. Nenhuma dessas edições exige mexer em
componentes.

| Arquivo | O que tem |
| ------- | --------- |
| [`site-content.ts`](src/content/site-content.ts) | Textos institucionais, evento, endereço, CTAs, links, consentimentos, privacidade |
| [`quiz.ts`](src/content/quiz.ts) | As 10 perguntas, alternativas, mapeamentos e regra de desempate |
| [`results.ts`](src/content/results.ts) | Os 16 resultados: título, resumo, habilidades, “na prática”, formações |
| [`collaborators.ts`](src/content/collaborators.ts) | Colaboradores reais |
| [`types.ts`](src/content/types.ts) | Tipos compartilhados |

### Alterar uma pergunta

Edite o `prompt` ou o `label` em `quiz.ts`. **Não mude os `id`s** de perguntas
ou alternativas depois que o quiz estiver no ar: eles são o que liga a resposta
salva na sessão ao mapeamento.

Cada pergunta geral precisa ter exatamente uma alternativa por grupo, e cada
pergunta adaptativa precisa cobrir todos os cargos do seu grupo. O teste
`validateQuizData()` reprova qualquer edição que quebre isso.

### Publicar um colaborador

Ver [`public/collaborators/README.md`](public/collaborators/README.md). Em
resumo: preencha cargo, foto, texto alternativo e depoimento, troque `status`
para `'confirmed'` e aponte `collaboratorId` no resultado correspondente.
Faltando qualquer campo, o card cai no placeholder institucional — é assim que
o projeto impede conteúdo inventado de ir ao ar.

### Alterar os textos de consentimento

Ao mudar `consent.raffle` ou `consent.opportunities`, **incremente
`CONSENT_VERSION`**. A versão aceita é gravada em cada inscrição e é a prova de
qual texto a pessoa leu.

---

## Painel administrativo

`/admin`, protegido no servidor, com `noindex` e sem nenhum segredo enviado ao
cliente.

### Configurar

```bash
npm run admin:hash -- "sua-senha-forte-de-verdade"
```

Copie a linha impressa para `ADMIN_PASSWORD_HASH`. Depois gere o segredo de
sessão:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Coloque em `ADMIN_SESSION_SECRET` (mínimo 32 caracteres). Sem as duas
variáveis, o painel permanece fechado e avisa que não está configurado — ele
nunca abre por falta de configuração.

### O que o painel faz

- total de inscrições confirmadas e quantas aceitaram receber vagas;
- distribuição por grupo e por cargo;
- lista pesquisável por nome, contato ou curso;
- exportação CSV em UTF-8;
- exclusão individual com confirmação em duas etapas;
- trilha de auditoria de exportações e exclusões.

**Não existe sorteio automatizado no sistema.** O CSV é a fonte oficial, e as
regras do sorteio são responsabilidade da Nicopel.

---

## Rodar os testes

```bash
npm run test
```

90 testes unitários cobrem a pontuação dos cinco grupos, todos os cenários de
empate, os 16 cargos, o desempate da pergunta 10, a integridade do conteúdo
(nenhuma pergunta sem mapeamento, nenhuma alternativa apontando para cargo de
outro grupo), a normalização de telefone e e-mail, a validação do formulário, a
deduplicação por contato e evento, o rate limit e a autenticação do admin.

```bash
npx playwright install chromium
npm run test:e2e
```

Os testes de fluxo cobrem: responder e ver o resultado, recusar o sorteio sem
entregar dado nenhum, pular o convite, fechar com `Esc`, voltar e alterar
respostas, recarregar recuperando o progresso, falha no cadastro sem bloquear o
resultado, navegação só por teclado, foco preso no modal,
`prefers-reduced-motion`, ausência de rolagem horizontal a 320 px, alvos de
toque de 44 px, zero requisições externas e o bloqueio do painel sem
autenticação.

Dois testes de admin ficam em `skip` sem ambiente configurado. Para rodá-los:

```bash
ADMIN_PASSWORD_HASH='scrypt$...' ADMIN_SESSION_SECRET='...' \
E2E_ADMIN_PASSWORD='sua-senha' DATABASE_URL='postgres://...' npm run test:e2e
```

---

## Publicar na Vercel

1. Suba o repositório para o GitHub (sugestão de nome: `quiz-carreiras-nicopel`).
2. Na Vercel: **Add New → Project** e importe o repositório. O Next.js é
   detectado sozinho.
3. **Storage → Create Database → Neon** (ou Supabase) e conecte ao projeto.
4. Configure as variáveis de ambiente em **Settings → Environment Variables**,
   para Preview **e** Production:

   | Variável | Preview | Production |
   | -------- | ------- | ---------- |
   | `DATABASE_URL` | banco de teste | banco de produção |
   | `ADMIN_PASSWORD_HASH` | ✅ | ✅ (senha diferente) |
   | `ADMIN_SESSION_SECRET` | ✅ | ✅ (segredo diferente) |
   | `NEXT_PUBLIC_SITE_URL` | URL de preview | URL final |
   | `DATA_RETENTION_DATE` | — | ✅ |
   | `STATUS_PAGE_TOKEN` | opcional | deixe vazio para desativar `/status` |

5. Rode as migrations apontando `DATABASE_URL` para o banco de produção:
   `npm run db:migrate`.
6. Configure o domínio em **Settings → Domains** (ex.: `quiz.nicopel.com.br`) e
   confirme que o HTTPS está válido.
7. Teste o deploy de preview no celular, ponta a ponta.
8. Promova para produção e teste de novo, em iOS e Android.
9. **Só então** gere o QR code, apontando para a URL de produção confirmada.
   Imprima a URL curta legível logo abaixo do QR code.
10. Mantenha o deploy anterior disponível na aba **Deployments** para rollback
    imediato (**⋯ → Promote to Production**).

---

## Exportar as inscrições

No painel, **Exportar CSV (UTF-8)**. O arquivo sai com BOM e separador `;`,
que é o que o Excel em português espera — abre com acentos corretos e colunas
separadas, sem assistente de importação.

Valores começando com `=`, `+`, `-` ou `@` são prefixados com aspa simples para
evitar injeção de fórmula ao abrir a planilha.

Colunas: nome, WhatsApp, e-mail, curso, instituição, área, cargo, consentimento
do sorteio, consentimento de oportunidades, versão do consentimento, data do
consentimento e data da inscrição.

---

## Checklist pré-evento

Conteúdo (detalhes em [CONTENT_PENDING.md](./CONTENT_PENDING.md)):

- [ ] nome oficial do evento confirmado
- [ ] data e horário confirmados
- [ ] URL do banco de talentos inserida
- [ ] política de privacidade publicada e revisada juridicamente
- [ ] período de retenção definido (`DATA_RETENTION_DATE`)
- [ ] regras do sorteio aprovadas
- [ ] responsáveis pela visita técnica definidos
- [ ] cargos e depoimentos dos colaboradores confirmados
- [ ] fotos autorizadas, otimizadas e no lugar
- [ ] logos oficiais em `public/brand/`

Técnico:

- [ ] `npm run verify` passa
- [ ] `npm run test:e2e` passa
- [ ] endereço e link do mapa testados no celular
- [ ] domínio e QR code testados em iOS **e** Android
- [ ] formulário testado na rede do evento (Wi-Fi e 4G)
- [ ] exportação CSV validada abrindo no Excel
- [ ] painel `/admin` acessível com a senha de produção
- [ ] `/status` desativado ou protegido por token
- [ ] deploy anterior disponível para rollback

No estande:

- [ ] QR code impresso e testado a partir de vários celulares
- [ ] URL curta impressa abaixo do QR code
- [ ] tablet/notebook carregado, com a página aberta e testada
- [ ] carregadores e cabos no local
- [ ] plano B combinado com a equipe: se a internet cair, o quiz funciona
      normalmente (só a inscrição no sorteio fica indisponível); anote os
      contatos interessados no papel e cadastre depois
- [ ] alguém da equipe sabe explicar que o quiz é uma experiência de descoberta
      e **não** garante vaga nem contratação

---

## Exclusão dos dados após a finalidade

Depois de realizado o sorteio e concluída a visita técnica, ou na data definida
em `DATA_RETENTION_DATE`:

1. Exporte o CSV final e guarde no local combinado pela Nicopel, com acesso
   restrito.
2. Exclua os dados do banco:

   ```sql
   -- Exclusão lógica primeiro, para conferir o número antes de apagar de vez.
   update raffle_entries
      set deleted_at = now()
    where event_code = 'unopar-2026-08-13'
      and deleted_at is null;

   -- Exclusão definitiva.
   delete from raffle_entries
    where event_code = 'unopar-2026-08-13';
   ```

3. Registre a exclusão no controle interno da Nicopel.

**Pedido individual de exclusão.** Chegando pelo e-mail
`contato@nicopel.com.br`, localize a pessoa pela busca do painel e use
**Excluir**. A exclusão é lógica, remove a pessoa de todas as listas e
exportações e libera o contato para uma nova inscrição, se ela quiser.

---

## Decisões de projeto

**O banco é opcional.** Um estande de feira tem Wi-Fi instável. O quiz inteiro
— perguntas, cálculo, resultado, história da empresa — é estático e não depende
de nenhuma chamada de rede. Só a inscrição no sorteio precisa do banco, e
quando ele falha a pessoa recebe uma mensagem honesta (“a participação ainda
não foi confirmada”) e um botão para ver o resultado assim mesmo.

**Nenhum dado pessoal em `localStorage`.** Só o progresso do quiz vai para
`sessionStorage`, e some ao fechar a aba. Os dados do sorteio vão direto do
formulário para o servidor.

**Nada de conteúdo inventado.** Cargos, fotos e depoimentos de colaboradores só
aparecem quando confirmados. `getPublishableCollaborator()` devolve `null` se
faltar qualquer campo essencial, e a interface cai no placeholder. Um teste
garante que nenhum colaborador marcado como pendente tenha cargo ou depoimento
preenchido.

**O botão “Avançar” fica visualmente apagado, mas continua clicável.** Um botão
realmente `disabled` deixaria a mensagem “escolha a opção que mais combina com
você” inalcançável para quem navega por teclado ou leitor de tela.

**O consentimento é validado no `superRefine`, não no schema base.** Uma falha
no schema base abortaria o parse e esconderia os outros erros — a pessoa
resolveria um problema de cada vez. Assim, todos os erros aparecem juntos.

**Analytics é anônimo e agregado.** Só marcos do funil e o grupo resultante.
Respostas individuais e dados pessoais nunca são enviados para analytics, e a
coleta é separada do banco do sorteio.

**Rate limit em memória.** É por instância, o que basta para um evento de
algumas horas e evita depender de um serviço externo. Para volume maior, troque
o store em [`src/lib/security.ts`](src/lib/security.ts) por Redis ou similar.
