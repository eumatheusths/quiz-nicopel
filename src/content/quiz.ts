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
 *
 * As perguntas falam de gostos e de jeito de ser — sábado livre, o que irrita,
 * como se compra algo caro — e nunca de tarefas de trabalho. É de propósito:
 * quando a alternativa descreve o cargo, a pessoa percebe o mapeamento e passa
 * a responder o que acha que "dá" o resultado que quer, em vez do que combina
 * com ela. Os `id`s são estáveis e não devem mudar depois da publicação: são
 * eles que ligam a resposta salva na sessão ao mapeamento.
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
    prompt: 'É sábado e o dia é todo seu. O que te dá mais prazer?',
    options: [
      {
        id: 'q1-A',
        group: 'A',
        icon: 'route',
        insight: 'Movimento e bom negócio',
        label: 'Resolver umas coisas na rua e ainda achar uma promoção no caminho',
      },
      {
        id: 'q1-B',
        group: 'B',
        icon: 'sparkles',
        insight: 'Curiosidade por novidade',
        label: 'Descobrir uma coisa nova: um app, uma playlist, um vídeo aleatório',
      },
      {
        id: 'q1-C',
        group: 'C',
        icon: 'heart',
        insight: 'Vínculo com as pessoas',
        label: 'Um encontro tranquilo com as pessoas de quem você gosta',
      },
      {
        id: 'q1-D',
        group: 'D',
        icon: 'clipboard',
        insight: 'Ordem e método',
        label: 'Organizar aquela coisa que estava te incomodando há semanas',
      },
      {
        id: 'q1-E',
        group: 'E',
        icon: 'wrench',
        insight: 'Mão na massa',
        label: 'Botar a mão em algo: consertar, montar, cozinhar, cuidar de algo',
      },
    ],
  },
  {
    id: 'q2',
    prompt: 'Qual dessas coisas mais te tira do sério?',
    options: [
      {
        id: 'q2-A',
        group: 'A',
        icon: 'handshake',
        insight: 'Compromisso e prazo',
        label: 'Promessa não cumprida e tempo perdido esperando',
      },
      {
        id: 'q2-B',
        group: 'B',
        icon: 'lightbulb',
        insight: 'Inquietação criativa',
        label: 'Tudo sempre igual, do mesmo jeito, sem nada novo',
      },
      {
        id: 'q2-C',
        group: 'C',
        icon: 'users',
        insight: 'Sensibilidade ao clima',
        label: 'Clima pesado, gente se estranhando por besteira',
      },
      {
        id: 'q2-D',
        group: 'D',
        icon: 'ruler',
        insight: 'Exigência de padrão',
        label: 'Coisa mal feita, torta, entregue de qualquer jeito',
      },
      {
        id: 'q2-E',
        group: 'E',
        icon: 'gear',
        insight: 'Vontade de agir',
        label: 'Ficar parado esperando, sem poder resolver',
      },
    ],
  },
  {
    id: 'q3',
    prompt: 'Um amigo vai se mudar e chamou todo mundo para ajudar. Você acaba sendo quem...',
    options: [
      {
        id: 'q3-A',
        group: 'A',
        icon: 'truck',
        insight: 'Articulação e recursos',
        label: 'Acerta o combinado: horário, quem leva o quê, quanto vai custar',
      },
      {
        id: 'q3-B',
        group: 'B',
        icon: 'palette',
        insight: 'Visão do que pode ser',
        label: 'Já imagina como a casa nova vai ficar depois de tudo no lugar',
      },
      {
        id: 'q3-C',
        group: 'C',
        icon: 'heart',
        insight: 'Cuidado com o grupo',
        label: 'Cuida do pessoal: leva comida, anima, vê quem está cansado',
      },
      {
        id: 'q3-D',
        group: 'D',
        icon: 'calendar',
        insight: 'Planejamento antecipado',
        label: 'Faz o plano: o que sai primeiro, o que vai em qual caixa',
      },
      {
        id: 'q3-E',
        group: 'E',
        icon: 'factory',
        insight: 'Execução direta',
        label: 'Pega no pesado e vai carregando, sem muita conversa',
      },
    ],
  },
  {
    id: 'q4',
    prompt: 'Qual elogio te deixaria mais feliz?',
    options: [
      {
        id: 'q4-A',
        group: 'A',
        icon: 'target',
        insight: 'Fazer acontecer',
        label: '“Com você por perto, as coisas acontecem.”',
      },
      {
        id: 'q4-B',
        group: 'B',
        icon: 'lightbulb',
        insight: 'Originalidade',
        label: '“Você tem cada ideia que ninguém pensaria.”',
      },
      {
        id: 'q4-C',
        group: 'C',
        icon: 'users',
        insight: 'Escuta e acolhimento',
        label: '“Falar com você me deixa mais leve.”',
      },
      {
        id: 'q4-D',
        group: 'D',
        icon: 'search',
        insight: 'Atenção fina',
        label: '“Não passa nada despercebido por você.”',
      },
      {
        id: 'q4-E',
        group: 'E',
        icon: 'wrench',
        insight: 'Habilidade prática',
        label: '“Você tem mão boa, faz bem-feito.”',
      },
    ],
  },
  {
    id: 'q5',
    prompt: 'Você chega pela primeira vez a um lugar movimentado. O que sua cabeça repara primeiro?',
    options: [
      {
        id: 'q5-A',
        group: 'A',
        icon: 'coins',
        insight: 'Leitura de valor',
        label: 'O movimento do lugar, quanto custam as coisas, quem manda ali',
      },
      {
        id: 'q5-B',
        group: 'B',
        icon: 'palette',
        insight: 'Repertório visual',
        label: 'O visual: as cores, a música, o jeito que tudo foi montado',
      },
      {
        id: 'q5-C',
        group: 'C',
        icon: 'heart',
        insight: 'Leitura de pessoas',
        label: 'As pessoas: quem está à vontade, quem parece deslocado',
      },
      {
        id: 'q5-D',
        group: 'D',
        icon: 'clipboard',
        insight: 'Percepção de ordem',
        label: 'Como tudo está organizado e o que está fora do lugar',
      },
      {
        id: 'q5-E',
        group: 'E',
        icon: 'gear',
        insight: 'Curiosidade técnica',
        label: 'Como as coisas funcionam ali: os equipamentos, os detalhes',
      },
    ],
  },
  {
    id: 'q6',
    prompt: 'Você ganhou um curso livre, de graça, sobre o que quiser. Qual você escolhe?',
    options: [
      {
        id: 'q6-A',
        group: 'A',
        icon: 'handshake',
        insight: 'Persuasão',
        label: 'Falar em público e negociar bem',
      },
      {
        id: 'q6-B',
        group: 'B',
        icon: 'monitor',
        insight: 'Criação e tecnologia',
        label: 'Edição de vídeo, design ou programação',
      },
      {
        id: 'q6-C',
        group: 'C',
        icon: 'users',
        insight: 'Interesse por gente',
        label: 'Psicologia e relações no dia a dia',
      },
      {
        id: 'q6-D',
        group: 'D',
        icon: 'chart',
        insight: 'Raciocínio analítico',
        label: 'Análise de dados e planilhas avançadas',
      },
      {
        id: 'q6-E',
        group: 'E',
        icon: 'factory',
        insight: 'Domínio manual',
        label: 'Oficina prática: máquinas, marcenaria, elétrica',
      },
    ],
  },
  {
    id: 'q7',
    prompt: 'Você vai comprar uma coisa cara, daquelas de pensar bem. O que pesa mais?',
    options: [
      {
        id: 'q7-A',
        group: 'A',
        icon: 'coins',
        insight: 'Faro para o custo',
        label: 'O preço e se ainda dá para conseguir uma condição melhor',
      },
      {
        id: 'q7-B',
        group: 'B',
        icon: 'sparkles',
        insight: 'Estética e novidade',
        label: 'O design e se é o mais moderno do momento',
      },
      {
        id: 'q7-C',
        group: 'C',
        icon: 'heart',
        insight: 'Confiança nas pessoas',
        label: 'A indicação de alguém que você confia',
      },
      {
        id: 'q7-D',
        group: 'D',
        icon: 'search',
        insight: 'Decisão por evidência',
        label: 'As especificações, os testes e as avaliações detalhadas',
      },
      {
        id: 'q7-E',
        group: 'E',
        icon: 'check-badge',
        insight: 'Percepção de qualidade',
        label: 'Pegar na mão, sentir o acabamento, ver se é firme',
      },
    ],
  },
  {
    id: 'q8',
    prompt: 'No fim de um dia muito bom, o que te faz dormir satisfeito?',
    options: [
      {
        id: 'q8-A',
        group: 'A',
        icon: 'target',
        insight: 'Compromisso cumprido',
        label: 'Ter resolvido pendências e cumprido tudo que você prometeu',
      },
      {
        id: 'q8-B',
        group: 'B',
        icon: 'sparkles',
        insight: 'Criação',
        label: 'Ter criado algo que de manhã ainda não existia',
      },
      {
        id: 'q8-C',
        group: 'C',
        icon: 'users',
        insight: 'Impacto em alguém',
        label: 'Ter ajudado alguém a destravar uma situação',
      },
      {
        id: 'q8-D',
        group: 'D',
        icon: 'gear',
        insight: 'Controle e previsibilidade',
        label: 'Ter deixado tudo redondo, organizado e sob controle',
      },
      {
        id: 'q8-E',
        group: 'E',
        icon: 'box',
        insight: 'Resultado tangível',
        label: 'Ter visto o resultado pronto, concreto, na sua frente',
      },
    ],
  },
];

