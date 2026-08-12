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

## Como preparar cada foto

Retrato (3:4), rosto centralizado, mínimo 600 px de largura, WebP com qualidade
80, até ~150 KB. Para converter a partir de um JPG/PNG:

```bash
npx sharp-cli -i foto-original.jpg -o public/collaborators/michele.webp resize 600 800 --fit cover
```

Ou use o script de assets do projeto como referência: `scripts/prepare-assets.mjs`.

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
