/**
 * Município do investigador — somente Pará (UF fixa, sem seletor de estado).
 */
import React, { useEffect, useCallback, useRef } from 'react';
import LocationInput from '@/features/notificationForms/components/LocationInput';
import { usuarioGestaoService } from '@/services/UsuarioGestaoService';

const PA_UF_SIGLA = 'PA';
const PA_IBGE_UF = '15';

interface InvestigadorMunicipioParaProps {
  getValue: (key: string) => unknown;
  setValue: (key: string, value: unknown) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export const InvestigadorMunicipioPara: React.FC<InvestigadorMunicipioParaProps> = ({
  getValue,
  setValue,
  disabled = false,
  error,
  required = false,
}) => {
  const paEstadoIdRef = useRef<number | null>(null);
  const municipioId = getValue('investigador.municipio_id');
  const municipioValue = municipioId != null && municipioId !== '' ? String(municipioId) : '';
  const estadoId = getValue('investigador.estado_id');
  const estadoValue =
    estadoId != null && estadoId !== '' ? String(estadoId) : paEstadoIdRef.current != null ? String(paEstadoIdRef.current) : '';

  useEffect(() => {
    let cancelled = false;
    usuarioGestaoService
      .getHierarquiaCompleta()
      .then((h) => {
        if (cancelled || !h?.estados?.length) return;
        const pa = h.estados.find(
          (e: { sigla?: string; descricao?: string }) =>
            e.sigla === PA_IBGE_UF ||
            e.sigla === PA_UF_SIGLA ||
            String(e.descricao ?? '')
              .toUpperCase()
              .normalize('NFD')
              .replace(/\p{Diacritic}/gu, '')
              .includes('PARA'),
        );
        if (!pa?.id) return;
        paEstadoIdRef.current = pa.id;
        if (!getValue('investigador.estado_id')) {
          setValue('investigador.estado_id', pa.id);
        }
        if (!getValue('investigador.uf')) {
          setValue('investigador.uf', PA_UF_SIGLA);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [getValue, setValue]);

  const clearUnidade = useCallback(() => {
    setValue('investigador.unidade_id', undefined);
    setValue('investigador.estabelecimento_cnes', undefined);
    setValue('investigador.estabelecimento_nome', undefined);
  }, [setValue]);

  const handleMunicipioChange = useCallback(
    (value: string) => {
      const id = value ? Number(value) : undefined;
      const prev = getValue('investigador.municipio_id');
      setValue('investigador.municipio_id', id);
      if (String(prev ?? '') !== String(id ?? '')) {
        clearUnidade();
      }
      if (id) {
        usuarioGestaoService
          .getMunicipioComEstado(id)
          .then((mun: { codigo?: string }) => {
            setValue('investigador.municipio_ibge', mun?.codigo ?? '');
          })
          .catch(() => {
            setValue('investigador.municipio_ibge', '');
          });
      } else {
        setValue('investigador.municipio_ibge', '');
        clearUnidade();
      }
    },
    [clearUnidade, getValue, setValue],
  );

  return (
    <div className="min-w-0" data-field-key="investigador.municipio_id">
      <LocationInput
        name="municipio_investigador"
        label={required ? 'Município (Pará) *' : 'Município (Pará)'}
        value={municipioValue}
        onChange={handleMunicipioChange}
        placeholder="Pesquise por código IBGE ou nome (ex.: 150140, Belém)"
        disabled={disabled || !estadoValue}
        apiEndpoint="api/tipo-municipio"
        idField="idtipo_municipio"
        parentValue={estadoValue}
        required={required}
        error={error}
      />
      <p className="mt-1 text-xs text-gray-500">Apenas municípios do estado do Pará.</p>
    </div>
  );
};
