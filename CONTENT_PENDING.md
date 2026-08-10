# Conteúdo pendente

Tudo o que precisa ser confirmado pela Nicopel **antes do deploy de produção**.
Nada nesta lista bloqueia o desenvolvimento: o site funciona inteiro hoje, com
placeholders elegantes no lugar do que ainda falta.

Legenda: 🔴 bloqueia a publicação · 🟡 melhora bastante a experiência · ⚪ opcional

---

## 🔴 Bloqueiam a publicação

| # | Item | Onde alterar | Situação |
| - | ---- | ------------ | -------- |
| 1 | **URL do banco de talentos** | `src/content/site-content.ts` → `links.talentPool` | `[URL_DO_BANCO_DE_TALENTOS]`. Sem ela, o resultado mostra um aviso pedindo para falar com a equipe no estande, em vez de um link inventado. |
| 2 | **URL da política de privacidade completa** | `src/content/site-content.ts` → `links.privacyPolicy` | `[URL_POLITICA_PRIVACIDADE]`. A página `/privacidade` avisa que ela será publicada. |
| 3 | **Data de exclusão dos dados (retenção)** | variável de ambiente `DATA_RETENTION_DATE` | Não definida. A `/privacidade` mostra “pendente de definição” e garante exclusão sob pedido. |
| 4 | **Revisão jurídica do aviso de privacidade** | `src/content/site-content.ts` → `privacy` | O texto foi escrito em linguagem simples e precisa de validação jurídica da Nicopel. |
| 5 | **Regras oficiais do sorteio** | — | Quem pode participar, como e quando é o sorteio, como o ganhador é avisado, data da visita. O sistema **não** sorteia: o CSV exportado é a fonte oficial. |
| 6 | **Logos oficiais** | `public/brand/` | Ver `public/brand/README.md`. Hoje há um marcador tipográfico neutro. |
| 7 | **Senha e segredo do painel** | `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` | Sem eles o `/admin` fica fechado e avisa que não está configurado. |
| 8 | **Banco de dados** | `DATABASE_URL` | Sem ele o quiz roda inteiro, mas a inscrição no sorteio fica indisponível. |
| 9 | **URL final de produção** | `NEXT_PUBLIC_SITE_URL` | Necessária para os metadados e para o link de compartilhamento. |

---

## 🟡 Colaboradores — cargo, foto e depoimento

**Regra absoluta:** nada aqui pode ser deduzido de redes sociais ou inventado.
Enquanto faltar qualquer campo, o card mostra o placeholder institucional
(“Conheça alguém desta área”). Editar em `src/content/collaborators.ts` e
`public/collaborators/`.

| Pessoa | Área | Cargo exato | Foto | Depoimento (~3 linhas) | Tempo de casa |
| ------ | ---- | ----------- | ---- | ---------------------- | ------------- |
| Michele **ou** Alysson | Vendas / Comercial | ❌ | ❌ | ❌ | ❌ |
| Max | ❌ a definir | ❌ | ❌ | ❌ | ❌ |
| Lindomar | ❌ a definir | ❌ | ❌ | ❌ | ❌ |
| Jennifer | ❌ a definir | ❌ | ❌ | ❌ | ❌ |
| Gustavo | ❌ a definir | ❌ | ❌ | ❌ | ❌ |
| Derciel | ❌ a definir | ❌ | ❌ | ❌ | ❌ |
| Nicolas | ❌ a definir | ❌ | ❌ | ❌ | ❌ |

Para o resultado **Comercial** já existe o vínculo `comercial-vendas`; falta
decidir se o card será da Michele ou do Alysson e preencher os dados.

Os outros 15 resultados ainda não têm colaborador vinculado. Ao confirmar uma
pessoa, aponte `collaboratorId` no resultado correspondente em
`src/content/results.ts`.

### O que pedir para cada pessoa

1. Cargo exato, como consta no RH.
2. Foto em retrato, com autorização de uso de imagem por escrito.
3. Depoimento curto (2 a 4 frases) sobre o que ela faz e o que gosta no trabalho.
4. Tempo de Nicopel (opcional — só é exibido se confirmado).

---

## 🟡 Fotos reais

| Foto | Arquivo | Onde aparece |
| ---- | ------- | ------------ |
| Parque fabril / composição com embalagens | `public/factory/hero.webp` | Topo da home |
| Equipe na linha de produção | `public/factory/producao.webp` | Bloco “O que a gente faz” |

Ver `public/factory/README.md`. Sem elas, entra uma composição gráfica de
dobras de papel — nunca banco de imagem.

---

## ⚪ Confirmações do evento

| Item | Valor atual | Onde alterar |
| ---- | ----------- | ------------ |
| Nome do evento | Feira da Empregabilidade UNOPAR | `site-content.ts` → `event.name` |
| Data e hora | 13/08/2026 às 19h | `site-content.ts` → `event.dateLabel` / `timeLabel` |
| Código do evento | `unopar-2026-08-13` | `site-content.ts` → `event.code` (⚠️ não alterar depois que houver inscrições: é a chave de deduplicação) |
| Endereço da visita | Rod. Carlos João Strass, 780 — Jardim Tropical, Londrina — PR | `site-content.ts` → `company.address` |
| E-mail de contato LGPD | contato@nicopel.com.br | `site-content.ts` → `company.contactEmail` |
| Responsáveis pela visita técnica | não definidos | — |
| Domínio / subdomínio | a definir (sugestão: `quiz.nicopel.com.br`) | Vercel |

---

## ⚪ Textos que podem ser revisados

Nada aqui está errado, mas vale a leitura do Marketing antes do evento:

- os 16 resumos e títulos de resultado (`src/content/results.ts`);
- as 10 perguntas e suas alternativas (`src/content/quiz.ts`);
- os textos de interface (`src/content/site-content.ts`).

Se o texto de consentimento mudar, **incremente `CONSENT_VERSION`** em
`site-content.ts`: a versão aceita é gravada junto de cada inscrição.
