import type { FormData, ModoLocalidadeEvento } from '@/features/notificationForms/types/index2';

export const BRASIL_PAIS_ID = '105';
export const PARA_ESTADO_ID = '15';
export const BELEM_MUNICIPIO_ID = '170';
export const SANTAREM_IBGE_CODES = ['1506807', '150680'] as const;
export const SANTAREM_DESCRICAO = 'Santarém';

export interface MunicipioLookup {
  idtipo_municipio: number;
  descricao: string;
  codigo?: string | null;
}

export interface ResidenciaAutoFillCurrent {
  paisProcedencia: string;
  uf: string;
  municipio: string;
  bairro: string;
  localHospedagem: string;
  contatoLocal: string;
}

export function usaLocalidadeEvento(
  modo: ModoLocalidadeEvento | null | undefined,
): boolean {
  return modo === 'OPCIONAL' || modo === 'OBRIGATORIA';
}

export function getResidentePerguntaLabel(modo: ModoLocalidadeEvento): string {
  return usaLocalidadeEvento(modo)
    ? 'Residente em Alter do Chão?'
    : 'Residente em Belém?';
}

function normalizeMunicipioDescricao(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

const SANTAREM_NORMALIZADO = normalizeMunicipioDescricao(SANTAREM_DESCRICAO);

export function findSantaremMunicipioId(
  municipios: MunicipioLookup[],
): string | null {
  const exact = municipios.filter(
    (municipio) =>
      normalizeMunicipioDescricao(municipio.descricao) === SANTAREM_NORMALIZADO,
  );

  if (exact.length === 1) {
    return String(exact[0].idtipo_municipio);
  }

  const byIbge = municipios.filter(
    (municipio) =>
      municipio.codigo != null &&
      (SANTAREM_IBGE_CODES as readonly string[]).includes(String(municipio.codigo)),
  );

  if (
    byIbge.length === 1 &&
    normalizeMunicipioDescricao(byIbge[0].descricao) === SANTAREM_NORMALIZADO
  ) {
    return String(byIbge[0].idtipo_municipio);
  }

  return null;
}

export function applyResidenciaAutoFill(args: {
  residenteBelem: string;
  modo: ModoLocalidadeEvento;
  current: ResidenciaAutoFillCurrent;
  santaremMunicipioId: string | null;
  residenteJustChanged: boolean;
  hydrate: boolean;
}): Pick<
  FormData,
  | 'paisProcedencia'
  | 'uf'
  | 'municipio'
  | 'bairro'
  | 'localHospedagem'
  | 'contatoLocal'
> | null {
  const {
    residenteBelem,
    modo,
    current,
    santaremMunicipioId,
    residenteJustChanged,
    hydrate,
  } = args;

  if (!residenteBelem) {
    return null;
  }

  if (usaLocalidadeEvento(modo)) {
    if (residenteBelem === '1') {
      const municipio =
        santaremMunicipioId ??
        (current.municipio === BELEM_MUNICIPIO_ID ? '' : current.municipio);

      return {
        paisProcedencia: BRASIL_PAIS_ID,
        uf: PARA_ESTADO_ID,
        municipio,
        bairro: '',
        localHospedagem: '',
        contatoLocal: '',
      };
    }

    if (residenteBelem === '2') {
      const shouldPreselectSantarem =
        (!hydrate && residenteJustChanged) ||
        !current.municipio ||
        current.municipio === BELEM_MUNICIPIO_ID;

      return {
        paisProcedencia: BRASIL_PAIS_ID,
        uf: shouldPreselectSantarem ? PARA_ESTADO_ID : current.uf || PARA_ESTADO_ID,
        municipio: shouldPreselectSantarem
          ? santaremMunicipioId ?? ''
          : current.municipio,
        bairro: '',
        localHospedagem: current.localHospedagem,
        contatoLocal: current.contatoLocal,
      };
    }

    if (residenteBelem === '3') {
      return {
        paisProcedencia:
          current.paisProcedencia === BRASIL_PAIS_ID ? '' : current.paisProcedencia,
        uf: '',
        municipio: '',
        bairro: '',
        localHospedagem: current.localHospedagem,
        contatoLocal: current.contatoLocal,
      };
    }

    return null;
  }

  if (residenteBelem === '1') {
    return {
      paisProcedencia: BRASIL_PAIS_ID,
      uf: PARA_ESTADO_ID,
      municipio: BELEM_MUNICIPIO_ID,
      bairro: current.bairro,
      localHospedagem: '',
      contatoLocal: '',
    };
  }

  if (residenteBelem === '2') {
    const clearBelem = current.municipio === BELEM_MUNICIPIO_ID;

    return {
      paisProcedencia: BRASIL_PAIS_ID,
      uf: clearBelem ? '' : current.uf,
      municipio: clearBelem ? '' : current.municipio,
      bairro: '',
      localHospedagem: current.localHospedagem,
      contatoLocal: current.contatoLocal,
    };
  }

  if (residenteBelem === '3') {
    return {
      paisProcedencia:
        current.paisProcedencia === BRASIL_PAIS_ID ? '' : current.paisProcedencia,
      uf: '',
      municipio: '',
      bairro: '',
      localHospedagem: current.localHospedagem,
      contatoLocal: current.contatoLocal,
    };
  }

  return null;
}
