import { Link } from 'react-router-dom';
import type { ComponentType } from 'react';
import {
  Activity,
  Award,
  Baby,
  BarChart3,
  BookOpen,
  Brain,
  ChevronRight,
  ClipboardList,
  Clock,
  Droplets,
  HardHat,
  HeartPulse,
  Lock,
  Microscope,
  Pill,
  ShieldAlert,
  Stethoscope,
  Syringe,
  Users,
} from 'lucide-react';
import type { ObservaSusPanel } from '../types/observasus';
import type { ObservaSusPanelIconKey } from '../constants/observasusPanelVisuals';
import { getObservaSusSystemAccent } from '../constants/observasusTheme';
import { ObservaSusStatusBadge } from './ObservaSusStatusBadge';
import { MosquitoIcon } from './icons/MosquitoIcon';

const PANEL_ICONS: Record<ObservaSusPanelIconKey, ComponentType<{ className?: string }>> = {
  baby: Baby,
  'heart-pulse': HeartPulse,
  activity: Activity,
  virus: Microscope,
  users: Users,
  award: Award,
  mosquito: MosquitoIcon,
  droplets: Droplets,
  brain: Brain,
  pill: Pill,
  'shield-alert': ShieldAlert,
  'hard-hat': HardHat,
  'clipboard-list': ClipboardList,
  clock: Clock,
  'book-open': BookOpen,
  stethoscope: Stethoscope,
  syringe: Syringe,
};

interface ObservaSusPanelCardProps {
  panel: ObservaSusPanel;
}

function panelFooterMessage(panel: ObservaSusPanel): string {
  switch (panel.status) {
    case 'AVAILABLE':
      return panel.hasFile
        ? 'Arquivos e indicadores disponíveis para consulta.'
        : 'Painel disponível. Acesse para ver o conteúdo.';
    case 'COMING_SOON':
      return 'Em breve neste portal.';
    case 'ARCHIVED':
      return 'Painel arquivado.';
    case 'MIGRATING':
      return 'A integração segura deste painel está sendo preparada.';
    default: {
      const _exhaustive: never = panel.status;
      return String(_exhaustive);
    }
  }
}

const CARD_CLASS =
  'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700';

function PanelCardContent({ panel }: ObservaSusPanelCardProps) {
  const Icon = PANEL_ICONS[panel.icon];
  const accent = getObservaSusSystemAccent(panel.system);
  const ctaLabel =
    panel.status === 'AVAILABLE'
      ? panel.isExternal
        ? 'Abrir painel'
        : 'Acessar'
      : 'Saiba mais';

  return (
    <>
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div className="mb-5 flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-md ring-4 ${accent.iconBg} ${accent.iconText} ${accent.ring}`}
        >
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {panel.visibility === 'RESTRICTED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
              <Lock className="h-3 w-3" aria-hidden />
              Restrito
            </span>
          )}
          {panel.visibility === 'AUTHENTICATED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-500/15">
              <Lock className="h-3 w-3" aria-hidden />
              Login
            </span>
          )}
          <ObservaSusStatusBadge status={panel.status} />
        </div>
      </div>

      <div className="flex-1">
        <p className={`text-xs font-semibold uppercase tracking-wider ${accent.eyebrow}`}>
          {panel.subtitle}
        </p>
        <h3 className="mt-1 text-xl font-bold text-slate-900">{panel.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{panel.description}</p>
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <div className="flex items-start gap-2">
          <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
          <span>{panelFooterMessage(panel)}</span>
        </div>
      </div>

      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 group-hover:text-blue-800">
        {ctaLabel}
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </>
  );
}

export function ObservaSusPanelCard({ panel }: ObservaSusPanelCardProps) {
  const accent = getObservaSusSystemAccent(panel.system);
  const href = panel.href || '/observasus/paineis';
  const cardClassName = `${CARD_CLASS} ${accent.cardHover}`;
  const ariaLabel = `${panel.title} — ${panel.subtitle}`;

  if (panel.isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClassName}
        aria-label={ariaLabel}
      >
        <PanelCardContent panel={panel} />
      </a>
    );
  }

  return (
    <Link to={href} className={cardClassName} aria-label={ariaLabel}>
      <PanelCardContent panel={panel} />
    </Link>
  );
}
