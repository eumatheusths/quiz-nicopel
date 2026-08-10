import type {
  AdaptiveQuestion,
  GeneralQuestion,
  GroupDefinition,
  GroupId,
  QuestionId,
} from './types';

/**
 * Perguntas, opções e mapeamentos do quiz.
 *
 * Camada 1 (perguntas 1 a 8): cada alternativa vale 1 ponto para um grupo.
 * Camada 2 (perguntas 9 e 10): variam conforme o grupo vencedor e valem
 * 1 ponto para um cargo daquele grupo.
 */

export const TOTAL_QUESTIONS = 10;

export const groups: Record<GroupId, GroupDefinition> = {
  A: {
    id: 'A',
    name: 'Negócios & Logística',
    tagline: 'Relacionamento, números e o movimento que faz tudo chegar.',
    roles: ['comercial', 'compras', 'financeiro', 'logistica'],
  },
  B: {
    id: 'B',
    name: 'Comunicação & Tecnologia',
    tagline: 'Ideias, imagem e sistemas que conectam a Nicopel ao mundo.',
    roles: ['marketing', 'design', 'ti'],
  },
  C: {
    id: 'C',
    name: 'Pessoas, Saúde & Administração',
    tagline: 'Gente, cultura, organização e cuidado com quem faz acontecer.',
    roles: ['rh', 'administrativo', 'endomarketing', 'sst'],
  },
  D: {
    id: 'D',
    name: 'Engenharia, Qualidade & Planejamento',
    tagline: 'Processos, padrões e projetos que sustentam a produção.',
    roles: ['pcp', 'engenharia-produto', 'qualidade'],
  },
  E: {
    id: 'E',
    name: 'Produção & Operação',
    tagline: 'Prática, ritmo e precisão no chão de fábrica.',
    roles: ['producao', 'operador-maquinas'],
  },
};

/**
 * Ordem de desempate da camada 1: entre os grupos empatados, vence o primeiro
 * escolhido nesta sequência de perguntas.
 */
export const TIEBREAK_ORDER: readonly QuestionId[] = ['q8', 'q6', 'q5'] as const;

