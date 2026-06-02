import React from 'react';
import type { FormField } from '@/services/FormService';
import { InvestigadorMunicipioPara } from './InvestigadorMunicipioPara';
import { EstabelecimentoInvestigador } from './EstabelecimentoInvestigador';

const CELL = 'min-w-0 w-full [&>div]:mb-0';

const KEYS = {
  municipioId: 'investigador.municipio_id',
  unidadeId: 'investigador.unidade_id',
  estabelecimentoCnes: 'investigador.estabelecimento_cnes',
  nome: 'investigador.nome',
  funcao: 'investigador.funcao',
} as const;

const HIDDEN_KEYS = [
  'investigador.estado_id',
  'investigador.uf',
  'investigador.municipio_ibge',
  'investigador.estabelecimento_nome',
] as const;

export const CRIANCA_INVESTIGADOR_FIRST_KEY = KEYS.municipioId;

export const CRIANCA_INVESTIGADOR_LAYOUT_KEYS = new Set<string>([
  ...Object.values(KEYS),
  ...HIDDEN_KEYS,
]);

export interface InvestigadorDadosPanelProps {
  fieldByKey: (key: string) => FormField | undefined;
  renderField: (field: FormField) => React.ReactNode;
  getValue: (key: string) => unknown;
  setValue: (key: string, value: unknown) => void;
  getError: (key: string) => string | undefined;
  readOnly?: boolean;
}

export const InvestigadorDadosPanel: React.FC<InvestigadorDadosPanelProps> = ({
  fieldByKey,
  renderField,
  getValue,
  setValue,
  getError,
  readOnly,
}) => {
  const render = (key: string) => {
    const def = fieldByKey(key);
    return def ? renderField(def) : null;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <InvestigadorMunicipioPara
          getValue={getValue}
          setValue={setValue}
          disabled={readOnly}
          error={getError(KEYS.municipioId)}
        />
        <EstabelecimentoInvestigador
          getValue={getValue}
          setValue={setValue}
          disabled={readOnly}
          error={getError(KEYS.unidadeId) || getError(KEYS.estabelecimentoCnes)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
        <div className={CELL}>{render(KEYS.nome)}</div>
        <div className={CELL}>{render(KEYS.funcao)}</div>
      </div>
    </div>
  );
};
