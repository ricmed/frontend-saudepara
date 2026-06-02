/**
 * UF e Município de Residência — mesma lógica do EstadoMunicipioNotificacao.
 * Sincroniza residencia.uf / residencia.municipio_ibge com residencia.estado_id / residencia.municipio_id.
 * O backend pode retornar estado.sigla como código IBGE numérico ("15") em vez de sigla ("PA");
 * usamos mapa UF <-> código para encontrar o estado quando o CEP preenche UF em 2 letras.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usuarioGestaoService } from '@/services/UsuarioGestaoService';
import LocationInput from '@/features/notificationForms/components/LocationInput';

/** idtipo_pais de Brasil em `tipo_pais` (mesmo valor usado em notificacaoService). */
const TIPO_PAIS_BRASIL_ID = '105';

/** Sigla (2 letras) -> código IBGE do estado (string). ViaCEP retorna uf "PA"; backend pode retornar sigla "15". */
const UF_SIGLA_TO_IBGE: Record<string, string> = {
  AC: '12', AL: '27', AP: '16', AM: '13', BA: '29', CE: '23', DF: '53', ES: '32', GO: '52',
  MA: '21', MT: '51', MS: '50', MG: '31', PA: '15', PB: '25', PR: '41', PE: '26', PI: '22',
  RJ: '33', RN: '24', RS: '43', RO: '11', RR: '14', SC: '42', SP: '35', SE: '28', TO: '17',
};
/** Código IBGE -> sigla (2 letras). Para exibir e salvar residencia.uf sempre em 2 letras. */
const IBGE_TO_UF_SIGLA: Record<string, string> = Object.fromEntries(
  Object.entries(UF_SIGLA_TO_IBGE).map(([k, v]) => [v, k])
);

interface Estado {
  id: number;
  sigla: string;
  descricao: string;
}

