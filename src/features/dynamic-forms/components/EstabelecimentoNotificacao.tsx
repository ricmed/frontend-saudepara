/**
 * Estabelecimento da Notificação — restrito ao município selecionado (mesma lógica de
 * local de nascimento / investigador). Preenche automaticamente:
 * - notificacao.estabelecimento = nome do estabelecimento (vai pro banco em estabelecimento_nome)
 * - notificacao.estabelecimento_cnes = CNES do estabelecimento
 * - notificacao.unidade_id = idestabelecimento (FK opcional, para relação)
 */
import React, { useCallback } from 'react';
import { EstabelecimentoPorMunicipioField } from './EstabelecimentoPorMunicipioField';

interface EstabelecimentoNotificacaoProps {
  getValue: (key: string) => any;
  setValue: (key: string, value: any) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  /** Usuário vinculado à unidade: campo somente leitura (valor já definido pelo vínculo). */
  lockEstablishment?: boolean;
}

export const EstabelecimentoNotificacao: React.FC<EstabelecimentoNotificacaoProps> = ({
  getValue,
  setValue,
  disabled = false,
  error,
  required = false,
  lockEstablishment = false,
}) => {
  const handleUnidadeChange = useCallback(
    (id: number | undefined, meta?: { nome?: string; cnes?: string }) => {
      setValue('notificacao.unidade_id', id ?? undefined);
      setValue('notificacao.estabelecimento', meta?.nome ?? undefined);
      setValue('notificacao.estabelecimento_cnes', meta?.cnes ?? undefined);
    },
    [setValue],
  );

  return (
    <EstabelecimentoPorMunicipioField
      municipioId={getValue('notificacao.municipio_id')}
      unidadeId={getValue('notificacao.unidade_id')}
      onUnidadeChange={handleUnidadeChange}
      disabled={disabled || lockEstablishment}
      error={error}
      required={required}
      label={required ? 'Estabelecimento *' : 'Estabelecimento'}
      municipioObrigatorioMessage="Selecione primeiro o município"
      denyOutsideMessage="Selecione uma unidade do município escolhido."
    />
  );
};
