import type { ObservaSusSystem } from '../types/observasus';

/** Ícones Lucide usados nos cards de painéis (por slug ou sistema). */
export type ObservaSusPanelIconKey =
  | 'baby'
  | 'heart-pulse'
  | 'activity'
  | 'virus'
  | 'users'
  | 'award'
  | 'mosquito'
  | 'droplets'
  | 'brain'
  | 'pill'
  | 'shield-alert'
  | 'hard-hat'
  | 'clipboard-list'
  | 'clock'
  | 'book-open'
  | 'stethoscope'
  | 'syringe';

const SYSTEM_ICON: Record<ObservaSusSystem, ObservaSusPanelIconKey> = {
  SIM: 'heart-pulse',
  SINASC: 'baby',
  SINAN: 'activity',
  ESUS_NOTIFICA: 'activity',
  COVID_19: 'virus',
  DEMOGRAFICO: 'users',
  PQAVS: 'award',
  GERAL: 'book-open',
};

/** Rótulos de card — painel principal SIM (embed observasus_sim) no WordPress. */
const PANEL_CARD_LABEL_BY_SLUG: Record<string, { title: string; subtitle: string }> = {
  'painel-sim-cid10': {
    title: 'SIM',
    subtitle: 'Mortalidade por categoria do CID-10',
  },
};

export function getObservaSusPanelCardLabels(
  slug: string,
  title: string,
  subtitle: string
): { title: string; subtitle: string } {
  return PANEL_CARD_LABEL_BY_SLUG[slug] ?? { title, subtitle };
}

/** Ícone por subpainel — cores continuam por sistema (SIM rosa, SINAN verde, etc.). */
const PANEL_ICON_BY_SLUG: Record<string, ObservaSusPanelIconKey> = {
  'painel-sim-dcnt': 'heart-pulse',
  'painel-sim-causa-externa': 'shield-alert',
  'painel-sim-acidente-trabalho': 'hard-hat',
  'painel-sinan-dengue': 'mosquito',
  'painel-sinan-chikungunya': 'droplets',
  'painel-sinan-zika': 'baby',
  'painel-sinan-hepatites': 'pill',
  'painel-sinan-sifilis-gestantes': 'stethoscope',
  'painel-sinan-sifilis-congenita': 'baby',
  'painel-sinan-hiv-adultos': 'heart-pulse',
  'painel-sinan-hiv-criancas': 'syringe',
  'painel-sinan-meningite': 'brain',
  'painel-sinan-hanseniase': 'activity',
  'painel-sinan-tuberculose': 'stethoscope',
  'painel-sinan-violencia': 'shield-alert',
  'painel-sinan-encerramento-oportuno': 'clock',
  'manual-paineis': 'book-open',
};

export function getObservaSusPanelIcon(
  slug: string,
  system: ObservaSusSystem
): ObservaSusPanelIconKey {
  return PANEL_ICON_BY_SLUG[slug] ?? SYSTEM_ICON[system] ?? 'activity';
}
