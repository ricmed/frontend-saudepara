import React from 'react';
import type { FormField } from '@/services/FormService';

const LAB_CELL = 'min-w-0 w-full [&>div]:mb-0';
/** Data ao lado do radio: largura fixa; tipografia alinhada aos radios (text-sm). */
const DATE_ROW_WRAP =
  'w-full min-w-0 max-w-full shrink-0 sm:w-[13.5rem] [&_label]:text-sm [&_input]:min-w-[6.5rem] [&_input]:text-sm [&_button]:px-1.5 [&_button]:text-sm';
const CARD =
  'overflow-hidden rounded-lg border border-[#3b5bdb]/20 bg-[#3b5bdb]/[0.05] p-3 sm:p-4 space-y-3';

const DATE_FIELD_OPTS: Partial<FormField> = {
  denseControls: true,
};

/** ALT: data no tamanho padrão do formulário (sem dense / sem coluna estreita). */
const ALT_DATE_WRAP = 'w-full min-w-0 shrink-0 sm:w-auto sm:max-w-md [&>div]:mb-0';

/** Marcador + data na mesma linha — 1 coluna de tiles para não sobrepor os rótulos. */
const LAB_MARKER_RADIO_OPTS: Partial<FormField> = {
  doseRowTiles: true,
  gridCols: 1,
};

export type CriancaLabEsquemaPrefix = 'crianca.lab.esquema1' | 'crianca.lab.esquema2';

const keysFor = (prefix: CriancaLabEsquemaPrefix) => ({
  hbsag: `${prefix}.hbsag`,
  hbsagData: `${prefix}.hbsag_data`,
  antiHbs: `${prefix}.anti_hbs`,
  antiHbsData: `${prefix}.anti_hbs_data`,
  hbvDna: `${prefix}.hbv_dna`,
  hbvDnaQuantificacao: `${prefix}.hbv_dna_quantificacao`,
  hbvDnaData: `${prefix}.hbv_dna_data`,
  alt: `${prefix}.alt`,
  altData: `${prefix}.alt_data`,
});

type RenderLabFn = (key: string, overrides?: Partial<FormField>) => React.ReactNode;

/** Sorologia/molecular: valor 1 = Reagente/Positivo (carga viral só nesse caso). */
function isReagentePositivo(value: unknown): boolean {
  return String(value ?? '').trim() === '1';
}

function LabMarkerRow({
  renderLab,
  resultKey,
  dateKey,
  radioOpts,
}: {
  renderLab: RenderLabFn;
  resultKey: string;
  dateKey: string;
  radioOpts: Partial<FormField>;
}) {
  return (
    <div className="grid max-w-full grid-cols-1 items-start gap-2 sm:grid-cols-[minmax(0,1fr)_13.5rem] sm:items-center sm:gap-2.5">
      <div className={`${LAB_CELL} min-w-0`}>{renderLab(resultKey, radioOpts)}</div>
      <div className={`${DATE_ROW_WRAP} sm:flex sm:flex-col sm:justify-center`}>
        {renderLab(dateKey, DATE_FIELD_OPTS)}
      </div>
    </div>
  );
}

export interface CriancaLabSorologiaEsquemaPanelProps {
  esquema: 1 | 2;
  fieldByKey: (key: string) => FormField | undefined;
  renderField: (field: FormField) => React.ReactNode;
  getValue: (key: string) => unknown;
  readOnly?: boolean;
}

