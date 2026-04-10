/**
 * UF e Município da Notificação — usa o mesmo LocationInput do Notification Forms
 * (pesquisa, dropdown, cache). Preenche automaticamente:
 * - notificacao.uf_notificacao = código da UF (tipo_estado.codigo), enviado ao backend
 * - notificacao.estado_id = id do estado (para o dropdown); no frontend exibe o nome (descricao)
 * - notificacao.municipio_id (ID tipo_municipio)
 * - notificacao.municipio_notificacao_ibge (código IBGE)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { usuarioGestaoService } from '@/services/UsuarioGestaoService';
import LocationInput from '@/features/notificationForms/components/LocationInput';

interface Estado {
  id: number;
  sigla: string;
  descricao: string;
}

interface EstadoMunicipioNotificacaoProps {
  getValue: (key: string) => any;
  setValue: (key: string, value: any) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export const EstadoMunicipioNotificacao: React.FC<EstadoMunicipioNotificacaoProps> = ({
  getValue,
  setValue,
  disabled = false,
  error,
  required = false,
}) => {
  const [estados, setEstados] = useState<Estado[]>([]);

  const estadoId = getValue('notificacao.estado_id');
  const municipioId = getValue('notificacao.municipio_id');

  const estadoValue = estadoId != null && estadoId !== '' ? String(estadoId) : '';
  const municipioValue = municipioId != null && municipioId !== '' ? String(municipioId) : '';

  // Se temos municipio_id mas não estado_id (dados já salvos), buscar estado do município
  useEffect(() => {
    if (!municipioId || estadoId) return;
    let cancelled = false;
    usuarioGestaoService
      .getMunicipioComEstado(Number(municipioId))
      .then((mun: any) => {
        if (cancelled) return;
        const idEstado = mun?.tipo_estado_idtipo_estado ?? mun?.tipo_estado?.idtipo_estado;
        if (idEstado) setValue('notificacao.estado_id', idEstado);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [municipioId, estadoId, setValue]);

  // Carregar estados para obter sigla ao selecionar UF (LocationInput só devolve o ID)
  useEffect(() => {
    let cancelled = false;
    usuarioGestaoService
      .getHierarquiaCompleta()
      .then((h) => {
        if (!cancelled && h?.estados) {
          setEstados(h.estados);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Se já temos estado_id mas sigla vazia (ex.: estados carregaram depois), preencher sigla
  useEffect(() => {
    if (!estadoId || !estados.length) return;
    const estado = estados.find((e) => e.id === Number(estadoId));
    if (estado?.sigla && getValue('notificacao.uf_notificacao') !== estado.sigla) {
      setValue('notificacao.uf_notificacao', estado.sigla);
    }
  }, [estadoId, estados, getValue, setValue]);

  const handleUfChange = useCallback(
    (value: string) => {
      const id = value ? Number(value) : undefined;
      const estado = estados.find((e) => e.id === id);
      setValue('notificacao.estado_id', id);
      setValue('notificacao.uf_notificacao', estado?.sigla ?? ''); // sigla = codigo UF (backend armazena código; front exibe nome)
      setValue('notificacao.municipio_id', undefined);
      setValue('notificacao.municipio_notificacao_ibge', '');
    },
    [estados, setValue]
  );

  const handleMunicipioChange = useCallback(
    (value: string) => {
      const id = value ? Number(value) : undefined;
      setValue('notificacao.municipio_id', id);
      if (id) {
        usuarioGestaoService
          .getMunicipioComEstado(id)
          .then((mun: any) => {
            const codigo = mun?.codigo ?? '';
            setValue('notificacao.municipio_notificacao_ibge', codigo);
          })
          .catch(() => {});
      } else {
        setValue('notificacao.municipio_notificacao_ibge', '');
      }
    },
    [setValue]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <LocationInput
          name="uf"
          label={required ? 'UF da Notificação *' : 'UF da Notificação'}
          value={estadoValue}
          onChange={handleUfChange}
          placeholder="Pesquise por código ou nome (ex.: 15, PA)"
          disabled={disabled}
          apiEndpoint="api/tipo-estado"
          idField="idtipo_estado"
          required={required}
          error={error}
        />
      </div>
      <div>
        <LocationInput
          name="municipio"
          label={required ? 'Município da Notificação *' : 'Município da Notificação'}
          value={municipioValue}
          onChange={handleMunicipioChange}
          placeholder={
            estadoValue
              ? 'Pesquise por código ou nome (ex.: 150140, Belém)'
              : 'Selecione primeiro a UF'
          }
          disabled={disabled || !estadoValue}
          apiEndpoint="api/tipo-municipio"
          idField="idtipo_municipio"
          parentValue={estadoValue}
          required={required}
        />
      </div>
    </div>
  );
};
