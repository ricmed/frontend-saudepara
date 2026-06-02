/**
 * Unidade/consultório de realização do pré-natal (campo 44 — CNES).
 */
import React, { useCallback } from 'react';
import UnidadeNotificadoraField from '@/features/notificationForms/components/UnidadeNotificadoraField';
import { usuarioGestaoService } from '@/services/UsuarioGestaoService';

interface EstabelecimentoPrenatalProps {
  getValue: (key: string) => any;
  setValue: (key: string, value: any) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export const EstabelecimentoPrenatal: React.FC<EstabelecimentoPrenatalProps> = ({
  getValue,
  setValue,
  disabled = false,
  error,
  required = false,
}) => {
  const unidadeId = getValue('prenatal.unidade_id');
  const value = unidadeId != null && unidadeId !== '' ? String(unidadeId) : '';

  const handleChange = useCallback(
    (newValue: string) => {
      const id = newValue ? Number(newValue) : undefined;
      setValue('prenatal.unidade_id', id ?? undefined);
      if (id) {
        usuarioGestaoService
          .getEstabelecimentoComHierarquia(id)
          .then((est: any) => {
            setValue('prenatal.estabelecimento_nome', est?.nome ?? undefined);
            setValue('prenatal.estabelecimento_cnes', est?.cnes ?? undefined);
          })
          .catch(() => {
            setValue('prenatal.estabelecimento_nome', undefined);
            setValue('prenatal.estabelecimento_cnes', undefined);
          });
      } else {
        setValue('prenatal.estabelecimento_nome', undefined);
        setValue('prenatal.estabelecimento_cnes', undefined);
      }
    },
    [setValue],
  );

  return (
    <div className="min-w-0">
      <UnidadeNotificadoraField
        value={value}
        onChange={handleChange}
        label={required ? 'Unidade/consultório (CNES) *' : 'Unidade/consultório (CNES)'}
        placeholder="CNES ou nome (mín. 3 caracteres)"
        disabled={disabled}
        allowAllEstablishments
        hasError={!!error}
        errorMessage={error}
      />
    </div>
  );
};
