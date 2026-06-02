import React from 'react';

export type FormSectionHeaderVariant = 'prominent' | 'subtle';

export interface FormSectionHeaderProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: FormSectionHeaderVariant;
}

/**
 * Cabeçalho de seção compartilhado para formulários dinâmicos.
 * `prominent` (padrão): barra azul com texto branco.
 * `subtle`: faixa leve com acento lateral (uso pontual, não para abas).
 */
export const FormSectionHeader: React.FC<FormSectionHeaderProps> = ({
  title,
  icon: Icon,
  variant = 'prominent',
}) => {
  if (variant === 'subtle') {
    return (
      <div className="flex items-center gap-2.5 rounded-r-md border-l-[3px] border-[#4c6ef5] bg-slate-50/90 px-3 py-2">
        {Icon ? (
          <Icon className="h-4 w-4 flex-shrink-0 text-[#364fc7]" aria-hidden="true" />
        ) : null}
        <h2 className="text-sm font-semibold leading-snug text-slate-800">{title}</h2>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-t-xl bg-blue-600 px-4 py-3">
      {Icon ? (
        <Icon className="h-5 w-5 flex-shrink-0 text-white/95" aria-hidden="true" />
      ) : (
        <div className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      )}
      <h2 className="text-base font-semibold leading-tight text-white sm:text-lg">{title}</h2>
    </div>
  );
};

export default FormSectionHeader;
