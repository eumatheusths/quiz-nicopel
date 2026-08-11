/**
 * Conteúdo institucional, textos de interface, links e dados do evento.
 *
 * Tudo que precisa ser confirmado pela Nicopel antes do deploy está marcado
 * com o prefixo `[` e listado em CONTENT_PENDING.md. Use `isPending()` para
 * detectar esses valores na interface em vez de comparar strings soltas.
 */

/** Um valor ainda não confirmado é escrito entre colchetes. */
export function isPending(value: string): boolean {
  return value.startsWith('[') && value.endsWith(']');
}

export const event = {
  name: 'Feira da Empregabilidade UNOPAR',
  /** Usado como chave de deduplicação no banco. Não alterar depois do evento. */
  code: 'unopar-2026-08-13',
  dateLabel: '13/08/2026',
  timeLabel: '19h',
  shortLabel: 'Feira da Empregabilidade UNOPAR • 13/08/2026 • 19h',
  defaultInstitution: 'UNOPAR',
} as const;

export const company = {
  name: 'Nicopel Embalagens',
  site: 'https://www.nicopel.com.br/',
  contactEmail: 'contato@nicopel.com.br',
  address: {
    line1: 'Rod. Carlos João Strass, 780 — Jardim Tropical',
    line2: 'Londrina — PR',
    full: 'Rod. Carlos João Strass, 780 — Jardim Tropical, Londrina — PR',
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('Nicopel Embalagens, Rod. Carlos João Strass, 780, Jardim Tropical, Londrina - PR'),
  },
  group: ['Nicopel Embalagens', 'Nicobox', 'Nicocup'],
} as const;

export const links = {
  /** PENDENTE: URL oficial do banco de talentos. */
  talentPool: '[URL_DO_BANCO_DE_TALENTOS]',
  /** PENDENTE: URL da política de privacidade completa da Nicopel. */
  privacyPolicy: '[URL_POLITICA_PRIVACIDADE]',
  companySite: company.site,
  mapUrl: company.address.mapUrl,
} as const;

export const history = {
  intro:
    'Tudo começou em novembro de 2000, em um espaço de 30 m², com a vontade de transformar papel em soluções. O que nasceu pequeno cresceu com trabalho, dedicação e foco em qualidade. Hoje, com 26 anos de história, a Nicopel é uma indústria nacional que combina tradição e tecnologia, mantendo a essência de cuidar das pessoas enquanto constrói o futuro.',
  shortAfterResult:
    'A Nicopel nasceu em 30 m² e cresceu unindo pessoas, tecnologia e vontade de fazer bem-feito. Hoje, atende todo o Brasil a partir de um parque fabril de 6.000 m² em Londrina.',
  timeline: [
    { year: '2000', text: 'Início em 30 m², produzindo caixas de pizza em serigrafia.' },
    { year: '2008', text: 'Galpão de 400 m², novos produtos e atuação regional.' },
    { year: '2013', text: 'Primeira impressora offset e um salto de qualidade.' },
    { year: '2021', text: 'Novo parque fabril de 6.000 m² e atendimento nacional.' },
    {
      year: '2026',
      text: 'Atuação nacional consolidada e expansão com o lançamento do e-commerce.',
    },
  ],
} as const;

export const numbers = [
  { value: '26', unit: 'anos', label: 'de história' },
  { value: '6.000', unit: 'm²', label: 'de parque fabril' },
  { value: '+160', unit: '', label: 'colaboradores' },
  { value: '~4', unit: 'milhões', label: 'de embalagens por mês' },
  { value: '~1.500', unit: '', label: 'clientes atendidos por mês' },
] as const;

export const whatWeDo = {
  text: 'A Nicopel desenvolve embalagens de papel personalizadas para o food service e para a indústria. O processo integra arte, planejamento, impressão offset, corte-vinco, acabamento e logística, com tecnologia e alto padrão de qualidade em cada etapa.',
  products: [
    'Caixas de pizza',
    'Tampas e potes de sorvete',
    'Copos',
    'Soluções industriais sob medida',
  ],
} as const;

