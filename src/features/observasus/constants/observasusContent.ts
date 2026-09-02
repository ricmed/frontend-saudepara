import type {
  ObservaSusDataSystem,
  ObservaSusPanel,
  ObservaSusPublication,
  ObservaSusQuickLink,
} from '../types/observasus';

export const OBSERVASUS_IMAGES = {
  heroBackground: '/images/Observasus/Fundo.jpeg',
  mapOutline: '/images/Observasus/mapa-observasuspa.png',
  /** Logo horizontal do portal (WordPress original). */
  brandLogo: '/images/Observasus/observasus-logo.png',
  sespaLogo: '/images/logos/Logo Topo Sespa.png',
  governoLogo: '/images/logos/logo-brasao-governo-pa.png',
  nivsLogo: '/images/logos/logo-nivs-header.png',
  saudeParaLogo: '/images/logos/Logo Topo Saude Para.png',
} as const;

export const OBSERVASUS_PANELS: ObservaSusPanel[] = [
  {
    id: 'sinasc',
    slug: 'sinasc',
    system: 'SINASC',
    title: 'SINASC',
    subtitle: 'Nascidos Vivos',
    description:
      'Indicadores do Sistema de Informação de Nascidos Vivos para monitoramento perinatal no Pará.',
    status: 'MIGRATING',
    icon: 'baby',
  },
  {
    id: 'sim',
    slug: 'sim',
    system: 'SIM',
    title: 'SIM',
    subtitle: 'Mortalidade',
    description:
      'Painéis do Sistema de Informação sobre Mortalidade para análise de óbitos e causas.',
    status: 'MIGRATING',
    icon: 'heart-pulse',
  },
  {
    id: 'sinan',
    slug: 'sinan',
    system: 'SINAN',
    title: 'SINAN',
    subtitle: 'Agravos de Notificação',
    description:
      'Monitoramento de doenças e agravos de notificação compulsória no território paraense.',
    status: 'MIGRATING',
    icon: 'activity',
  },
  {
    id: 'covid19',
    slug: 'covid-19',
    system: 'COVID_19',
    title: 'COVID-19',
    subtitle: 'Painel epidemiológico',
    description:
      'Acompanhamento consolidado dos indicadores relacionados à COVID-19 no Estado.',
    status: 'MIGRATING',
    icon: 'virus',
  },
  {
    id: 'demografico',
    slug: 'demografico',
    system: 'DEMOGRAFICO',
    title: 'Demográfico',
    subtitle: 'Perfil populacional',
    description:
      'Indicadores demográficos para apoiar o planejamento das ações de vigilância em saúde.',
    status: 'MIGRATING',
    icon: 'users',
  },
  {
    id: 'pqavs',
    slug: 'pqa-vs',
    system: 'PQAVS',
    title: 'PQA-VS',
    subtitle: 'Qualificação da Vigilância',
    description:
      'Painel do Programa de Qualificação das Ações de Vigilância em Saúde.',
    status: 'MIGRATING',
    icon: 'award',
  },
];

export const OBSERVASUS_DATA_SYSTEMS: ObservaSusDataSystem[] = [
  {
    id: 'sim',
    slug: 'sim',
    system: 'SIM',
    title: 'SIM',
    subtitle: 'Sistema de Informação sobre Mortalidade',
    description: 'Relatórios, tabelas e bases consolidadas de mortalidade.',
    status: 'MIGRATING',
    route: '/observasus/dados/sim',
  },
  {
    id: 'sinasc',
    slug: 'sinasc',
    system: 'SINASC',
    title: 'SINASC',
    subtitle: 'Sistema de Informação de Nascidos Vivos',
    description: 'Dados e documentos do sistema de nascidos vivos.',
    status: 'MIGRATING',
    route: '/observasus/dados/sinasc',
  },
  {
    id: 'sinan',
    slug: 'sinan',
    system: 'SINAN',
    title: 'SINAN',
    subtitle: 'Sistema de Informação de Agravos de Notificação',
    description: 'Tabelas epidemiológicas e bases de agravos de notificação.',
    status: 'MIGRATING',
    route: '/observasus/dados/sinan',
  },
  {
    id: 'esus-notifica',
    slug: 'esus-notifica',
    system: 'ESUS_NOTIFICA',
    title: 'e-SUS Notifica',
    subtitle: 'Notificação de agravos',
    description: 'Documentação e bases relacionadas ao e-SUS Notifica.',
    status: 'COMING_SOON',
    route: '/observasus/dados/esus-notifica',
  },
  {
    id: 'repositorio',
    slug: 'repositorio',
    system: 'GERAL',
    title: 'Repositório de Dados',
    subtitle: 'Arquivos institucionais',
    description: 'Conjunto centralizado de documentos e bases do observatório.',
    status: 'MIGRATING',
    route: '/observasus/repositorio',
  },
];

export const OBSERVASUS_PUBLICATIONS: ObservaSusPublication[] = [
  {
    id: 'notas-tecnicas',
    slug: 'notas-tecnicas',
    title: 'Notas técnicas',
    category: 'Documentos',
    description: 'Orientações técnicas da vigilância em saúde do Pará.',
    status: 'COMING_SOON',
  },
  {
    id: 'boletins',
    slug: 'boletins',
    title: 'Boletins',
    category: 'Publicações',
    description: 'Boletins periódicos de monitoramento epidemiológico.',
    status: 'COMING_SOON',
  },
  {
    id: 'informes',
    slug: 'informes',
    title: 'Informes epidemiológicos',
    category: 'Publicações',
    description: 'Informes sobre eventos e agravos de interesse da vigilância.',
    status: 'COMING_SOON',
  },
  {
    id: 'manuais',
    slug: 'manuais',
    title: 'Manuais',
    category: 'Manuais',
    description: 'Manuais de utilização de painéis e sistemas de informação.',
    status: 'MIGRATING',
  },
];

export const OBSERVASUS_QUICK_LINKS: ObservaSusQuickLink[] = [
  {
    title: 'Mapa',
    description: 'Locais de saúde e pontos de interesse no Pará.',
    route: '/mapa',
    icon: 'map',
  },
  {
    title: 'Campanhas de Saúde',
    description: 'Campanhas e ações de promoção da saúde.',
    route: '/campanhas',
    icon: 'heart',
  },
  {
    title: 'Materiais Educativos',
    description: 'Materiais para profissionais e população.',
    route: '/materiais-educativos',
    icon: 'book',
  },
  {
    title: 'Fale Conosco',
    description: 'Canais oficiais de contato com a SESPA.',
    route: '/fale-conosco',
    icon: 'message',
  },
];
