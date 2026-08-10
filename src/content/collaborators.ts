import type { Collaborator } from './types';

/**
 * Colaboradores reais da Nicopel.
 *
 * REGRA ABSOLUTA: nada aqui pode ser deduzido de redes sociais nem inventado.
 * Enquanto `status` for `pending`, a interface exibe o placeholder institucional
 * definido em `site-content.ts` (`collaboratorPlaceholder`) — nunca um cargo,
 * foto ou depoimento presumido.
 *
 * Para publicar um colaborador:
 *  1. preencha `role`, `photo`, `photoAlt`, `quote` (e `tenure`, se confirmado);
 *  2. troque `status` para `'confirmed'`;
 *  3. coloque a foto autorizada em `public/collaborators/<arquivo>.webp`;
 *  4. registre a autorização de imagem no controle interno da Nicopel.
 */
export const collaborators: Record<string, Collaborator> = {
  'comercial-vendas': {
    id: 'comercial-vendas',
    // Michele ou Alysson — Vendas/Comercial. Definir qual pessoa será exibida.
    name: '[DEFINIR: Michele ou Alysson]',
    role: null, // [INSERIR CARGO EXATO]
    photo: null, // [INSERIR FOTO AUTORIZADA]
    photoAlt: null,
    quote: null, // [INSERIR DEPOIMENTO REAL DE 3 LINHAS]
    tenure: null,
    status: 'pending',
  },
  max: {
    id: 'max',
    name: 'Max',
    role: null,
    photo: null,
    photoAlt: null,
    quote: null,
    tenure: null,
    status: 'pending',
  },
  lindomar: {
    id: 'lindomar',
    name: 'Lindomar',
    role: null,
    photo: null,
    photoAlt: null,
    quote: null,
    tenure: null,
    status: 'pending',
  },
  jennifer: {
    id: 'jennifer',
    name: 'Jennifer',
    role: null,
    photo: null,
    photoAlt: null,
    quote: null,
    tenure: null,
    status: 'pending',
  },
  gustavo: {
    id: 'gustavo',
    name: 'Gustavo',
    role: null,
    photo: null,
    photoAlt: null,
    quote: null,
    tenure: null,
    status: 'pending',
  },
  derciel: {
    id: 'derciel',
    name: 'Derciel',
    role: null,
    photo: null,
    photoAlt: null,
    quote: null,
    tenure: null,
    status: 'pending',
  },
  nicolas: {
    id: 'nicolas',
    name: 'Nicolas',
    role: null,
    photo: null,
    photoAlt: null,
    quote: null,
    tenure: null,
    status: 'pending',
  },
};

/**
 * Retorna o colaborador somente se ele estiver totalmente confirmado.
 * Qualquer campo essencial ausente devolve `null`, e o resultado cai no
 * placeholder — é isso que impede a exibição de conteúdo incompleto.
 */
export function getPublishableCollaborator(id: string | null): Collaborator | null {
  if (!id) return null;
  const person = collaborators[id];
  if (!person) return null;
  if (person.status !== 'confirmed') return null;
  if (!person.role || !person.quote) return null;
  return person;
}