export const sustainability =
  'A Nicopel produz com material biodegradável, matéria-prima renovável e tintas à base de óleo de soja, livres de chumbo. Logística reversa, controle de aparas, descarte consciente e fornecedores certificados ajudam a reduzir a pegada de carbono. Produzir com responsabilidade faz parte de quem a empresa é.';

export const culture =
  'A Nicopel é uma empresa familiar em essência e profissional em estrutura. A diretoria é presente e acessível, as lideranças se desenvolvem continuamente e a empresa investe em saúde integral, tecnologia e treinamentos. Respeito, honestidade, igualdade, comprometimento e orgulho em pertencer fazem parte da cultura.';

export const landing = {
  hero: 'Descubra através do quiz em qual área o seu perfil se encaixa',
  subtitle:
    'Responda a 10 perguntas rápidas e descubra qual caminho dentro da indústria tem mais a ver com você.',
  badge: 'Quiz rápido • 2 a 3 minutos',
  primaryCta: 'Começar o quiz',
  secondaryCta: 'Conhecer a Nicopel',
  welcome:
    'Aqui não existe resposta certa ou errada. Escolha o que mais combina com seu jeito e descubra uma possibilidade de carreira dentro da Nicopel.',
} as const;

export const quizUi = {
  progress: (current: number, total: number) => `Pergunta ${current} de ${total}`,
  validation: 'Escolha a opção que mais combina com você para continuar.',
  next: 'Avançar',
  back: 'Voltar',
  finish: 'Ver meu resultado',
  restart: 'Recomeçar',
  restartConfirm: 'Quer recomeçar o quiz? Suas respostas atuais serão apagadas.',
  processingTitle: 'Conectando seus pontos fortes...',
  processingText:
    'Estamos encontrando a área da Nicopel que mais combina com o seu jeito de fazer acontecer.',
} as const;

export const resultUi = {
  eyebrow: 'Seu perfil mostrou afinidade com',
  inPracticeTitle: 'Na prática, você pode...',
  skillsTitle: 'Habilidades que combinam',
  educationTitle: 'Formações correlacionadas',
  secondaryTitle: 'Você também pode explorar',
  secondaryText: (area: string) =>
    `Seu perfil também mostrou pontos de conexão com ${area}. Carreiras não cabem em uma única caixa — e isso é uma ótima notícia.`,
  disclaimer:
    'Este quiz é uma experiência de descoberta profissional. O resultado indica afinidades e não limita as suas possibilidades de carreira.',
  historyTitle: 'Talentos diferentes constroem a mesma história',
  collaboratorSeal: 'Quem já faz acontecer por aqui',
  collaboratorPlaceholder: {
    title: 'Conheça alguém desta área',
    text: 'Em breve, você verá aqui a história de uma pessoa que constrói essa área todos os dias na Nicopel.',
  },
  talentPool: {
    title: 'Seu próximo passo pode começar aqui',
    text: 'Conheça oportunidades de estágio, vagas CLT e caminhos de crescimento na Nicopel.',
    cta: 'Entrar no banco de talentos',
  },
  share: 'Compartilhar meu resultado',
  downloadPdf: 'Baixar meu resultado em PDF',
  shareCopied: 'Link copiado!',
  retake: 'Refazer o quiz',
  openMap: 'Abrir no mapa',
} as const;

/** Cadastro exibido antes das perguntas começarem. */
export const registration = {
  title: 'Antes de começar, se apresente',
  subtitle:
    'Precisamos só do básico para registrar sua participação e falar com você se for sorteado.',
  submit: 'Começar o quiz',
  submitting: 'Salvando...',
  retry: 'Tentar novamente',
  continueAnyway: 'Continuar sem salvar',
  errorText:
    'Não conseguimos salvar seu cadastro agora. Você pode tentar novamente ou seguir para o quiz mesmo assim.',
  privacyLinkLabel: 'Como seus dados serão usados?',
  fields: {
    fullName: 'Nome completo',
    phone: 'WhatsApp',
    email: 'E-mail',
    age: 'Idade',
  },
  ageHint: 'anos',
} as const;

