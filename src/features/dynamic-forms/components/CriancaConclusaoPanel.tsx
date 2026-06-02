import React from 'react';
import type { FormField } from '@/services/FormService';

const CELL = 'min-w-0 w-full [&>div]:mb-0';

const KEYS = {
  evolucaoCaso: 'conclusao.evolucao_caso',
  observacoes: 'conclusao.observacoes_adicionais',
  classificacaoEtiologica: 'conclusao.classificacao_etiologica',
  dataEncerramento: 'conclusao.data_encerramento',
} as const;

export const CRIANCA_CONCLUSAO_FIRST_KEY = KEYS.evolucaoCaso;

export const CRIANCA_CONCLUSAO_LAYOUT_KEYS = new Set<string>(Object.values(KEYS));

export interface CriancaConclusaoPanelProps {
  fieldByKey: (key: string) => FormField | undefined;
  renderField: (field: FormField) => React.ReactNode;
  readOnly?: boolean;
}

/** Conclusão — evolução, observações (até 5.000 caracteres), classificação e data. */
export const CriancaConclusaoPanel: React.FC<CriancaConclusaoPanelProps> = ({
  fieldByKey,
  renderField,
}) => {
  const render = (key: string) => {
    const def = fieldByKey(key);
    return def ? renderField(def) : null;
  };

  return (
    <div className="space-y-4">
      <div className={`${CELL} max-w-xl`}>{render(KEYS.evolucaoCaso)}</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
        <div className={`${CELL} max-w-xl`}>{render(KEYS.classificacaoEtiologica)}</div>
        <div className={`${CELL} md:max-w-xs`}>{render(KEYS.dataEncerramento)}</div>
      </div>
      <div className={CELL}>{render(KEYS.observacoes)}</div>
    </div>
  );
};
