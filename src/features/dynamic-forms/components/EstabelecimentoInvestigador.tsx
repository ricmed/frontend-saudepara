/**
 * Unidade de saúde do investigador — filtrada pelo município (Pará), inclui CNES inativos.
 */
import React, { useCallback } from 'react';
import { EstabelecimentoPorMunicipioField } from './EstabelecimentoPorMunicipioField';

interface EstabelecimentoInvestigadorProps {
  getValue: (key: string) => unknown;
  setValue: (key: string, value: unknown) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export const EstabelecimentoInvestigador: React.FC<EstabelecimentoInvestigadorProps> = ({
  getValue,
  setValue,
  disabled = false,
  error,
  required = false,
}) => {
  const handleUnidadeChange = useCallback(
    (id: number | undefined, meta?: { nome?: string; cnes?: string }) => {
      setValue('investigador.unidade_id', id ?? undefined);
      setValue('investigador.estabelecimento_nome', meta?.nome ?? undefined);
      setValue('investigador.estabelecimento_cnes', meta?.cnes ?? undefined);
    },
    [setValue],
  );

  return (
    <div data-field-key="investigador.unidade_id">
    <EstabelecimentoPorMunicipioField
      municipioId={getValue('investigador.municipio_id')}
      unidadeId={getValue('investigador.unidade_id')}
      onUnidadeChange={handleUnidadeChange}
      incluirInativos
      disabled={disabled}
      error={error}
      required={required}
    />
    </div>
  );
};
