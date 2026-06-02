/**
 * Hospital de nascimento (campo 53 — CNES).
 * Lista SINASC via API (cadastro ao vivo); fallback JSON se offline.
 */
import React, { useCallback } from 'react';
import UnidadeNotificadoraField from '@/features/notificationForms/components/UnidadeNotificadoraField';
import { useHospitaisNascimentoSinasc } from '../hooks/useHospitaisNascimentoSinasc';

interface EstabelecimentoNascimentoProps {
  getValue: (key: string) => unknown;
  setValue: (key: string, value: unknown) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export const EstabelecimentoNascimento: React.FC<EstabelecimentoNascimentoProps> = ({
  getValue,
  setValue,
  disabled = false,
  error,
  required = false,
}) => {
  const municipioId = getValue('crianca.nascimento_municipio_id');
  const unidadeId = getValue('crianca.hospital_nascimento_unidade_id');
  const value = unidadeId != null && unidadeId !== '' ? String(unidadeId) : '';

  const { allowedOptions, loading } = useHospitaisNascimentoSinasc(
    municipioId != null && municipioId !== '' ? Number(municipioId) : undefined,
  );

  const handleChange = useCallback(
    (newValue: string) => {
      const id = newValue ? Number(newValue) : undefined;
      setValue('crianca.hospital_nascimento_unidade_id', id ?? undefined);
      if (id) {
        const found = allowedOptions.find((o) => o.idestabelecimento === id);
        setValue('crianca.hospital_nascimento_nome', found?.nome ?? undefined);
        setValue('crianca.hospital_nascimento_cnes', found?.cnes ?? undefined);
      } else {
        setValue('crianca.hospital_nascimento_nome', undefined);
        setValue('crianca.hospital_nascimento_cnes', undefined);
      }
    },
    [allowedOptions, setValue],
  );

  const semMunicipio = municipioId == null || municipioId === '';
  const placeholder = semMunicipio
    ? 'Selecione primeiro o município'
    : loading
      ? 'Carregando hospitais...'
      : allowedOptions.length === 0
        ? 'Nenhum hospital de nascimento cadastrado neste município'
        : 'CNES ou nome do hospital';

  return (
    <div className="min-w-0">
      <UnidadeNotificadoraField
        value={value}
        onChange={handleChange}
        label={required ? 'Hospital de nascimento *' : 'Hospital de nascimento'}
        placeholder={placeholder}
        disabled={disabled || semMunicipio || loading}
        allowedOptions={allowedOptions}
        restrictToAllowed={Boolean(municipioId) && allowedOptions.length > 0}
        expandAllowedOptionsOnFocus={allowedOptions.length > 0}
        denyOutsideMessage="Selecione um hospital da lista deste município."
        hasError={!!error}
        errorMessage={error}
      />
    </div>
  );
};
