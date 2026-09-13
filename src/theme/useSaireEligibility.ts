import { useEffect, useMemo, useState } from 'react';
import { TiposEventoService } from '@/services/EventoService';
import indexedDBService from '@/services/indexedDB';
import {
  isActiveEventFlag,
  SAIRE_EVENT_NAME_RE,
  SAIRE_NOTIFICADORAS_CACHE_KEY_PREFIX,
} from '@/theme/palette';

export type SaireEligibilityState = {
  loading: boolean;
  /** Unidade do usuário está entre as notificadoras do Sairé ativo. */
  isSaireNotificadora: boolean;
  /** Existe evento Sairé ativo. */
  hasActiveSaireEvent: boolean;
  saireEventId: number | null;
};

/**
 * Elegibilidade Sairé (evento ativo + unidade notificadora).
 * Compartilhado entre CTA da home e resolução de paleta.
 */
export function useSaireEligibility(params: {
  estabelecimentoId: number | null | undefined;
  permissionsLoading: boolean;
}): SaireEligibilityState {
  const { estabelecimentoId, permissionsLoading } = params;
  const [loading, setLoading] = useState(true);
  const [isSaireNotificadora, setIsSaireNotificadora] = useState(false);
  const [hasActiveSaireEvent, setHasActiveSaireEvent] = useState(false);
  const [saireEventId, setSaireEventId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (permissionsLoading) {
        return;
      }

      setLoading(true);
      try {
        let events = await TiposEventoService.getAllAtivos().catch(() => [] as Awaited<
          ReturnType<typeof TiposEventoService.getAllAtivos>
        >);
        if (!Array.isArray(events) || events.length === 0) {
          events = await TiposEventoService.getAll().catch(() => []);
        }

        const saireEvents = (events || []).filter(
          (event) =>
            isActiveEventFlag(event.ativo) &&
            SAIRE_EVENT_NAME_RE.test(String(event.descricao || '')),
        );

        if (saireEvents.length === 0) {
          if (!cancelled) {
            setIsSaireNotificadora(false);
            setHasActiveSaireEvent(false);
            setSaireEventId(null);
          }
          return;
        }

        const saireEvent = [...saireEvents].sort(
          (a, b) => Number(b.idtipo_evento) - Number(a.idtipo_evento),
        )[0];
        const eventId = Number(saireEvent.idtipo_evento);

        if (!cancelled) {
          setHasActiveSaireEvent(true);
          setSaireEventId(eventId);
        }

        const userUnitId = Number(estabelecimentoId);
        if (!Number.isInteger(userUnitId) || userUnitId <= 0) {
          if (!cancelled) {
            setIsSaireNotificadora(false);
          }
          return;
        }

        const cacheKey = `${SAIRE_NOTIFICADORAS_CACHE_KEY_PREFIX}${eventId}`;
        let notificadoraIds: number[] = [];

        if (navigator.onLine) {
          const linked = await TiposEventoService.getEstabelecimentosVinculados(eventId);
          notificadoraIds = (linked.data || [])
            .map((item) => Number(item.idestabelecimento))
            .filter((id) => Number.isInteger(id) && id > 0);
          await indexedDBService.saveOpcoes(cacheKey, notificadoraIds);
        } else {
          const cached = await indexedDBService.getOpcoes<number[]>(cacheKey);
          notificadoraIds = Array.isArray(cached) ? cached : [];
        }

        if (!cancelled) {
          setIsSaireNotificadora(notificadoraIds.includes(userUnitId));
        }
      } catch {
        if (!cancelled) {
          setIsSaireNotificadora(false);
          setHasActiveSaireEvent(false);
          setSaireEventId(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [estabelecimentoId, permissionsLoading]);

  return useMemo(
    () => ({
      loading: loading || permissionsLoading,
      isSaireNotificadora,
      hasActiveSaireEvent,
      saireEventId,
    }),
    [hasActiveSaireEvent, isSaireNotificadora, loading, permissionsLoading, saireEventId],
  );
}
