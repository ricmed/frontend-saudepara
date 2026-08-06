import React from 'react';
import { ENTOMO_TABLE_VIEWPORT_MAX } from './entomologiaDenseTableClasses';

export type EntomologiaDenseTableShellProps = {
  children: React.ReactNode;
  /** Título opcional acima da tabela (ex.: seção Frequência %) */
  title?: string;
  maxHeightClass?: string;
  testId?: string;
};

/**
 * Container de scroll full-viewport com hint de colunas à direita (padrão DAE / tabelas densas).
 */
export const EntomologiaDenseTableShell: React.FC<EntomologiaDenseTableShellProps> = ({
  children,
  title,
  maxHeightClass = ENTOMO_TABLE_VIEWPORT_MAX,
  testId,
}) => (
  <div className="border-t border-blue-100/80">
    {title ? (
      <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 via-white to-sky-50 border-b border-blue-100">
        <h3 className="text-base font-semibold text-blue-900">{title}</h3>
      </div>
    ) : null}
    <div className={`relative overflow-auto ${maxHeightClass}`} data-testid={testId}>
      {children}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-blue-200/40 to-transparent"
        aria-hidden
      />
    </div>
  </div>
);
