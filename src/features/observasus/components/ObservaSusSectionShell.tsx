import type { ReactNode } from 'react';

type ShellVariant = 'plain' | 'elevated' | 'tinted';

interface ObservaSusSectionShellProps {
  children: ReactNode;
  id?: string;
  variant?: ShellVariant;
  className?: string;
}

const VARIANT_CLASS: Record<ShellVariant, string> = {
  plain: '',
  elevated:
    'rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-slate-900/5 backdrop-blur-sm sm:p-8 lg:p-10',
  tinted:
    'rounded-3xl border border-blue-100/60 bg-gradient-to-br from-white via-blue-50/40 to-slate-50 p-6 shadow-sm sm:p-8 lg:p-10',
};

export function ObservaSusSectionShell({
  children,
  id,
  variant = 'plain',
  className = '',
}: ObservaSusSectionShellProps) {
  return (
    <section id={id} className={`observasus-enter ${VARIANT_CLASS[variant]} ${className}`.trim()}>
      {children}
    </section>
  );
}
