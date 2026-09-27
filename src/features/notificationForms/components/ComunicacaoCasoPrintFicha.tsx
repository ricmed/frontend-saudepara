import React from 'react';
import { SAIRE_LOGO_FULL_PNG } from '@/features/home/components/SaireLogo';
import { CIRIO_LOGO_PNG } from '@/features/home/components/CirioLogo';
import type { ModoLocalidadeEvento } from '@/features/notificationForms/types/index2';
import { buildComunicacaoCasoFichaBlocks } from '@/features/notificationForms/utils/caseFichaLayout';
import '@/features/dynamic-forms/styles/fichaPrint.css';

export type ComunicacaoCasoPrintFichaProps = {
  data: Record<string, string>;
  modoLocalidadeEvento: ModoLocalidadeEvento;
  isSaire: boolean;
  isCirio?: boolean;
  eventoNome: string;
};

export const ComunicacaoCasoPrintFicha: React.FC<ComunicacaoCasoPrintFichaProps> = ({
  data,
  modoLocalidadeEvento,
  isSaire,
  isCirio = false,
  eventoNome,
}) => {
  const blocks = buildComunicacaoCasoFichaBlocks(data, modoLocalidadeEvento, '');
  const headerClass = isSaire
    ? 'flex items-center rounded-t-xl bg-[#ff4d94] px-4 py-3'
    : 'flex items-center rounded-t-xl bg-blue-600 px-4 py-3';

  return (
    <div className="ficha-print-root space-y-6">
      <header className="mb-2 flex items-start justify-between gap-4 border-b-2 border-blue-200 pb-4 ficha-print-block">
        <div>
          <p className="text-sm font-medium text-slate-500">Saúde Pará, SES-PA</p>
          <h1 className="text-2xl font-bold text-slate-800">
            Ficha de Comunicação de Caso
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {eventoNome || 'Evento não informado'}
          </p>
        </div>
        {isSaire ? (
          <img
            src={SAIRE_LOGO_FULL_PNG}
            alt="Festival do Sairé 2026"
            className="h-14 w-auto object-contain"
          />
        ) : isCirio ? (
          <span className="inline-flex rounded-lg bg-[#12355B] px-2 py-1">
            <img
              src={CIRIO_LOGO_PNG}
              alt="Círio de Nazaré 2026"
              className="h-14 w-auto object-contain mix-blend-screen"
            />
          </span>
        ) : null}
      </header>

      {blocks.map((block) => (
        <section
          key={block.title}
          className="ficha-print-section mb-6"
        >
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm ficha-print-section-card">
            <div className={`ficha-print-section-header ${headerClass}`}>
              <h2 className="text-base font-semibold leading-tight text-white sm:text-lg">
                {block.title}
              </h2>
            </div>
            <div className="rounded-b-xl p-4 ficha-print-section-body">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {block.rows.map((row) => {
                  const wide =
                    row.label.startsWith('Observação') ||
                    row.label === 'Sinais e Sintomas' ||
                    row.label === 'Hipótese Diagnóstica' ||
                    row.label === 'Tipo de Trauma' ||
                    row.label === 'Unidade Notificadora' ||
                    row.label === 'Local de Encaminhamento';
                  return (
                    <div
                      key={`${block.title}-${row.label}`}
                      className={`ficha-print-field ${wide ? 'md:col-span-2' : ''}`}
                    >
                      <p className="mb-1 text-sm font-medium text-gray-700">
                        {row.label}
                      </p>
                      <div className="min-h-[2.5rem] whitespace-pre-wrap rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                        {row.value || '\u00a0'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default ComunicacaoCasoPrintFicha;
