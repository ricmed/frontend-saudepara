import { Link } from 'react-router-dom';
import {
  Activity,
  Award,
  Baby,
  BarChart3,
  ChevronRight,
  HeartPulse,
  Lock,
  Users,
  Microscope,
} from 'lucide-react';
import type { ObservaSusPanel } from '../types/observasus';
import { ObservaSusStatusBadge } from './ObservaSusStatusBadge';

const PANEL_ICONS = {
  baby: Baby,
  'heart-pulse': HeartPulse,
  activity: Activity,
  virus: Microscope,
  users: Users,
  award: Award,
} as const;

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

export function ObservaSusPanelCard({ panel }: ObservaSusPanelCardProps) {
  const Icon = PANEL_ICONS[panel.icon];
  const href = panel.href || '/observasus/paineis';
  const ctaLabel =
    panel.status === 'AVAILABLE'
      ? panel.isExternal
        ? 'Abrir painel'
        : 'Acessar'
      : 'Saiba mais';

  const ctaClassName =
    'mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800';

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-900/20">
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
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
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

      {panel.isExternal ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={ctaClassName}
        >
          {ctaLabel}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      ) : (
        <Link to={href} className={ctaClassName}>
          {ctaLabel}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </article>
  );
}