/** Convite para o sorteio, agora como um opt-in dentro do cadastro. */
export const raffle = {
  banner: 'Sua próxima descoberta pode acontecer dentro da fábrica!',
  text: 'Quer concorrer a uma visita técnica à Nicopel e conhecer de perto como milhões de embalagens ganham forma?',
  checkbox: 'Sim, quero participar do sorteio da visita técnica',
  note: 'Participar do sorteio é opcional. Você vê seu resultado do mesmo jeito.',
} as const;

/**
 * Versão do texto de consentimento gravada junto de cada inscrição.
 * Sempre que os textos abaixo mudarem, incremente esta versão.
 */
export const CONSENT_VERSION = 'v1-2026-08-13';

export const consent = {
  version: CONSENT_VERSION,
  registration:
    'Ao começar o quiz, você concorda que a Nicopel use nome, WhatsApp, e-mail e idade para registrar sua participação nesta ação. Li o aviso de privacidade e sei como solicitar a exclusão dos meus dados.',
  raffle:
    'Concordo que a Nicopel use os dados informados também para realizar o sorteio da visita técnica e entrar em contato caso eu seja selecionado.',
} as const;

export const privacy = {
  title: 'Como seus dados serão usados',
  purpose:
    'Os dados do cadastro são usados para registrar sua participação nesta ação da Nicopel e, para quem marcar a opção do sorteio, para realizar o sorteio da visita técnica e entrar em contato com a pessoa selecionada.',
  collected: [
    'Nome completo',
    'WhatsApp',
    'E-mail',
    'Idade',
    'Resultado do quiz (área e cargo indicados)',
    'Se você marcou ou não a participação no sorteio',
    'Data, hora e versão do texto de consentimento aceito',
  ],
  notCollected: [
    'CPF ou qualquer documento',
    'Data de nascimento (apenas a idade em anos)',
    'Endereço residencial',
    'Dados sensíveis (saúde, biometria, origem racial, entre outros)',
  ],
  /** PENDENTE: definir a data de exclusão dos dados após a finalidade. */
  retention: process.env.DATA_RETENTION_DATE || '[DEFINIR_DATA_DE_EXCLUSAO]',
  controller:
    'A Nicopel Embalagens é a responsável por esta ação e pelo tratamento dos dados coletados aqui.',
  channel: company.contactEmail,
  optionalNote:
    'A participação no sorteio é opcional e independente: quem não marcar a opção faz o quiz e vê o resultado normalmente.',
  analyticsNote:
    'Os dados do formulário não são compartilhados com ferramentas de analytics. As métricas do quiz são anônimas e agregadas.',
  /** Instrução operacional interna, exibida apenas na página /privacidade. */
  legalReviewNote:
    'Este texto precisa de revisão jurídica da Nicopel antes da publicação em produção.',
} as const;

export const footer = {
  text: 'Nicopel Embalagens — tradição, tecnologia e pessoas transformando papel em soluções.',
} as const;

export const seo = {
  title: 'Descubra em qual área o seu perfil se encaixa | Nicopel',
  description:
    'Responda a 10 perguntas rápidas e descubra qual caminho dentro da indústria tem mais a ver com você. Uma experiência de descoberta profissional da Nicopel Embalagens.',
  ogTitle: 'Quiz de Carreiras Nicopel',
  ogDescription:
    'Descubra em qual área da indústria o seu perfil se encaixa. Quiz rápido, de 2 a 3 minutos.',
} as const;

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw && /^https?:\/\//.test(raw)) return raw.replace(/\/$/, '');
  return 'http://localhost:3000';
}
