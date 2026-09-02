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
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl border-l-4 border-blue-600 pl-5">
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-700">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        {description && (
          <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 sm:pb-1">{action}</div>}
    </div>
  );
}