export const generalQuestions: readonly GeneralQuestion[] = [
  {
    id: 'q1',
    prompt: 'Quando aparece um desafio em um trabalho de equipe, você naturalmente...',
    options: [
      {
        id: 'q1-A',
        group: 'A',
        icon: 'handshake',
        label: 'Conversa com as pessoas, alinha recursos e faz o combinado andar',
      },
      {
        id: 'q1-B',
        group: 'B',
        icon: 'lightbulb',
        label: 'Imagina um jeito mais criativo, visual ou tecnológico de resolver',
      },
      {
        id: 'q1-C',
        group: 'C',
        icon: 'users',
        label: 'Escuta o grupo, organiza a colaboração e ajuda todos a se entenderem',
      },
      {
        id: 'q1-D',
        group: 'D',
        icon: 'chart',
        label: 'Separa o problema em etapas e procura onde está o gargalo',
      },
      {
        id: 'q1-E',
        group: 'E',
        icon: 'wrench',
        label: 'Parte para a prática, testa e ajusta até funcionar',
      },
    ],
  },
  {
    id: 'q2',
    prompt: 'Você recebeu a missão de organizar um evento em 24 horas. Qual parte escolheria primeiro?',
    options: [
      {
        id: 'q2-A',
        group: 'A',
        icon: 'coins',
        label: 'Orçamento, fornecedores, materiais e transporte',
      },
      {
        id: 'q2-B',
        group: 'B',
        icon: 'palette',
        label: 'Identidade visual, divulgação e ferramentas digitais',
      },
      {
        id: 'q2-C',
        group: 'C',
        icon: 'users',
        label: 'Equipe, acolhimento e divisão das responsabilidades',
      },
      {
        id: 'q2-D',
        group: 'D',
        icon: 'calendar',
        label: 'Cronograma, checklist, riscos e padrão de qualidade',
      },
      {
        id: 'q2-E',
        group: 'E',
        icon: 'wrench',
        label: 'Montagem do espaço, equipamentos e execução',
      },
    ],
  },
  {
    id: 'q3',
    prompt: 'Qual dessas pequenas vitórias dá mais satisfação?',
    options: [
      {
        id: 'q3-A',
        group: 'A',
        icon: 'handshake',
        label: 'Uma boa negociação e tudo entregue no prazo',
      },
      {
        id: 'q3-B',
        group: 'B',
        icon: 'sparkles',
        label: 'Uma ideia ganhando forma ou um sistema ficando mais inteligente',
      },
      {
        id: 'q3-C',
        group: 'C',
        icon: 'heart',
        label: 'Alguém se sentindo ouvido e o time mais unido',
      },
      {
        id: 'q3-D',
        group: 'D',
        icon: 'gear',
        label: 'Um processo ficando eficiente e sem retrabalho',
      },
      {
        id: 'q3-E',
        group: 'E',
        icon: 'target',
        label: 'Uma meta saindo do papel com ritmo e qualidade',
      },
    ],
  },
  {
    id: 'q4',
    prompt: 'Se você pudesse escolher uma superpotência profissional, qual seria?',
    options: [
      {
        id: 'q4-A',
        group: 'A',
        icon: 'handshake',
        label: 'Entender situações e negociar soluções boas para todos',
      },
      {
        id: 'q4-B',
        group: 'B',
        icon: 'monitor',
        label: 'Transformar qualquer ideia em uma mensagem, imagem ou automação',
      },
      {
        id: 'q4-C',
        group: 'C',
        icon: 'users',
        label: 'Aproximar pessoas e fazer o melhor de cada uma aparecer',
      },
      {
        id: 'q4-D',
        group: 'D',
        icon: 'chart',
        label: 'Prever problemas antes que aconteçam usando dados e planejamento',
      },
      {
        id: 'q4-E',
        group: 'E',
        icon: 'gear',
        label: 'Aprender rapidamente a operar qualquer equipamento',
      },
    ],
  },
  {
    id: 'q5',
    prompt: 'O plano A falhou faltando cinco minutos para a entrega. Você...',
    options: [
      {
        id: 'q5-A',
        group: 'A',
        icon: 'handshake',
        label: 'Comunica as partes, renegocia e protege o compromisso',
      },
      {
        id: 'q5-B',
        group: 'B',
        icon: 'lightbulb',
        label: 'Cria uma alternativa rápida usando criatividade ou tecnologia',
      },
      {
        id: 'q5-C',
        group: 'C',
        icon: 'heart',
        label: 'Acalma o grupo e reorganiza a equipe',
      },
      {
        id: 'q5-D',
        group: 'D',
        icon: 'search',
        label: 'Identifica a causa e reconstrói o plano pelas etapas críticas',
      },
      {
        id: 'q5-E',
        group: 'E',
        icon: 'wrench',
        label: 'Vai ao ponto prático do problema e tenta corrigir na hora',
      },
    ],
  },
  {
    id: 'q6',
    prompt: 'Qual ambiente desperta mais a sua curiosidade?',
    options: [
      {
        id: 'q6-A',
        group: 'A',
        icon: 'route',
        label: 'Conversas com clientes, negociações, números e rotas',
      },
      {
        id: 'q6-B',
        group: 'B',
        icon: 'monitor',
        label: 'Telas, ideias visuais, campanhas e tecnologia',
      },
      {
        id: 'q6-C',
        group: 'C',
        icon: 'heart',
        label: 'Pessoas, cultura, desenvolvimento e bem-estar',
      },
      {
        id: 'q6-D',
        group: 'D',
        icon: 'ruler',
        label: 'Indicadores, protótipos, processos e padrões',
      },
      {
        id: 'q6-E',
        group: 'E',
        icon: 'factory',
        label: 'Fábrica, equipamentos e transformação acontecendo ao vivo',
      },
    ],
  },
  {
    id: 'q7',
    prompt: 'Alguém entrega uma embalagem totalmente em branco. Qual é seu primeiro pensamento?',
    options: [
      {
        id: 'q7-A',
        group: 'A',
        icon: 'truck',
        label: 'Para quem ela serve, quanto custa e como chegará até o cliente',
      },
      {
        id: 'q7-B',
        group: 'B',
        icon: 'palette',
        label: 'Qual história, visual ou experiência ela pode transmitir',
      },
      {
        id: 'q7-C',
        group: 'C',
        icon: 'users',
        label: 'Como as pessoas envolvidas podem colaborar para ela acontecer',
      },
      {
        id: 'q7-D',
        group: 'D',
        icon: 'ruler',
        label: 'Como torná-la viável, eficiente e dentro do padrão',
      },
      {
        id: 'q7-E',
        group: 'E',
        icon: 'factory',
        label: 'Como ela será produzida e quais máquinas serão usadas',
      },
    ],
  },
  {
    id: 'q8',
    prompt: 'No fim de um projeto, qual frase você mais gostaria de ouvir?',
    options: [
      {
        id: 'q8-A',
        group: 'A',
        icon: 'target',
        label: '“Você fez acontecer e cumprimos o combinado.”',
      },
      {
        id: 'q8-B',
        group: 'B',
        icon: 'sparkles',
        label: '“Sua ideia mudou a forma como as pessoas enxergam ou usam isso.”',
      },
      {
        id: 'q8-C',
        group: 'C',
        icon: 'users',
        label: '“O time trabalhou melhor porque você estava junto.”',
      },
      {
        id: 'q8-D',
        group: 'D',
        icon: 'gear',
        label: '“O processo ficou redondo, confiável e bem planejado.”',
      },
      {
        id: 'q8-E',
        group: 'E',
        icon: 'check-badge',
        label: '“O resultado saiu com capricho, precisão e ritmo.”',
      },
    ],
  },
];

