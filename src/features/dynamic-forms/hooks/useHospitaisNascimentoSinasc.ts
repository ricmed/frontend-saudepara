import { useEffect, useState } from 'react';
import { listarHospitaisNascimentoSinasc } from '@/services/estabelecimentoPorMunicipio';
import {
  getHospitaisNascimentoPorMunicipio,
  toUnidadeSelectOptions,
} from '../data/hospitaisNascimentoPara';

type SelectOption = { idestabelecimento: number; nome: string; cnes?: string };

/**
 * Hospitais de nascimento SINASC por município (API ao vivo; fallback JSON offline).
 */
export function useHospitaisNascimentoSinasc(municipioId: number | null | undefined) {
  const [allowedOptions, setAllowedOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    if (municipioId == null || municipioId === '' || Number.isNaN(Number(municipioId))) {
      setAllowedOptions([]);
      setFromCache(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFromCache(false);

    listarHospitaisNascimentoSinasc(Number(municipioId))
      .then((list) => {
        if (cancelled) return;
        setAllowedOptions(
          list.map((h) => ({
            idestabelecimento: h.id,
            nome: h.nome,
            cnes: h.cnes,
          })),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setFromCache(true);
        setAllowedOptions(
          toUnidadeSelectOptions(getHospitaisNascimentoPorMunicipio(Number(municipioId))),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [municipioId]);

  return { allowedOptions, loading, fromCache };
}
