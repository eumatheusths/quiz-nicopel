# Fotos dos colaboradores

Coloque aqui as fotos em retrato dos colaboradores que aparecerão nos cards de
resultado. Sugestão de nome: `<id>.webp`, usando o mesmo `id` de
`src/content/collaborators.ts` (por exemplo, `comercial-vendas.webp`).

## Como publicar um colaborador

1. Confirme com a pessoa: cargo exato, depoimento de ~3 linhas e autorização de
   uso de imagem por escrito.
2. Coloque a foto aqui (retrato 3:4, ≥ 600 px de largura, WebP, ~150 KB).
3. Em `src/content/collaborators.ts`, preencha `role`, `photo`, `photoAlt`,
   `quote` (e `tenure`, se confirmado) e troque `status` para `'confirmed'`.

Enquanto qualquer um desses campos estiver faltando, o card cai automaticamente
no placeholder institucional. **Nunca** deduza cargo a partir de redes sociais
nem escreva um depoimento no lugar da pessoa.
