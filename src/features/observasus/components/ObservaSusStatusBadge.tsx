import type { ObservaSusResourceStatus } from '../types/observasus';
import { formatObservaSusStatus } from '../utils/observasusFormatters';

interface ObservaSusStatusBadgeProps {
  status: ObservaSusResourceStatus;
  className?: string;
}

const STATUS_STYLES: Record<ObservaSusResourceStatus, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  MIGRATING: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  COMING_SOON: 'bg-slate-100 text-slate-700 ring-slate-500/15',
  ARCHIVED: 'bg-slate-100 text-slate-500 ring-slate-400/15',
};

export function ObservaSusStatusBadge({ status, className = '' }: ObservaSusStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]} ${className}`}
    >
      {formatObservaSusStatus(status)}
    </span>
  );
}
