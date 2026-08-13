# Fotos dos colaboradores

O código já aponta para estes arquivos. **Basta colocá-los nesta pasta com
exatamente estes nomes** — nenhuma alteração de código é necessária, a foto
aparece sozinha no próximo carregamento.

| Arquivo | Pessoa | Aparece no resultado |
| --- | --- | --- |
| `michele.webp` | Michele — Líder do Setor Comercial | Comercial |
| `jeniffer.webp` | Jeniffer — Analista de Departamento Pessoal | Recursos Humanos |
| `max.webp` | Max — Supervisor Administrativo | Administrativo & Gestão |
| `gustavo.webp` | Gustavo — Supervisor de P&D, Design e Pré-Impressão | Design & Arte |
| `lindomar.webp` | Lindomar — Líder Mecânico e Eletrônico | Operador de Máquinas |
| `nicolas.webp` | Nicolas — Líder do Setor de Acoplagem | Produção / Fabril |
| `alysson.webp` | Alysson — Analista de Vendas | reserva do card de Comercial |
| `derciel.webp` | Derciel — Supervisor de TI | Tecnologia da Informação |

Enquanto o arquivo não existir, `PhotoFrame` mostra a composição gráfica de
dobras de papel. Nada quebra: o card continua exibindo nome, cargo e depoimento.

## Como adicionar ou trocar uma foto

Os arquivos desta pasta são **gerados**. Não edite nem otimize à mão:

1. Coloque o original em `assets-originais/collaborators/`, nomeado com o `id`
   da pessoa (`michele.png`, `derciel.jpg`...). Maiúsculas não importam.
2. Rode `npm run assets:colaboradores`.

O script recorta em retrato 3:4 mantendo a cabeça no topo e gera o par
`.webp` + `.avif` aqui. Os originais ficam fora do git — são ~1,7 MB cada e
não precisam ser versionados nem servidos.

## Antes de publicar

1. **Autorização de uso de imagem por escrito** de cada pessoa — guardar no
   controle interno da Nicopel.
2. Conferir se o cargo em `src/content/collaborators.ts` bate com o que consta
   no RH.
3. Comercial tem duas pessoas confirmadas. Michele está no card; para trocar
   por Alysson, aponte `collaboratorId` do cargo `comercial`, em
   `src/content/results.ts`, para `'alysson'`.

**Nunca** deduza cargo a partir de redes sociais nem escreva um depoimento no
lugar da pessoa.
