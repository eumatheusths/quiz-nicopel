import type { Collaborator } from './types';

/**
 * Colaboradores reais da Nicopel.
 *
 * REGRA ABSOLUTA: nada aqui pode ser deduzido de redes sociais nem inventado.
 * Cargo, depoimento e tempo de casa vêm exatamente do que a própria pessoa
 * contou. Quem não tiver cargo confirmado fica com `role: null` e
 * `status: 'pending'` — a interface cai no placeholder institucional em vez de
 * exibir um card incompleto ou um cargo presumido.
 *
 * As fotos apontam para `public/collaborators/<id>.webp`. Enquanto o arquivo
 * não existir, `PhotoFrame` mostra a composição gráfica de dobras de papel;
 * assim que o arquivo for colocado lá, a foto aparece sozinha, sem mudar código.
 */
export const collaborators: Record<string, Collaborator> = {
  michele: {
    id: 'michele',
    name: 'Michele',
    role: 'Líder do Setor Comercial',
    photo: '/collaborators/michele.webp',
    photoAlt: 'Michele, líder do Setor Comercial da Nicopel Embalagens.',
    quote:
      'Entrei na Nicopel em 2021 como vendedora e, ao longo dessa trajetória, tive a oportunidade de aprender, crescer e assumir novos desafios. Hoje, como líder do Setor Comercial, vejo o quanto cada experiência contribuiu para a profissional que me tornei.',
    tenure: 'Na Nicopel desde 2021',
    status: 'confirmed',
  },

  jeniffer: {
    id: 'jeniffer',
    name: 'Jeniffer',
    role: 'Analista de Departamento Pessoal',
    photo: '/collaborators/jeniffer.webp',
    photoAlt: 'Jeniffer, analista de Departamento Pessoal da Nicopel Embalagens.',
    quote:
      'Comecei minha trajetória na Nicopel em 2024, no Financeiro, e hoje tenho a oportunidade de atuar como Analista de Departamento Pessoal, em Recursos Humanos. Mais do que uma mudança de setor, essa experiência representa confiança, crescimento e a certeza de que, quando a empresa acredita no nosso potencial, podemos ir muito além do que imaginamos.',
    tenure: 'Na Nicopel desde 2024',
    status: 'confirmed',
  },

  max: {
    id: 'max',
    name: 'Max',
    role: 'Supervisor Administrativo',
    photo: '/collaborators/max.webp',
    photoAlt: 'Max, supervisor administrativo da Nicopel Embalagens.',
    quote:
      'Comecei na Nicopel em 2023, como Analista de Faturamento. Hoje sou Supervisor Administrativo, atuando na gestão de processos, pessoas e resultados. Aprendi a ter uma visão mais ampla do negócio e desenvolvi habilidades de liderança, gestão e tomada de decisão.',
    tenure: 'Na Nicopel desde 2023',
    status: 'confirmed',
  },

  gustavo: {
    id: 'gustavo',
    name: 'Gustavo',
    role: 'Supervisor de P&D, Design e Pré-Impressão',
    photo: '/collaborators/gustavo.webp',
    photoAlt: 'Gustavo, supervisor de P&D, Design e Pré-Impressão da Nicopel Embalagens.',
    // Frase que o próprio Gustavo destacou ao fim do depoimento.
    quote:
      'Iniciei em 2019 na área de Design Gráfico e hoje sou Supervisor de P&D, Design e Pré-Impressão. Na Nicopel, tive a oportunidade de crescer profissionalmente, ampliar minha visão sobre a produção gráfica e contribuir diretamente para a evolução dos processos e das tecnologias da empresa.',
    tenure: 'Na Nicopel desde 2019',
    status: 'confirmed',
  },

  lindomar: {
    id: 'lindomar',
    name: 'Lindomar',
    role: 'Líder Mecânico e Eletrônico',
    photo: '/collaborators/lindomar.webp',
    photoAlt: 'Lindomar, líder mecânico e eletrônico da Nicopel Embalagens.',
    quote:
      'Entrei como impressor offset há 11 anos. Fui um dos primeiros impressores certificados no SENAI e ensinei muitos impressores. Gosto de dar o meu melhor e estar sempre colaborando com a empresa. Hoje sou líder mecânico e eletrônico.',
    tenure: '11 anos de Nicopel',
    status: 'confirmed',
  },

  nicolas: {
    id: 'nicolas',
    name: 'Nicolas',
    role: 'Líder do Setor de Acoplagem',
    photo: '/collaborators/nicolas.webp',
    photoAlt: 'Nicolas, líder do setor de acoplagem da Nicopel Embalagens.',
    quote:
      'Entrei na Nicopel em 2017, comecei no setor de embalagem, fazendo pacotes. Fui aprendendo nas máquinas, passei para operador de máquina e hoje sou líder do setor de acoplagem. Para mim foi importante o aprendizado nas máquinas, com as pessoas e como líder.',
    tenure: 'Na Nicopel desde 2017',
    status: 'confirmed',
  },

  // Comercial tem duas pessoas confirmadas: Michele está no card do resultado
  // e Alysson fica disponível para trocar (basta apontar `collaboratorId` do
  // cargo `comercial` em results.ts para 'alysson').

  alysson: {
    id: 'alysson',
    name: 'Alysson',
    role: 'Analista de Vendas',
    photo: '/collaborators/alysson.webp',
    photoAlt: 'Alysson, analista de vendas da Nicopel Embalagens.',
    quote:
      'Entrei na Nicopel em 2022, iniciando minha trajetória na área de Produção. Hoje faço parte do Comercial, e nesse período tive a oportunidade de adquirir novos conhecimentos, desenvolver minhas habilidades e crescer profissionalmente dentro da empresa.',
    tenure: 'Na Nicopel desde 2022',
    status: 'confirmed',
  },

  derciel: {
    id: 'derciel',
    name: 'Derciel',
    role: 'Supervisor de TI',
    photo: '/collaborators/derciel.webp',
    photoAlt: 'Derciel, supervisor de TI da Nicopel Embalagens.',
    quote:
      'Entrei na Nicopel em outubro de 2023 e foi uma das maiores experiências, pois no começo tudo era muito novo ainda. Fui acompanhando a evolução da empresa durante esses quase 3 anos e sempre me senti em casa. Os colaboradores são competentes e dispostos a acreditar nos nossos objetivos, principalmente a diretoria, que sempre nos apoia desde as pequenas coisas. Sou muito grato por estar no Grupo Nicopel!',
    tenure: 'Na Nicopel desde outubro de 2023',
    status: 'confirmed',
  },
};

/**
 * Retorna o colaborador somente se ele estiver totalmente confirmado.
 * Qualquer campo essencial ausente devolve `null`, e o resultado cai no
 * placeholder — é isso que impede a exibição de conteúdo incompleto.
 *
 * A foto não entra nesta checagem de propósito: um card com nome, cargo e
 * depoimento reais já vale, e a moldura cuida da ausência do arquivo.
 */
export function getPublishableCollaborator(id: string | null): Collaborator | null {
  if (!id) return null;
  const person = collaborators[id];
  if (!person) return null;
  if (person.status !== 'confirmed') return null;
  if (!person.role || !person.quote) return null;
  return person;
}
