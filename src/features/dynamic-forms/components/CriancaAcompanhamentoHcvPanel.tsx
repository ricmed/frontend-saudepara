import React from 'react';
import type { FormField } from '@/services/FormService';

import {
  LAB_CELL,
  LabMarkerRow,
  type RenderLabFn,
} from '@/features/dynamic-forms/components/criancaLabPanelLayout';

const CARD =
  'overflow-hidden rounded-lg border border-[#06b6d4]/25 bg-[#06b6d4]/[0.06] p-3 sm:p-4 space-y-3';

const SUB_BLOCK = 'space-y-2 rounded-md border border-[#06b6d4]/15 bg-white/60 p-3';

const KEYS = {
  m3_6HcvRna: 'crianca.acomp.m3_6.hcv_rna',
  m3_6HcvRnaData: 'crianca.acomp.m3_6.hcv_rna_data',
  m3_6HcvRnaQuantificacao: 'crianca.acomp.m3_6.hcv_rna_quantificacao',
  antiHcv: 'crianca.acomp.anti_hcv',
  antiHcvData: 'crianca.acomp.anti_hcv_data',
  hcvRna: 'crianca.acomp.hcv_rna',
  hcvRnaQuantificacao: 'crianca.acomp.hcv_rna_quantificacao',
  hcvRnaData: 'crianca.acomp.hcv_rna_data',
} as const;

export const CRIANCA_ACOMP_SOROLOGIA_MARKER_KEYS = new Set<string>([
  KEYS.m3_6HcvRna,
  KEYS.antiHcv,
  KEYS.hcvRna,
]);

function isReagentePositivo(value: unknown): boolean {
  return String(value ?? '').trim() === '1';
}

function HcvRnaQuantBlock({
  reagente,
  quantKey,
  quantDef,
  renderLab,
  idadeLabel,
}: {
  reagente: boolean;
  quantKey: string;
  quantDef: FormField | undefined;
  renderLab: RenderLabFn;
  idadeLabel: string;
}) {
  if (reagente) {
    return (
      <div className={`${LAB_CELL} min-w-0 max-w-md`}>
        {renderLab(quantKey, { helpText: undefined })}
      </div>
    );
  }
  return (
    <p className="text-xs text-gray-500">
      Carga viral (UI/mL) — {idadeLabel}: informe somente se HCV-RNA for Reagente/Positivo.
    </p>
  );
}

export interface CriancaAcompanhamentoHcvPanelProps {
  fieldByKey: (key: string) => FormField | undefined;
  renderField: (field: FormField) => React.ReactNode;
  getValue: (key: string) => unknown;
  readOnly?: boolean;
}

export const CRIANCA_ACOMP_FIRST_KEY = KEYS.m3_6HcvRna;

export const CRIANCA_ACOMP_LAYOUT_KEYS = new Set<string>(Object.values(KEYS));

export const CRIANCA_ACOMP_M3_6_HCV_RNA_QUANT_KEY = KEYS.m3_6HcvRnaQuantificacao;

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

  const m3_6HcvRnaReagente = isReagentePositivo(getValue(KEYS.m3_6HcvRna));
  const hcvRnaReagente = isReagentePositivo(getValue(KEYS.hcvRna));
  const m3_6QuantDef = fieldByKey(KEYS.m3_6HcvRnaQuantificacao);
  const hcvRnaQuantDef = fieldByKey(KEYS.hcvRnaQuantificacao);

  return (
    <div className={`${CARD} space-y-4`}>
      <div className={SUB_BLOCK}>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1e6f8c]">
          HCV-RNA (de 3 a 6 meses de idade)
        </p>
        <LabMarkerRow
          renderLab={renderLab}
          resultKey={KEYS.m3_6HcvRna}
          dateKey={KEYS.m3_6HcvRnaData}
        />
        <HcvRnaQuantBlock
          reagente={m3_6HcvRnaReagente}
          quantKey={KEYS.m3_6HcvRnaQuantificacao}
          quantDef={m3_6QuantDef}
          renderLab={renderLab}
          idadeLabel="3 a 6 meses"
        />
        {m3_6HcvRnaReagente && m3_6QuantDef?.helpText ? (
          <p className="text-xs text-gray-500">{m3_6QuantDef.helpText}</p>
        ) : null}
      </div>

      <div className={SUB_BLOCK}>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1e6f8c]">
          Controle sorológico com 18 meses de idade
        </p>
        <LabMarkerRow renderLab={renderLab} resultKey={KEYS.antiHcv} dateKey={KEYS.antiHcvData} />
        <div className="space-y-2">
          <LabMarkerRow renderLab={renderLab} resultKey={KEYS.hcvRna} dateKey={KEYS.hcvRnaData} />
          <HcvRnaQuantBlock
            reagente={hcvRnaReagente}
            quantKey={KEYS.hcvRnaQuantificacao}
            quantDef={hcvRnaQuantDef}
            renderLab={renderLab}
            idadeLabel="18 meses"
          />
        </div>
        {hcvRnaReagente && hcvRnaQuantDef?.helpText ? (
          <p className="text-xs text-gray-500">{hcvRnaQuantDef.helpText}</p>
        ) : null}
      </div>
    </div>
  );
};

export const CRIANCA_ACOMP_HCV_RNA_QUANT_KEY = KEYS.hcvRnaQuantificacao;