interface EstadoMunicipioResidenciaProps {
  getValue: (key: string) => any;
  setValue: (key: string, value: any) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export const EstadoMunicipioResidencia: React.FC<EstadoMunicipioResidenciaProps> = ({
  getValue,
  setValue,
  disabled = false,
  error,
  required = false,
}) => {
  const [estados, setEstados] = useState<Estado[]>([]);
  const lastMunicipioEstadoSyncRef = useRef<string>('');
  const lastMunicipioIbgeSyncRef = useRef<string>('');
  const ufTransitionLockUntilRef = useRef<number>(0);
  const beginUfTransitionLock = useCallback((ms = 350) => {
    ufTransitionLockUntilRef.current = Date.now() + ms;
  }, []);
  const isUfTransitionLocked = useCallback(
    () => Date.now() < ufTransitionLockUntilRef.current,
    []
  );

  const estadoId = getValue('residencia.estado_id');
  const municipioId = getValue('residencia.municipio_id');
  const uf = getValue('residencia.uf');
  const municipioIbge = getValue('residencia.municipio_ibge');

  const estadoValue = estadoId != null && estadoId !== '' ? String(estadoId) : '';
  const municipioValue = municipioId != null && municipioId !== '' ? String(municipioId) : '';
  const ufNorm = String(uf ?? '').trim().toUpperCase();

  // UF EX (exterior) não pode manter estado/município brasileiro selecionados.
  useEffect(() => {
    if (ufNorm !== 'EX') return;
    if (estadoId != null && estadoId !== '') setValue('residencia.estado_id', undefined);
    if (municipioId != null && municipioId !== '') setValue('residencia.municipio_id', undefined);
    if (String(municipioIbge ?? '').trim() !== '') setValue('residencia.municipio_ibge', '');
  }, [ufNorm, estadoId, municipioId, municipioIbge, setValue]);

  useEffect(() => {
    if (isUfTransitionLocked()) return;
    if (ufNorm === 'EX') return;
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
        if (idEstado) setValue('residencia.estado_id', idEstado);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [municipioId, estadoId, setValue, isUfTransitionLocked, ufNorm]);

  useEffect(() => {
    let cancelled = false;
    usuarioGestaoService
      .getHierarquiaCompleta()
      .then((h) => {
        if (!cancelled && h?.estados) setEstados(h.estados);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (isUfTransitionLocked()) return;
    if (ufNorm === 'EX') return;
    if (!estadoId || !estados.length) return;
    const estado = estados.find((e) => e.id === Number(estadoId));
    const ufExibir = estado?.sigla ? (IBGE_TO_UF_SIGLA[estado.sigla] ?? estado.sigla) : '';
    if (ufExibir && String(uf ?? '').trim().toUpperCase() !== ufExibir) {
      setValue('residencia.uf', ufExibir);
    }
  }, [estadoId, estados, setValue, uf, isUfTransitionLocked, ufNorm]);

  // Sincronizar estado_id quando uf vem do CEP (ViaCEP retorna "PA"; backend pode retornar sigla "15")
  useEffect(() => {
    if (ufNorm === 'EX') return;
    if (!uf || !estados.length) return;
    const ufValueNorm = String(uf).trim().toUpperCase();
    if (!ufValueNorm) return;

    const currentEstado = estadoId ? estados.find((e) => e.id === Number(estadoId)) : undefined;
    const currentUfFromEstado = currentEstado?.sigla ? (IBGE_TO_UF_SIGLA[currentEstado.sigla] ?? currentEstado.sigla) : '';

    // Estado já coerente com UF atual -> nada a fazer.
    if (currentUfFromEstado && currentUfFromEstado === ufValueNorm) return;

    const codigoIbge = UF_SIGLA_TO_IBGE[ufValueNorm];
    const estado = estados.find(
      (e) => e.sigla === ufValueNorm || (codigoIbge != null && e.sigla === codigoIbge)
    );
    if (estado && String(estadoId ?? '') !== String(estado.id)) {
      beginUfTransitionLock();
      setValue('residencia.estado_id', estado.id);
      // CEP pode preencher IBGE antes do estado_id; não apagar nesse caso.
      const ibgeFromCep = String(municipioIbge ?? '').replace(/\D/g, '');
      if (!ibgeFromCep) {
        setValue('residencia.municipio_id', undefined);
        setValue('residencia.municipio_ibge', '');
      }
    }
  }, [estadoId, uf, estados, setValue, beginUfTransitionLock, ufNorm, municipioIbge]);

  // UF brasileira implica país de residência Brasil (lista de estados = UFs do Brasil)
  useEffect(() => {
    const hasEstado = estadoId != null && estadoId !== '';
    const hasMunicipio = municipioId != null && municipioId !== '';
    const isUfBrasil = !!ufNorm && ufNorm !== 'EX';
    if (!isUfBrasil && !hasEstado && !hasMunicipio) return;
    if (ufNorm === 'EX' && !hasEstado && !hasMunicipio) return;
    if (String(getValue('residencia.pais') ?? '') !== TIPO_PAIS_BRASIL_ID) {
      setValue('residencia.pais', TIPO_PAIS_BRASIL_ID);
    }
  }, [estadoId, municipioId, getValue, setValue, ufNorm]);

  useEffect(() => {
    if (ufNorm === 'EX') return;
    if (!municipioIbge || !estadoValue) return;

    const syncMunicipioFromIbge = () => {
      const signature = `${estadoValue}|${String(municipioIbge).replace(/\D/g, '')}`;
      if (lastMunicipioIbgeSyncRef.current === signature) return;
      lastMunicipioIbgeSyncRef.current = signature;
      const ibgeNorm = String(municipioIbge).replace(/\D/g, '');
      const matchCodigo = (cod: string | undefined) => {
        if (cod == null) return false;
        const c = String(cod).replace(/\D/g, '');
        if (c === ibgeNorm) return true;
        if (ibgeNorm.length === 7 && c.length === 6 && ibgeNorm.slice(0, 6) === c) return true;
        if (ibgeNorm.length === 6 && c.length === 7 && ibgeNorm === c.slice(0, 6)) return true;
        return false;
      };
      usuarioGestaoService
        .getMunicipiosPorEstado(Number(estadoValue))
        .then((list: Array<{ id: number; descricao: string; codigo?: string }>) => {
          const mun = list.find((m: any) => matchCodigo(m.codigo));
          if (mun && String(municipioId ?? '') !== String(mun.id)) {
            setValue('residencia.municipio_id', mun.id);
          }
        })
        .catch(() => {});
    };

    if (isUfTransitionLocked()) {
      const timer = window.setTimeout(syncMunicipioFromIbge, 400);
      return () => window.clearTimeout(timer);
    }
    syncMunicipioFromIbge();
  }, [municipioIbge, estadoValue, municipioId, setValue, isUfTransitionLocked, ufNorm]);

  const handleUfChange = useCallback(
    (value: string) => {
      const id = value ? Number(value) : undefined;
      const estado = estados.find((e) => e.id === id);
      const ufExibir = estado?.sigla ? (IBGE_TO_UF_SIGLA[estado.sigla] ?? estado.sigla) : '';
      beginUfTransitionLock();
      setValue('residencia.estado_id', id);
      setValue('residencia.uf', ufExibir);
      setValue('residencia.municipio_id', undefined);
      setValue('residencia.municipio_ibge', '');
    },
    [estados, setValue, beginUfTransitionLock]
  );

  const handleMunicipioChange = useCallback(
    (value: string) => {
      const id = value ? Number(value) : undefined;
      setValue('residencia.municipio_id', id);
      if (id) {
        usuarioGestaoService
          .getMunicipioComEstado(id)
          .then((mun: any) => {
            setValue('residencia.municipio_ibge', mun?.codigo ?? '');
          })
          .catch(() => {});
      } else {
        setValue('residencia.municipio_ibge', '');
      }
    },
    [setValue]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <LocationInput
          name="uf_residencia"
          label="UF de residência"
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
          name="municipio_residencia"
          label="Município de residência"
          value={municipioValue}
          onChange={handleMunicipioChange}
          placeholder={estadoValue ? 'Pesquise por código ou nome (ex.: 150140, Belém)' : 'Selecione primeiro a UF'}
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
