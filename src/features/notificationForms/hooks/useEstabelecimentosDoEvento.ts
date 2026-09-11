import { useEffect, useState } from 'react';
import {
  TiposEventoService,
  type EstabelecimentoEventoDTO,
} from '@/services/EventoService';
import indexedDBService from '@/services/indexedDB';

export function useEstabelecimentosDoEvento(eventoIdValue: string | undefined) {
  const [vincula, setVincula] = useState(false);
  const [vinculaEncaminhamentos, setVinculaEncaminhamentos] = useState(false);
  const [vinculaObitos, setVinculaObitos] = useState(false);
  const [estabelecimentos, setEstabelecimentos] = useState<
    EstabelecimentoEventoDTO[]
  >([]);
  const [encaminhamentos, setEncaminhamentos] = useState<
    EstabelecimentoEventoDTO[]
  >([]);
  const [obitos, setObitos] = useState<EstabelecimentoEventoDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const eventoId = Number(eventoIdValue);
    if (!Number.isInteger(eventoId) || eventoId <= 0) {
      setVincula(false);
      setVinculaEncaminhamentos(false);
      setVinculaObitos(false);
      setEstabelecimentos([]);
      setEncaminhamentos([]);
      setObitos([]);
      return;
    }

    let cancelled = false;
    const cacheKey = `estabelecimentos-evento-${eventoId}`;

    const load = async () => {
      setLoading(true);
      try {
        if (navigator.onLine) {
          const result =
            await TiposEventoService.getEstabelecimentosVinculados(eventoId);
          if (cancelled) {
            return;
          }
          setVincula(result.vincula_estabelecimentos);
          setEstabelecimentos(result.data);
          setVinculaEncaminhamentos(result.vincula_encaminhamentos);
          setEncaminhamentos(result.encaminhamentos);
          setVinculaObitos(result.vincula_obitos);
          setObitos(result.obitos);
          await indexedDBService.saveOpcoes(cacheKey, result);
          return;
        }

        const cached = await indexedDBService.getOpcoes<{
          vincula_estabelecimentos: boolean;
          data: EstabelecimentoEventoDTO[];
          vincula_encaminhamentos?: boolean;
          encaminhamentos?: EstabelecimentoEventoDTO[];
          vincula_obitos?: boolean;
          obitos?: EstabelecimentoEventoDTO[];
        }>(cacheKey);
        if (cancelled) {
          return;
        }
        setVincula(Boolean(cached?.vincula_estabelecimentos));
        setEstabelecimentos(Array.isArray(cached?.data) ? cached.data : []);
        setVinculaEncaminhamentos(Boolean(cached?.vincula_encaminhamentos));
        setEncaminhamentos(
          Array.isArray(cached?.encaminhamentos) ? cached.encaminhamentos : [],
        );
        setVinculaObitos(Boolean(cached?.vincula_obitos));
        setObitos(Array.isArray(cached?.obitos) ? cached.obitos : []);
      } catch {
        if (!cancelled) {
          setVincula(false);
          setVinculaEncaminhamentos(false);
          setVinculaObitos(false);
          setEstabelecimentos([]);
          setEncaminhamentos([]);
          setObitos([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventoIdValue]);

  return {
    vincula,
    vinculaEncaminhamentos,
    vinculaObitos,
    estabelecimentos,
    encaminhamentos,
    obitos,
    loading,
  };
}
