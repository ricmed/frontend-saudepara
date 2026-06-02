import React from 'react';
import type { FormField } from '@/services/FormService';

const LAB_CELL = 'min-w-0 w-full [&>div]:mb-0';
const DATE_ROW_WRAP =
  'w-full min-w-0 max-w-full shrink-0 sm:w-[13.5rem] [&_label]:text-sm [&_input]:min-w-[6.5rem] [&_input]:text-sm [&_button]:px-1.5 [&_button]:text-sm';
const CARD =
  'overflow-hidden rounded-lg border border-[#06b6d4]/25 bg-[#06b6d4]/[0.06] p-3 sm:p-4 space-y-3';

const DATE_FIELD_OPTS: Partial<FormField> = {
  denseControls: true,
};

const LAB_MARKER_RADIO_OPTS: Partial<FormField> = {
  doseRowTiles: true,
  gridCols: 1,
};

const KEYS = {
  antiHcv: 'crianca.acomp.anti_hcv',
  antiHcvData: 'crianca.acomp.anti_hcv_data',
  hcvRna: 'crianca.acomp.hcv_rna',
  hcvRnaQuantificacao: 'crianca.acomp.hcv_rna_quantificacao',
  hcvRnaData: 'crianca.acomp.hcv_rna_data',
} as const;

type RenderLabFn = (key: string, overrides?: Partial<FormField>) => React.ReactNode;

function isReagentePositivo(value: unknown): boolean {
  return String(value ?? '').trim() === '1';
}

function LabMarkerRow({
  renderLab,
  resultKey,
  dateKey,
}: {
  renderLab: RenderLabFn;
  resultKey: string;
  dateKey: string;
}) {
  return (
    <div className="grid max-w-full grid-cols-1 items-start gap-2 sm:grid-cols-[minmax(0,1fr)_13.5rem] sm:items-center sm:gap-2.5">
      <div className={`${LAB_CELL} min-w-0`}>{renderLab(resultKey, LAB_MARKER_RADIO_OPTS)}</div>
      <div className={`${DATE_ROW_WRAP} sm:flex sm:flex-col sm:justify-center`}>
        {renderLab(dateKey, DATE_FIELD_OPTS)}
      </div>
    </div>
  );
}

export interface CriancaAcompanhamentoHcvPanelProps {
  fieldByKey: (key: string) => FormField | undefined;
  renderField: (field: FormField) => React.ReactNode;
  getValue: (key: string) => unknown;
  readOnly?: boolean;
}

export const CRIANCA_ACOMP_FIRST_KEY = KEYS.antiHcv;

export const CRIANCA_ACOMP_LAYOUT_KEYS = new Set<string>(Object.values(KEYS));

export const CriancaAcompanhamentoHcvPanel: React.FC<CriancaAcompanhamentoHcvPanelProps> = ({
  fieldByKey,
  renderField,
  getValue,
}) => {
  const renderLab: RenderLabFn = (key, overrides) => {
    const def = fieldByKey(key);
    if (!def) return null;
    return renderField({ ...def, ...overrides });
  };

  const hcvRnaReagente = isReagentePositivo(getValue(KEYS.hcvRna));
  const hcvRnaQuantDef = fieldByKey(KEYS.hcvRnaQuantificacao);

  return (
    <div className={CARD}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#1e6f8c]">Hepatite C</p>
      <LabMarkerRow renderLab={renderLab} resultKey={KEYS.antiHcv} dateKey={KEYS.antiHcvData} />
      <div className="space-y-2">
        <LabMarkerRow renderLab={renderLab} resultKey={KEYS.hcvRna} dateKey={KEYS.hcvRnaData} />
        {hcvRnaReagente ? (
          <div className={`${LAB_CELL} min-w-0 max-w-md`}>
            {renderLab(KEYS.hcvRnaQuantificacao, { helpText: undefined })}
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Carga viral (UI/mL): informe somente se HCV-RNA for Reagente/Positivo.
          </p>
        )}
      </div>
      {hcvRnaReagente && hcvRnaQuantDef?.helpText ? (
        <p className="text-xs text-gray-500">{hcvRnaQuantDef.helpText}</p>
      ) : null}
    </div>
  );
};

export const CRIANCA_ACOMP_HCV_RNA_QUANT_KEY = KEYS.hcvRnaQuantificacao;