export const adaptiveQuestions: Record<GroupId, readonly [AdaptiveQuestion, AdaptiveQuestion]> = {
  A: [
    {
      id: 'q9',
      group: 'A',
      prompt: 'Uma missão relâmpago caiu no seu colo. Qual você escolheria?',
      options: [
        {
          id: 'q9A-comercial',
          role: 'comercial',
          icon: 'handshake',
          label: 'Entender o que um cliente precisa e montar a melhor proposta',
        },
        {
          id: 'q9A-compras',
          role: 'compras',
          icon: 'cart',
          label: 'Comparar fornecedores e negociar a melhor condição',
        },
        {
          id: 'q9A-financeiro',
          role: 'financeiro',
          icon: 'coins',
          label: 'Organizar custos e descobrir se os números fecham',
        },
        {
          id: 'q9A-logistica',
          role: 'logistica',
          icon: 'truck',
          label: 'Planejar estoque, rota e prazo para tudo chegar certo',
        },
      ],
    },
    {
      id: 'q10',
      group: 'A',
      prompt: 'Qual elogio combina mais com você?',
      options: [
        {
          id: 'q10A-comercial',
          role: 'comercial',
          icon: 'handshake',
          label: '“Você entende as pessoas e cria relações de confiança.”',
        },
        {
          id: 'q10A-compras',
          role: 'compras',
          icon: 'search',
          label: '“Você pesquisa bem e sempre encontra a escolha mais inteligente.”',
        },
        {
          id: 'q10A-financeiro',
          role: 'financeiro',
          icon: 'chart',
          label: '“Com você, os números ficam claros e as decisões mais seguras.”',
        },
        {
          id: 'q10A-logistica',
          role: 'logistica',
          icon: 'route',
          label: '“Você faz muitas peças se moverem sem perder o prazo.”',
        },
      ],
    },
  ],
  B: [
    {
      id: 'q9',
      group: 'B',
      prompt: 'A Nicopel vai lançar uma embalagem nova. Em qual frente você entraria?',
      options: [
        {
          id: 'q9B-marketing',
          role: 'marketing',
          icon: 'megaphone',
          label: 'Criar a campanha e conectar a novidade ao público',
        },
        {
          id: 'q9B-design',
          role: 'design',
          icon: 'palette',
          label: 'Desenvolver o visual e preparar a arte com todos os detalhes',
        },
        {
          id: 'q9B-ti',
          role: 'ti',
          icon: 'monitor',
          label: 'Criar ou integrar a tecnologia que dará suporte ao lançamento',
        },
      ],
    },
    {
      id: 'q10',
      group: 'B',
      prompt: 'Qual resultado dá mais orgulho?',
      options: [
        {
          id: 'q10B-marketing',
          role: 'marketing',
          icon: 'sparkles',
          label: 'Uma campanha gerando conversa, interesse e oportunidades',
        },
        {
          id: 'q10B-design',
          role: 'design',
          icon: 'palette',
          label: 'Uma arte bonita, funcional e impecável na impressão',
        },
        {
          id: 'q10B-ti',
          role: 'ti',
          icon: 'gear',
          label: 'Um sistema funcionando bem e facilitando o trabalho de todos',
        },
      ],
    },
  ],
  C: [
    {
      id: 'q9',
      group: 'C',
      prompt: 'Em um grande projeto interno, qual papel você escolheria?',
      options: [
        {
          id: 'q9C-rh',
          role: 'rh',
          icon: 'heart',
          label: 'Acolher, desenvolver e apoiar as pessoas',
        },
        {
          id: 'q9C-administrativo',
          role: 'administrativo',
          icon: 'clipboard',
          label: 'Organizar processos, documentos, recursos e indicadores',
        },
        {
          id: 'q9C-endomarketing',
          role: 'endomarketing',
          icon: 'megaphone',
          label: 'Criar a campanha e fazer a informação chegar com energia',
        },
        {
          id: 'q9C-sst',
          role: 'sst',
          icon: 'shield',
          label: 'Mapear riscos e garantir uma execução segura e saudável',
        },
      ],
    },
    {
      id: 'q10',
      group: 'C',
      prompt: 'Qual impacto você gostaria de deixar no trabalho?',
      options: [
        {
          id: 'q10C-rh',
          role: 'rh',
          icon: 'users',
          label: 'Pessoas crescendo e encontrando espaço para desenvolver seus talentos',
        },
        {
          id: 'q10C-administrativo',
          role: 'administrativo',
          icon: 'clipboard',
          label: 'Uma operação organizada, clara e sustentável',
        },
        {
          id: 'q10C-endomarketing',
          role: 'endomarketing',
          icon: 'sparkles',
          label: 'Colaboradores informados, conectados e com orgulho de pertencer',
        },
        {
          id: 'q10C-sst',
          role: 'sst',
          icon: 'shield',
          label: 'Todos trabalhando com segurança e voltando bem para casa',
        },
      ],
    },
  ],
  D: [
    {
      id: 'q9',
      group: 'D',
      prompt: 'Uma embalagem nova precisa entrar em produção. O que mais chama sua atenção?',
      options: [
        {
          id: 'q9D-pcp',
          role: 'pcp',
          icon: 'calendar',
          label: 'Capacidade, sequência, prazo e organização da produção',
        },
        {
          id: 'q9D-engenharia-produto',
          role: 'engenharia-produto',
          icon: 'ruler',
          label: 'Especificações, materiais, testes e viabilidade técnica',
        },
        {
          id: 'q9D-qualidade',
          role: 'qualidade',
          icon: 'check-badge',
          label: 'Inspeção, padrão, conformidade e prevenção de falhas',
        },
      ],
    },
    {
      id: 'q10',
      group: 'D',
      prompt: 'Qual desafio você escolheria resolver?',
      options: [
        {
          id: 'q10D-pcp',
          role: 'pcp',
          icon: 'chart',
          label: 'Encaixar pedidos e recursos para tudo acontecer no tempo certo',
        },
        {
          id: 'q10D-engenharia-produto',
          role: 'engenharia-produto',
          icon: 'box',
          label: 'Transformar uma ideia em um produto que possa ser fabricado',
        },
        {
          id: 'q10D-qualidade',
          role: 'qualidade',
          icon: 'search',
          label: 'Garantir consistência e eliminar causas de não conformidade',
        },
      ],
    },
  ],
  E: [
    {
      id: 'q9',
      group: 'E',
      prompt: 'Na fábrica, qual missão combina mais com você?',
      options: [
        {
          id: 'q9E-producao',
          role: 'producao',
          icon: 'factory',
          label: 'Acompanhar o fluxo, colaborar em diferentes etapas e manter o ritmo',
        },
        {
          id: 'q9E-operador-maquinas',
          role: 'operador-maquinas',
          icon: 'gear',
          label: 'Configurar, operar e acompanhar de perto um equipamento',
        },
      ],
    },
    {
      id: 'q10',
      group: 'E',
      prompt: 'Qual frase parece mais com o seu jeito de trabalhar?',
      options: [
        {
          id: 'q10E-producao',
          role: 'producao',
          icon: 'users',
          label: '“Gosto de ver o time transformar matéria-prima em resultado.”',
        },
        {
          id: 'q10E-operador-maquinas',
          role: 'operador-maquinas',
          icon: 'wrench',
          label: '“Gosto de dominar detalhes técnicos e tirar o melhor de uma máquina.”',
        },
      ],
    },
  ],
};
