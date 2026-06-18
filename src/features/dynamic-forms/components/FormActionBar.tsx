import React from 'react';
import { Loader2, Save, Trash2, X } from 'lucide-react';

export interface FormActionBarProps {
  formId: string;
  saveLabel?: string;
  cancelLabel?: string;
  saving?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onCancel?: () => void;
  onClear?: () => void;
  /** Estilo no header azul (topo) ou no rodapé do formulário. */
  placement?: 'header' | 'footer';
  /** Impressão / exportação — exibido no rodapé, após os botões principais. */
  extraActions?: React.ReactNode;
  className?: string;
}

export const FormActionBar: React.FC<FormActionBarProps> = ({
  formId,
  saveLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  saving = false,
  disabled = false,
  readOnly = false,
  onCancel,
  onClear,
  placement = 'footer',
  extraActions,
  className = '',
}) => {
  if (readOnly) {
    if (!onCancel && !extraActions) return null;
    const cancelClass =
      placement === 'header'
        ? 'p-2 sm:w-auto sm:inline-flex sm:items-center sm:justify-center sm:gap-2 sm:px-4 sm:py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors'
        : 'inline-flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    const content = (
      <>
        {onCancel ? (
          <button type="button" onClick={onCancel} className={cancelClass}>
            <X className="h-4 w-4" />
            <span className={placement === 'header' ? 'hidden sm:inline' : undefined}>{cancelLabel}</span>
          </button>
        ) : null}
      </>
    );

    if (placement === 'footer') {
      return (
        <div className={`mt-8 flex flex-col items-center gap-4 ${className}`.trim()}>
          {onCancel ? <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">{content}</div> : null}
          {extraActions ? (
            <div className="flex flex-wrap items-center justify-center gap-2">{extraActions}</div>
          ) : null}
        </div>
      );
    }

    return (
      <div className={`flex flex-wrap items-center justify-end gap-1 sm:gap-2 ${className}`.trim()}>
        {content}
      </div>
    );
  }

  const isBusy = saving || disabled;
  const headerBtn =
    'p-2 sm:w-auto sm:inline-flex sm:items-center sm:justify-center sm:gap-2 sm:px-4 sm:py-2 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed';
  const footerBtn =
    'inline-flex items-center gap-2 px-6 py-2 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed';

  const saveClass =
    placement === 'header'
      ? `${headerBtn} bg-blue-700 text-white shadow-sm ring-1 ring-white/20 hover:bg-blue-800`
      : `${footerBtn} bg-blue-600 text-white hover:bg-blue-700`;

  const clearClass =
    placement === 'header'
      ? `${headerBtn} bg-gray-500 text-white hover:bg-gray-600`
      : `${footerBtn} bg-gray-500 text-white hover:bg-gray-600`;

  const cancelClass =
    placement === 'header'
      ? `${headerBtn} bg-gray-600 text-white hover:bg-gray-700`
      : `${footerBtn} bg-gray-600 text-white hover:bg-gray-700`;

  const buttons = (
    <>
      <button
        type="submit"
        form={formId}
        disabled={isBusy}
        className={saveClass}
        title={saveLabel}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        <span className={placement === 'header' ? 'hidden sm:inline' : undefined}>
          {saving ? 'Salvando...' : saveLabel}
        </span>
      </button>
      {onClear ? (
        <button type="button" onClick={onClear} disabled={isBusy} className={clearClass} title="Limpar">
          <Trash2 className="h-4 w-4" />
          <span className={placement === 'header' ? 'hidden sm:inline' : undefined}>Limpar</span>
        </button>
      ) : null}
      {onCancel ? (
        <button type="button" onClick={onCancel} disabled={isBusy} className={cancelClass} title="Cancelar">
          <X className="h-4 w-4" />
          <span className={placement === 'header' ? 'hidden sm:inline' : undefined}>{cancelLabel}</span>
        </button>
      ) : null}
    </>
  );

  if (placement === 'footer') {
    return (
      <div className={`mt-8 flex flex-col items-center gap-4 ${className}`.trim()}>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">{buttons}</div>
        {extraActions ? (
          <div className="flex flex-wrap items-center justify-center gap-2">{extraActions}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center justify-end gap-1 sm:gap-2 ${className}`.trim()}>
      {buttons}
    </div>
  );
};