export const adaptiveQuestions: Record<GroupId, readonly [AdaptiveQuestion, AdaptiveQuestion]> = {
  A: [
    {
      id: 'q9',
      group: 'A',
      prompt: 'Numa viagem em grupo, qual papel sobra para você naturalmente?',
      options: [
        {
          id: 'q9A-comercial',
          role: 'comercial',
          icon: 'handshake',
          insight: 'Relacionamento',
          label: 'Falar com todo mundo e conseguir as melhores condições',
        },
        {
          id: 'q9A-compras',
          role: 'compras',
          icon: 'search',
          insight: 'Pesquisa',
          label: 'Pesquisar tudo antes e achar a opção que vale mais a pena',
        },
        {
          id: 'q9A-financeiro',
          role: 'financeiro',
          icon: 'coins',
          insight: 'Controle dos números',
          label: 'Cuidar da vaquinha e fazer as contas fecharem certo',
        },
        {
          id: 'q9A-logistica',
          role: 'logistica',
          icon: 'route',
          insight: 'Roteiro e prazo',
          label: 'Montar o roteiro e garantir que ninguém perca horário',
        },
      ],
    },
    {
      id: 'q10',
      group: 'A',
      prompt: 'Qual dessas frases é mais a sua cara?',
      options: [
        {
          id: 'q10A-comercial',
          role: 'comercial',
          icon: 'users',
          insight: 'Facilidade com gente',
          label: '“Eu me dou bem com quase todo mundo.”',
        },
        {
          id: 'q10A-compras',
          role: 'compras',
          icon: 'cart',
          insight: 'Comparação antes de decidir',
          label: '“Eu não compro nada sem pesquisar bastante antes.”',
        },
        {
          id: 'q10A-financeiro',
          role: 'financeiro',
          icon: 'chart',
          insight: 'Clareza com dinheiro',
          label: '“Eu sei exatamente quanto tenho na conta agora.”',
        },
        {
          id: 'q10A-logistica',
          role: 'logistica',
          icon: 'calendar',
          insight: 'Pontualidade',
          label: '“Eu detesto chegar atrasado em qualquer lugar.”',
        },
      ],
    },
  ],
  B: [
    {
      id: 'q9',
      group: 'B',
      prompt: 'Tarde livre, internet à vontade. Você acaba fazendo o quê?',
      options: [
        {
          id: 'q9B-marketing',
          role: 'marketing',
          icon: 'megaphone',
          insight: 'Leitura de público',
          label: 'Vendo o que está bombando e tentando entender por que viralizou',
        },
        {
          id: 'q9B-design',
          role: 'design',
          icon: 'palette',
          insight: 'Composição visual',
          label: 'Mexendo em cores, fontes e montando alguma arte',
        },
        {
          id: 'q9B-ti',
          role: 'ti',
          icon: 'monitor',
          insight: 'Investigação técnica',
          label: 'Descobrindo como algo funciona por dentro ou automatizando uma chatice',
        },
      ],
    },
    {
      id: 'q10',
      group: 'B',
      prompt: 'O que te dá mais satisfação?',
      options: [
        {
          id: 'q10B-marketing',
          role: 'marketing',
          icon: 'sparkles',
          insight: 'Repercussão',
          label: 'Ver muita gente comentando uma coisa que você fez',
        },
        {
          id: 'q10B-design',
          role: 'design',
          icon: 'ruler',
          insight: 'Precisão estética',
          label: 'Ver o resultado ficar exatamente como você imaginou',
        },
        {
          id: 'q10B-ti',
          role: 'ti',
          icon: 'gear',
          insight: 'Problema resolvido',
          label: 'Ver funcionando depois de você ter descoberto o problema',
        },
      ],
    },
  ],
  C: [
    {
      id: 'q9',
      group: 'C',
      prompt: 'No seu grupo de amigos, você costuma ser quem...',
      options: [
        {
          id: 'q9C-rh',
          role: 'rh',
          icon: 'heart',
          insight: 'Escuta',
          label: 'Escuta os perrengues de todo mundo e dá um conselho',
        },
        {
          id: 'q9C-administrativo',
          role: 'administrativo',
          icon: 'clipboard',
          insight: 'Organização',
          label: 'Organiza tudo e lembra dos prazos que os outros esquecem',
        },
        {
          id: 'q9C-endomarketing',
          role: 'endomarketing',
          icon: 'megaphone',
          insight: 'Mobilização',
          label: 'Anima, chama todo mundo e faz o rolê realmente acontecer',
        },
        {
          id: 'q9C-sst',
          role: 'sst',
          icon: 'shield',
          insight: 'Prevenção',
          label: 'Repara no risco e avisa antes de alguém se machucar',
        },
      ],
    },
    {
      id: 'q10',
      group: 'C',
      prompt: 'De qual dessas coisas você não abre mão?',
      options: [
        {
          id: 'q10C-rh',
          role: 'rh',
          icon: 'users',
          insight: 'Respeito',
          label: 'Que as pessoas se sintam respeitadas do jeito que são',
        },
        {
          id: 'q10C-administrativo',
          role: 'administrativo',
          icon: 'clipboard',
          insight: 'Ordem',
          label: 'Que as coisas estejam em ordem e fáceis de achar',
        },
        {
          id: 'q10C-endomarketing',
          role: 'endomarketing',
          icon: 'sparkles',
          insight: 'Pertencimento',
          label: 'Que ninguém fique de fora nem sem saber o que está rolando',
        },
        {
          id: 'q10C-sst',
          role: 'sst',
          icon: 'shield',
          insight: 'Segurança',
          label: 'Que todo mundo volte para casa inteiro no fim do dia',
        },
      ],
    },
  ],
  D: [
    {
      id: 'q9',
      group: 'D',
      prompt: 'Montando um móvel novo em casa, você é do tipo que...',
      options: [
        {
          id: 'q9D-pcp',
          role: 'pcp',
          icon: 'calendar',
          insight: 'Sequência e tempo',
          label: 'Separa todas as peças e define a ordem antes de começar',
        },
        {
          id: 'q9D-engenharia-produto',
          role: 'engenharia-produto',
          icon: 'ruler',
          insight: 'Melhoria do projeto',
          label: 'Repara no projeto e já pensa em como poderia ser melhor',
        },
        {
          id: 'q9D-qualidade',
          role: 'qualidade',
          icon: 'check-badge',
          insight: 'Conferência',
          label: 'Confere cada parafuso e o acabamento no final',
        },
      ],
    },
    {
      id: 'q10',
      group: 'D',
      prompt: 'O que te incomoda mais?',
      options: [
        {
          id: 'q10D-pcp',
          role: 'pcp',
          icon: 'chart',
          insight: 'Desperdício de tempo',
          label: 'Perder tempo por pura falta de planejamento',
        },
        {
          id: 'q10D-engenharia-produto',
          role: 'engenharia-produto',
          icon: 'box',
          insight: 'Solução mal pensada',
          label: 'Uma solução mal pensada que dá problema depois',
        },
        {
          id: 'q10D-qualidade',
          role: 'qualidade',
          icon: 'search',
          insight: 'Fora do padrão',
          label: 'Um detalhe fora do padrão que ninguém mais notou',
        },
      ],
    },
  ],
  E: [
    {
      id: 'q9',
      group: 'E',
      prompt: 'Trabalhando em algo prático, o que combina mais com você?',
      options: [
        {
          id: 'q9E-producao',
          role: 'producao',
          icon: 'users',
          insight: 'Ritmo de time',
          label: 'Estar junto do time, cada um numa parte, no mesmo ritmo',
        },
        {
          id: 'q9E-operador-maquinas',
          role: 'operador-maquinas',
          icon: 'gear',
          insight: 'Domínio de equipamento',
          label: 'Dominar um equipamento e tirar o melhor dele',
        },
      ],
    },
    {
      id: 'q10',
      group: 'E',
      prompt: 'Você se orgulharia mais de...',
      options: [
        {
          id: 'q10E-producao',
          role: 'producao',
          icon: 'factory',
          insight: 'Entrega coletiva',
          label: 'Ver o resultado do time pronto no fim do dia',
        },
        {
          id: 'q10E-operador-maquinas',
          role: 'operador-maquinas',
          icon: 'wrench',
          insight: 'Especialidade técnica',
          label: 'Saber ajustar aquilo que mais ninguém sabe ajustar',
        },
      ],
    },
  ],
};
