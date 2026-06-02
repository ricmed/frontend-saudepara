/**
 * UF e Município de realização do pré-natal (campos 42–43 da ficha criança exposta HBV).
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usuarioGestaoService } from '@/services/UsuarioGestaoService';
import LocationInput from '@/features/notificationForms/components/LocationInput';

const UF_SIGLA_TO_IBGE: Record<string, string> = {
  AC: '12', AL: '27', AP: '16', AM: '13', BA: '29', CE: '23', DF: '53', ES: '32', GO: '52',
  MA: '21', MT: '51', MS: '50', MG: '31', PA: '15', PB: '25', PR: '41', PE: '26', PI: '22',
  RJ: '33', RN: '24', RS: '43', RO: '11', RR: '14', SC: '42', SP: '35', SE: '28', TO: '17',
};
const IBGE_TO_UF_SIGLA: Record<string, string> = Object.fromEntries(
  Object.entries(UF_SIGLA_TO_IBGE).map(([k, v]) => [v, k]),
);

interface Estado {
  id: number;
  sigla: string;
  descricao: string;
}

interface EstadoMunicipioPrenatalProps {
  getValue: (key: string) => any;
  setValue: (key: string, value: any) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export const EstadoMunicipioPrenatal: React.FC<EstadoMunicipioPrenatalProps> = ({
  getValue,
  setValue,
  disabled = false,
  error,
  required = false,
}) => {
  const [estados, setEstados] = useState<Estado[]>([]);
  const lastMunicipioEstadoSyncRef = useRef<string>('');

  const estadoId = getValue('prenatal.estado_id');
  const municipioId = getValue('prenatal.municipio_id');
  const uf = getValue('prenatal.uf');

  const estadoValue = estadoId != null && estadoId !== '' ? String(estadoId) : '';
  const municipioValue = municipioId != null && municipioId !== '' ? String(municipioId) : '';

  useEffect(() => {
    if (!municipioId || estadoId) return;
    const signature = String(municipioId);
    if (lastMunicipioEstadoSyncRef.current === signature) return;
    lastMunicipioEstadoSyncRef.current = signature;
    let cancelled = false;
    usuarioGestaoService
      .getMunicipioComEstado(Number(municipioId))
      .then((mun: any) => {
        if (cancelled) return;
        const idEstado = mun?.tipo_estado_idtipo_estado ?? mun?.tipo_estado?.idtipo_estado;
        if (idEstado) setValue('prenatal.estado_id', idEstado);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [municipioId, estadoId, setValue]);

  useEffect(() => {
    let cancelled = false;
    usuarioGestaoService
      .getHierarquiaCompleta()
      .then((h) => {
        if (!cancelled && h?.estados) setEstados(h.estados);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!estadoId || !estados.length) return;
    const estado = estados.find((e) => e.id === Number(estadoId));
    const ufExibir = estado?.sigla ? (IBGE_TO_UF_SIGLA[estado.sigla] ?? estado.sigla) : '';
    if (ufExibir && String(uf ?? '').trim().toUpperCase() !== ufExibir) {
      setValue('prenatal.uf', ufExibir);
    }
  }, [estadoId, estados, setValue, uf]);

  const handleUfChange = useCallback(
    (value: string) => {
      const id = value ? Number(value) : undefined;
      const estado = estados.find((e) => e.id === id);
      const ufExibir = estado?.sigla ? (IBGE_TO_UF_SIGLA[estado.sigla] ?? estado.sigla) : '';
      setValue('prenatal.estado_id', id);
      setValue('prenatal.uf', ufExibir);
      setValue('prenatal.municipio_id', undefined);
      setValue('prenatal.municipio_ibge', '');
    },
    [estados, setValue],
  );

  const handleMunicipioChange = useCallback(
    (value: string) => {
      const id = value ? Number(value) : undefined;
      setValue('prenatal.municipio_id', id);
      if (id) {
        usuarioGestaoService
          .getMunicipioComEstado(id)
          .then((mun: any) => {
            setValue('prenatal.municipio_ibge', mun?.codigo ?? '');
          })
          .catch(() => {});
      } else {
        setValue('prenatal.municipio_ibge', '');
      }
    },
    [setValue],
  );

  return (
    <>
      <div>
        <LocationInput
          name="uf_prenatal"
          label={required ? 'UF de realização do pré-natal *' : 'UF de realização do pré-natal'}
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
          name="municipio_prenatal"
          label={required ? 'Município de realização do pré-natal *' : 'Município de realização do pré-natal'}
          value={municipioValue}
          onChange={handleMunicipioChange}
          placeholder={
            estadoValue ? 'Pesquise por código ou nome (ex.: 150140, Belém)' : 'Selecione primeiro a UF'
          }
          disabled={disabled || !estadoValue}
          apiEndpoint="api/tipo-municipio"
          idField="idtipo_municipio"
          parentValue={estadoValue}
          required={required}
        />
      </div>
    </>
  );
};
