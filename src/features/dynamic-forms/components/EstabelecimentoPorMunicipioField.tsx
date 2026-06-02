/**
 * Seletor de unidade (CNES) restrito ao município informado.
 * Reutilizável em formulários dinâmicos; não altera fluxos que usam busca global.
 */
import React, { useCallback } from 'react';
import UnidadeNotificadoraField from '@/features/notificationForms/components/UnidadeNotificadoraField';
import { usuarioGestaoService } from '@/services/UsuarioGestaoService';
import { useEstabelecimentosPorMunicipio } from '../hooks/useEstabelecimentosPorMunicipio';

export interface EstabelecimentoPorMunicipioFieldProps {
  municipioId: unknown;
  unidadeId: unknown;
  onUnidadeChange: (id: number | undefined, meta?: { nome?: string; cnes?: string }) => void;
  /** Inclui CNES inativos do município. Padrão: false. */
  incluirInativos?: boolean;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  label?: string;
  municipioObrigatorioMessage?: string;
  denyOutsideMessage?: string;
}

export const EstabelecimentoPorMunicipioField: React.FC<EstabelecimentoPorMunicipioFieldProps> = ({
  municipioId,
  unidadeId,
  onUnidadeChange,
  incluirInativos = false,
  disabled = false,
  error,
  required = false,
  label,
  municipioObrigatorioMessage = 'Selecione primeiro o município',
  denyOutsideMessage = 'Selecione uma unidade do município escolhido.',
}) => {
  const value = unidadeId != null && unidadeId !== '' ? String(unidadeId) : '';
  const { allowedOptions, loading } = useEstabelecimentosPorMunicipio(
    municipioId != null && municipioId !== '' ? Number(municipioId) : undefined,
    { incluirInativos },
  );

  const handleChange = useCallback(
    (newValue: string) => {
      const id = newValue ? Number(newValue) : undefined;
      if (!id) {
        onUnidadeChange(undefined);
        return;
      }
      usuarioGestaoService
        .getEstabelecimentoComHierarquia(id)
        .then((est: { nome?: string; cnes?: string }) => {
          onUnidadeChange(id, { nome: est?.nome, cnes: est?.cnes });
        })
        .catch(() => {
          onUnidadeChange(id);
        });
    },
    [onUnidadeChange],
  );

  const semMunicipio = municipioId == null || municipioId === '';
  const fieldLabel =
    label ?? (required ? 'Unidade de Saúde (CNES) *' : 'Unidade de Saúde (CNES)');
  const placeholder = semMunicipio
    ? municipioObrigatorioMessage
    : loading
      ? 'Carregando unidades...'
      : allowedOptions.length === 0
        ? 'Nenhuma unidade encontrada neste município'
        : 'CNES ou nome da unidade';

  return (
    <div className="min-w-0">
      <UnidadeNotificadoraField
        value={value}
        onChange={handleChange}
        label={fieldLabel}
        placeholder={placeholder}
        disabled={disabled || semMunicipio || loading}
        allowedOptions={allowedOptions}
        restrictToAllowed={Boolean(municipioId) && allowedOptions.length > 0}
        expandAllowedOptionsOnFocus={allowedOptions.length > 0}
        denyOutsideMessage={denyOutsideMessage}
        hasError={!!error}
        errorMessage={error}
      />
    </div>
  );
};
