import { useEffect, useState } from 'react';
import {
  listarEstabelecimentosPorMunicipio,
  type EstabelecimentoMunicipioItem,
  type EstabelecimentosPorMunicipioOptions,
} from '@/services/estabelecimentoPorMunicipio';

export type EstabelecimentoSelectOption = {
  idestabelecimento: number;
  nome: string;
  cnes?: string;
};

function toSelectOptions(list: EstabelecimentoMunicipioItem[]): EstabelecimentoSelectOption[] {
  return list.map((est) => ({
    idestabelecimento: est.id,
    nome: est.nome,
    cnes: est.cnes,
  }));
}

/**
 * Carrega estabelecimentos do município para combos restritos (ex.: investigador).
 * `incluirInativos` default false — mesmo contrato da API existente.
 */
export function useEstabelecimentosPorMunicipio(
  municipioId: number | null | undefined,
  options?: EstabelecimentosPorMunicipioOptions,
) {
  const incluirInativos = options?.incluirInativos ?? false;
  const [allowedOptions, setAllowedOptions] = useState<EstabelecimentoSelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (municipioId == null || municipioId === '' || Number.isNaN(Number(municipioId))) {
      setAllowedOptions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    listarEstabelecimentosPorMunicipio(Number(municipioId), { incluirInativos })
      .then((list) => {
        if (!cancelled) setAllowedOptions(toSelectOptions(list));
      })
      .catch(() => {
        if (!cancelled) setAllowedOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [municipioId, incluirInativos]);

  return { allowedOptions, loading };
}
