/**
 * UF e município de nascimento da criança (campos 51–52).
 * Lista de hospitais restrita ao Pará (SINASC.dbf + base CNES).
 */
import React, { useEffect, useCallback, useRef } from 'react';
import LocationInput from '@/features/notificationForms/components/LocationInput';
import { usuarioGestaoService } from '@/services/UsuarioGestaoService';
import { HOSPITAIS_NASCIMENTO_PARA } from '../data/hospitaisNascimentoPara';

const PA_UF_SIGLA = 'PA';

interface EstadoMunicipioNascimentoProps {
  getValue: (key: string) => unknown;
  setValue: (key: string, value: unknown) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  /** Limpa hospital ao trocar município */
  onMunicipioChange?: () => void;
}

export const EstadoMunicipioNascimento: React.FC<EstadoMunicipioNascimentoProps> = ({
  getValue,
  setValue,
  disabled = false,
  error,
  required = false,
  onMunicipioChange,
}) => {
  const paEstadoId = HOSPITAIS_NASCIMENTO_PARA.estadoId;
  const municipioId = getValue('crianca.nascimento_municipio_id');
  const municipioValue = municipioId != null && municipioId !== '' ? String(municipioId) : '';
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    if (!getValue('crianca.nascimento_estado_id')) {
      setValue('crianca.nascimento_estado_id', paEstadoId);
    }
    if (!getValue('crianca.nascimento_uf')) {
      setValue('crianca.nascimento_uf', PA_UF_SIGLA);
    }
  }, [getValue, setValue, paEstadoId]);

  const clearHospital = useCallback(() => {
    setValue('crianca.hospital_nascimento_unidade_id', undefined);
    setValue('crianca.hospital_nascimento_nome', undefined);
    setValue('crianca.hospital_nascimento_cnes', undefined);
    onMunicipioChange?.();
  }, [setValue, onMunicipioChange]);

  const handleMunicipioChange = useCallback(
    (value: string) => {
      const id = value ? Number(value) : undefined;
      const prev = getValue('crianca.nascimento_municipio_id');
      setValue('crianca.nascimento_municipio_id', id);
      setValue('crianca.nascimento_estado_id', paEstadoId);
      setValue('crianca.nascimento_uf', PA_UF_SIGLA);
      if (String(prev ?? '') !== String(id ?? '')) {
        clearHospital();
      }
      if (id) {
        usuarioGestaoService
          .getMunicipioComEstado(id)
          .then((mun: { codigo?: string }) => {
            setValue('crianca.nascimento_municipio_ibge', mun?.codigo ?? '');
          })
          .catch(() => {
            setValue('crianca.nascimento_municipio_ibge', '');
          });
      } else {
        setValue('crianca.nascimento_municipio_ibge', '');
      }
    },
    [clearHospital, getValue, paEstadoId, setValue],
  );

  return (
    <>
      <div data-field-key="crianca.nascimento_municipio_id">
        <label className="mb-2 flex min-h-[2.5rem] items-end text-sm font-medium text-gray-700">
          {required ? 'UF de nascimento *' : 'UF de nascimento'}
        </label>
        <input
          type="text"
          readOnly
          disabled
          value={`Pará (${PA_UF_SIGLA})`}
          className="w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          aria-readonly
        />
      </div>
      <div>
        <LocationInput
          name="municipio_nascimento"
          label={required ? 'Município de nascimento *' : 'Município de nascimento'}
          value={municipioValue}
          onChange={handleMunicipioChange}
          placeholder="Pesquise por código ou nome (ex.: 150140, Belém)"
          disabled={disabled}
          apiEndpoint="api/tipo-municipio"
          idField="idtipo_municipio"
          parentValue={String(paEstadoId)}
          required={required}
          error={error}
        />
      </div>
    </>
  );
};
