import type { ObservaSusSystem } from '../types/observasus';
import { OBSERVASUS_IMAGES } from './observasusContent';

/** Tokens visuais compartilhados do portal ObservaSUS (Tailwind only — sem lib extra). */
export const OBSERVASUS_PAGE_BG = {
  pattern: OBSERVASUS_IMAGES.heroBackground,
} as const;

export type ObservaSusSystemAccent = {
  iconBg: string;
  iconText: string;
  ring: string;
  eyebrow: string;
  cardHover: string;
};

const DEFAULT_ACCENT: ObservaSusSystemAccent = {
  iconBg: 'bg-gradient-to-br from-blue-600 to-blue-800',
  iconText: 'text-white',
  ring: 'ring-blue-100',
  eyebrow: 'text-blue-700',
  cardHover: 'hover:border-blue-200 hover:shadow-blue-900/10',
};

export const OBSERVASUS_SYSTEM_ACCENTS: Record<ObservaSusSystem, ObservaSusSystemAccent> = {
  SIM: {
    iconBg: 'bg-gradient-to-br from-rose-500 to-rose-700',
    iconText: 'text-white',
    ring: 'ring-rose-100',
    eyebrow: 'text-rose-700',
    cardHover: 'hover:border-rose-200 hover:shadow-rose-900/10',
  },
  SINASC: {
    iconBg: 'bg-gradient-to-br from-sky-500 to-blue-700',
    iconText: 'text-white',
    ring: 'ring-sky-100',
    eyebrow: 'text-sky-700',
    cardHover: 'hover:border-sky-200 hover:shadow-sky-900/10',
  },
  SINAN: {
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-700',
    iconText: 'text-white',
    ring: 'ring-emerald-100',
    eyebrow: 'text-emerald-700',
    cardHover: 'hover:border-emerald-200 hover:shadow-emerald-900/10',
  },
  ESUS_NOTIFICA: {
    iconBg: 'bg-gradient-to-br from-violet-500 to-purple-700',
    iconText: 'text-white',
    ring: 'ring-violet-100',
    eyebrow: 'text-violet-700',
    cardHover: 'hover:border-violet-200 hover:shadow-violet-900/10',
  },
  COVID_19: {
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    iconText: 'text-white',
    ring: 'ring-amber-100',
    eyebrow: 'text-amber-800',
    cardHover: 'hover:border-amber-200 hover:shadow-amber-900/10',
  },
  DEMOGRAFICO: {
    iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-800',
    iconText: 'text-white',
    ring: 'ring-indigo-100',
    eyebrow: 'text-indigo-700',
    cardHover: 'hover:border-indigo-200 hover:shadow-indigo-900/10',
  },
  PQAVS: {
    iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    iconText: 'text-white',
    ring: 'ring-cyan-100',
    eyebrow: 'text-cyan-800',
    cardHover: 'hover:border-cyan-200 hover:shadow-cyan-900/10',
  },
  GERAL: DEFAULT_ACCENT,
};

export function getObservaSusSystemAccent(system: ObservaSusSystem): ObservaSusSystemAccent {
  return OBSERVASUS_SYSTEM_ACCENTS[system] ?? DEFAULT_ACCENT;
}