/** Painel laboratorial 1º/2º esquema — grade 2 colunas, marcador + data na mesma linha. */
export const CriancaLabSorologiaEsquemaPanel: React.FC<CriancaLabSorologiaEsquemaPanelProps> = ({
  esquema,
  fieldByKey,
  renderField,
  getValue,
}) => {
  const prefix: CriancaLabEsquemaPrefix =
    esquema === 1 ? 'crianca.lab.esquema1' : 'crianca.lab.esquema2';
  const k = keysFor(prefix);

  const renderLab: RenderLabFn = (key, overrides) => {
    const def = fieldByKey(key);
    if (!def) return null;
    return renderField({ ...def, ...overrides });
  };

  const hbvDnaReagente = isReagentePositivo(getValue(k.hbvDna));
  const hbvDnaQuantDef = fieldByKey(k.hbvDnaQuantificacao);
  const altDef = fieldByKey(k.alt);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <div className={CARD}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#364fc7]">Sorologia</p>
          <LabMarkerRow
            renderLab={renderLab}
            resultKey={k.hbsag}
            dateKey={k.hbsagData}
            radioOpts={LAB_MARKER_RADIO_OPTS}
          />
          <LabMarkerRow
            renderLab={renderLab}
            resultKey={k.antiHbs}
            dateKey={k.antiHbsData}
            radioOpts={LAB_MARKER_RADIO_OPTS}
          />
        </div>

        <div className={CARD}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#364fc7]">HBV-DNA</p>
          <LabMarkerRow
            renderLab={renderLab}
            resultKey={k.hbvDna}
            dateKey={k.hbvDnaData}
            radioOpts={LAB_MARKER_RADIO_OPTS}
          />
          {hbvDnaReagente ? (
            <div className={`${LAB_CELL} min-w-0 max-w-md`}>
              {renderLab(k.hbvDnaQuantificacao, { helpText: undefined })}
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Carga viral (UI/mL): informe somente se HBV-DNA for Reagente/Positivo.
            </p>
          )}
          {hbvDnaReagente && hbvDnaQuantDef?.helpText ? (
            <p className="text-xs text-gray-500">{hbvDnaQuantDef.helpText}</p>
          ) : null}
        </div>
      </div>

      <div className={`${CARD} max-w-2xl`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#364fc7]">
          ALT (alanina aminotransferase)
        </p>
        <div className="space-y-1">
          <div className="grid max-w-full grid-cols-1 items-start gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
            <div className={`${LAB_CELL} min-w-0`}>
              {renderLab(k.alt, { helpText: undefined })}
            </div>
            <div className={ALT_DATE_WRAP}>{renderLab(k.altData)}</div>
          </div>
          {altDef?.helpText ? (
            <p className="text-xs text-gray-500">{altDef.helpText}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const CRIANCA_LAB_ESQUEMA1_FIRST_KEY = 'crianca.lab.esquema1.hbsag';

/** Campos removidos do seed v13 — ocultar se a versão antiga do formulário ainda estiver no banco. */
export const CRIANCA_LAB_DEPRECATED_KEYS = new Set([
  'crianca.lab.esquema1.data_coleta_sorologia',
  'crianca.lab.esquema2.data_coleta_sorologia',
]);

export const CRIANCA_LAB_LAYOUT_KEYS = new Set([
  CRIANCA_LAB_ESQUEMA1_FIRST_KEY,
  'crianca.lab.esquema1.hbsag_data',
  'crianca.lab.esquema1.anti_hbs',
  'crianca.lab.esquema1.anti_hbs_data',
  'crianca.lab.esquema1.hbv_dna',
  'crianca.lab.esquema1.hbv_dna_quantificacao',
  'crianca.lab.esquema1.hbv_dna_data',
  'crianca.lab.esquema1.alt',
  'crianca.lab.esquema1.alt_data',
  'crianca.lab.registrar_esquema_2',
  'crianca.lab.esquema2.hbsag',
  'crianca.lab.esquema2.hbsag_data',
  'crianca.lab.esquema2.anti_hbs',
  'crianca.lab.esquema2.anti_hbs_data',
  'crianca.lab.esquema2.hbv_dna',
  'crianca.lab.esquema2.hbv_dna_quantificacao',
  'crianca.lab.esquema2.hbv_dna_data',
  'crianca.lab.esquema2.alt',
  'crianca.lab.esquema2.alt_data',
]);

export const CRIANCA_LAB_ESQUEMA2_KEYS = [
  'crianca.lab.esquema2.hbsag',
  'crianca.lab.esquema2.hbsag_data',
  'crianca.lab.esquema2.anti_hbs',
  'crianca.lab.esquema2.anti_hbs_data',
  'crianca.lab.esquema2.hbv_dna',
  'crianca.lab.esquema2.hbv_dna_quantificacao',
  'crianca.lab.esquema2.hbv_dna_data',
  'crianca.lab.esquema2.alt',
  'crianca.lab.esquema2.alt_data',
] as const;
