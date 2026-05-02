import React from 'react';
import { FormRenderer } from './FormRenderer';
import { getStatusUi } from '../utils/formResponsesListUtils';

type Props = {
  open: boolean;
  onClose: () => void;
  formTitle: string;
  responseId: number;
  status: string;
  activeSchema: any;
  dataJson: Record<string, any>;
};

export const FormResponseReadonlyModal: React.FC<Props> = ({
  open,
  onClose,
  formTitle,
  responseId,
  status,
  activeSchema,
  dataJson,
}) => {
  if (!open) return null;

  const st = getStatusUi(status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div className="min-w-0">
            <div className="text-sm text-gray-500">Resposta #{responseId}</div>
            <div className="text-lg font-semibold text-gray-900 truncate">{formTitle || 'Resposta'}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b bg-gray-50 px-4 py-2">
          <div className="text-sm font-medium text-gray-900">Formulário preenchido</div>
          <div className="text-xs text-gray-500">{st.label}</div>
        </div>

        <div className="max-h-[85vh] overflow-auto p-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            {activeSchema ? (
              <FormRenderer
                schema={activeSchema as any}
                initialData={dataJson ?? {}}
                readOnly={true}
                showActions={false}
                showTitle={false}
                context="sinan"
                pageMode={false}
                showProgress={false}
                className="w-full max-w-none mx-0 p-0 bg-transparent rounded-none shadow-none"
              />
            ) : (
              <div className="text-sm text-gray-600">Não foi possível carregar o layout do formulário.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
