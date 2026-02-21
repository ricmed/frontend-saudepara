/**
 * Estabelecimento da Notificação — mesma lógica do Notification Forms (UnidadeNotificadoraField)
 * com pesquisa; permite escolher qualquer estabelecimento (~11k). Preenche automaticamente:
 * - notificacao.estabelecimento = nome do estabelecimento (vai pro banco em estabelecimento_nome)
 * - notificacao.estabelecimento_cnes = id_unidade = CNES do estabelecimento
 * - notificacao.unidade_id = idestabelecimento (FK opcional, para relação)
 */
import React, { useCallback } from 'react';
import UnidadeNotificadoraField from '@/features/notificationForms/components/UnidadeNotificadoraField';
import { usuarioGestaoService } from '@/services/UsuarioGestaoService';

interface EstabelecimentoNotificacaoProps {
  getValue: (key: string) => any;
  setValue: (key: string, value: any) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export const EstabelecimentoNotificacao: React.FC<EstabelecimentoNotificacaoProps> = ({
  getValue,
  setValue,
  disabled = false,
  error,
  required = false,
}) => {
  const unidadeId = getValue('notificacao.unidade_id');
  const value = unidadeId != null && unidadeId !== '' ? String(unidadeId) : '';

  const handleChange = useCallback(
    (newValue: string) => {
      const id = newValue ? Number(newValue) : undefined;
      setValue('notificacao.unidade_id', id ?? undefined);
      if (id) {
        usuarioGestaoService
          .getEstabelecimentoComHierarquia(id)
          .then((est: any) => {
            const nome = est?.nome ?? '';
            const cnes = est?.cnes ?? '';
            setValue('notificacao.estabelecimento', nome || undefined);
            setValue('notificacao.estabelecimento_cnes', cnes || undefined);
          })
          .catch(() => {
            setValue('notificacao.estabelecimento', undefined);
            setValue('notificacao.estabelecimento_cnes', undefined);
          });
      } else {
        setValue('notificacao.estabelecimento', undefined);
        setValue('notificacao.estabelecimento_cnes', undefined);
      }
    },
    [setValue]
  );

  return (
    <div>
      <UnidadeNotificadoraField
        value={value}
        onChange={handleChange}
        label={required ? 'Estabelecimento *' : 'Estabelecimento'}
        placeholder="Pesquise por nome (mín. 3 caracteres)..."
        disabled={disabled}
        allowAllEstablishments
        hasError={!!error}
        errorMessage={error}
      />
    </div>
  );
};
