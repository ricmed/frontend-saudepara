import type { ReactNode } from 'react';

interface ObservaSusSectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function ObservaSusSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: ObservaSusSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 mb-2">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-slate-600 leading-relaxed text-base sm:text-lg">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
