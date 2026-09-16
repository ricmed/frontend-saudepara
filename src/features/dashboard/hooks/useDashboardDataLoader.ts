import { useCallback, useEffect, useRef, useState } from 'react';
import NotificacaoService from '@/services/NotificacaoService';
import { TiposEventoService } from '@/services/EventoService';
import indexedDBService from '@/services/indexedDB';
import {
  DashboardEventOption,
  getNotificationEventId,
  isDashboardEventActive
} from '../utils/eventLocalities';

type UseDashboardDataLoaderOptions = {
  maxPages?: number;
  verboseLogs?: boolean;
};

interface DashboardNotificationFilters {
  eventoId?: number;
  somenteEventosAtivos?: boolean;
}

interface DashboardPaginatedResponse {
  data: any[];
  meta?: {
    totalPages?: number;
    total?: number;
  };
}

type DashboardGetRows = (
  page: number,
  limit: number,
  filters?: DashboardNotificationFilters
) => Promise<DashboardPaginatedResponse>;

const getDashboardNotifications = NotificacaoService.getDashboardRows.bind(
  NotificacaoService
) as DashboardGetRows;

const DASHBOARD_ROW_PAGE_SIZE = 500;

const EMPTY_EXPORT_OPTIONS: Record<string, any[]> = {
  eventoOptions: [],
  publicoOptions: [],
  paisOptions: [],
  estadoOptions: [],
  municipioOptions: [],
  bairroOptions: [],
  generoOptions: [],
  racaOptions: [],
  escolaridadeOptions: [],
  atendimentoOptions: [],
  sintomaOptions: [],
  hipoteseDiagOptions: [],
  traumaOptions: [],
  estabelecimentoOptions: [],
  encerramentoOptions: [],
  cboOptions: []
};

type DashboardSupportingOptions = Omit<typeof EMPTY_EXPORT_OPTIONS, 'eventoOptions'>;

/** Cache de catálogos do dashboard na sessão (mesmo payload; evita re-download). */
let supportingOptionsSessionCache: DashboardSupportingOptions | null = null;
let supportingOptionsInFlight: Promise<DashboardSupportingOptions> | null = null;

/** Limpa o cache de catálogos (útil em testes). */
export function clearDashboardSupportingOptionsCache() {
  supportingOptionsSessionCache = null;
  supportingOptionsInFlight = null;
}

async function loadSupportingOptionsFromApi(): Promise<DashboardSupportingOptions> {
  const [
    publicoOptions,
    paisOptions,
    estadoOptions,
    municipioOptions,
    racaOptions,
    escolaridadeOptions,
    generoOptions,
    atendimentoOptions,
    sintomaOptions,
    hipoteseDiagOptions,
    traumaOptions,
    estabelecimentoOptions,
    encerramentoOptions,
    cboOptions,
    bairroOptions
  ] = await Promise.all([
    NotificacaoService.getPublicoOptions(),
    NotificacaoService.getPaisOptions(),
    NotificacaoService.getEstadoOptions(),
    NotificacaoService.getMunicipioOptions(),
    NotificacaoService.getRacaOptions(),
    NotificacaoService.getEscolaridadeOptions(),
    NotificacaoService.getGeneroOptions(),
    NotificacaoService.getAtendimentoOptions(),
    NotificacaoService.getSintomaOptions(),
    NotificacaoService.getHipoteseDiagOptions(),
    NotificacaoService.getTraumaOptions(),
    NotificacaoService.getEstabelecimentoOptions(),
    NotificacaoService.getEncerramentoOptions(),
    NotificacaoService.getCboOptions(),
    NotificacaoService.getBairroOptions()
  ]);

  return {
    publicoOptions,
    paisOptions,
    estadoOptions,
    municipioOptions,
    bairroOptions,
    generoOptions,
    racaOptions,
    escolaridadeOptions,
    atendimentoOptions,
    sintomaOptions,
    hipoteseDiagOptions,
    traumaOptions,
    estabelecimentoOptions,
    encerramentoOptions,
    cboOptions
  };
}

export const useDashboardDataLoader = (options?: UseDashboardDataLoaderOptions) => {
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [exportOptions, setExportOptions] = useState<Record<string, any[]>>(
    EMPTY_EXPORT_OPTIONS
  );
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [loadProgress, setLoadProgress] = useState<{ loaded: number; total: number } | null>(null);
  const selectedEventIdRef = useRef<number | null>(null);
  const eventOptionsRef = useRef<DashboardEventOption[]>([]);
  const requestSequenceRef = useRef(0);

  const maxPages = options?.maxPages;
  const verboseLogs = options?.verboseLogs ?? false;

  const fetchEventOptions = useCallback(async (): Promise<DashboardEventOption[]> => {
    try {
      const events = await TiposEventoService.getAll() as DashboardEventOption[];
      await indexedDBService.saveOpcoes('eventos', events);
      return events;
    } catch {
      console.warn('Não foi possível atualizar os eventos; usando o cache local.');
      const cachedEvents = await indexedDBService.getOpcoes('eventos') || [];
      return cachedEvents as DashboardEventOption[];
    }
  }, []);

  const fetchPaginatedNotifications = useCallback(async (
    eventId: number | null,
    events: DashboardEventOption[]
  ): Promise<any[]> => {
    const activeEventIds = new Set(
      events
        .filter(isDashboardEventActive)
        .map((event) => event.idtipo_evento)
    );

    if (eventId === null && activeEventIds.size === 0) {
      return [];
    }

    const filters: DashboardNotificationFilters = eventId === null
      ? { somenteEventosAtivos: true }
      : { eventoId: eventId };
    const pageSize = DASHBOARD_ROW_PAGE_SIZE;
    const notifications: any[] = [];
    let page = 1;
    let hasMore = true;

    setLoadProgress(null);

    while (hasMore && (!maxPages || page <= maxPages)) {
      if (verboseLogs) {
        console.log(`Carregando página ${page} do dashboard.`);
      }

      const response = await getDashboardNotifications(page, pageSize, filters);
      const pageData = Array.isArray(response?.data) ? response.data : [];
      const requestedData = pageData.filter((notification) => {
        const notificationEventId = getNotificationEventId(notification);
        return eventId === null
          ? notificationEventId !== null && activeEventIds.has(notificationEventId)
          : notificationEventId === eventId;
      });

      notifications.push(...requestedData);

      const total = Number(response?.meta?.total);
      if (Number.isFinite(total) && total > 0) {
        setLoadProgress({
          loaded: Math.min(notifications.length, total),
          total,
        });
      }

      const totalPages = Number(response?.meta?.totalPages);
      hasMore =
        pageData.length === pageSize &&
        (!Number.isFinite(totalPages) || page < totalPages);
      page += 1;
    }

    if (verboseLogs && maxPages && hasMore) {
      console.warn(`Carregamento limitado a ${maxPages} páginas.`);
    }

    return notifications;
  }, [maxPages, verboseLogs]);

  const fetchSupportingOptions = useCallback(async (): Promise<DashboardSupportingOptions> => {
    if (supportingOptionsSessionCache) {
      return supportingOptionsSessionCache;
    }

    if (!supportingOptionsInFlight) {
      supportingOptionsInFlight = loadSupportingOptionsFromApi()
        .then((options) => {
          supportingOptionsSessionCache = options;
          return options;
        })
        .finally(() => {
          supportingOptionsInFlight = null;
        });
    }

    return supportingOptionsInFlight;
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setDataError(null);

      const events = await fetchEventOptions();
      eventOptionsRef.current = events;

      // Com um único evento ativo, já deixa o filtro escolhido (não "Todos").
      const activeEvents = events.filter(isDashboardEventActive);
      const initialEventId =
        activeEvents.length === 1 ? Number(activeEvents[0].idtipo_evento) : null;
      const resolvedInitialEventId =
        initialEventId !== null &&
        Number.isInteger(initialEventId) &&
        initialEventId > 0
          ? initialEventId
          : null;

      selectedEventIdRef.current = resolvedInitialEventId;
      setSelectedEventId(resolvedInitialEventId);

      const [
        notifications,
        supportingOptions
      ] = await Promise.all([
        fetchPaginatedNotifications(resolvedInitialEventId, events),
        fetchSupportingOptions()
      ]);

      setNotificacoes(notifications);
      setExportOptions({
        eventoOptions: events,
        ...supportingOptions
      });
    } catch {
      setNotificacoes([]);
      setExportOptions(EMPTY_EXPORT_OPTIONS);
      setError('Não foi possível carregar os dados do dashboard.');
    } finally {
      setLoading(false);
    }
  }, [
    fetchEventOptions,
    fetchPaginatedNotifications,
    fetchSupportingOptions
  ]);

  const loadNotificationsForEvent = useCallback(async (
    requestedEventId: number | null
  ): Promise<any[]> => {
    const eventId =
      requestedEventId !== null &&
      Number.isInteger(requestedEventId) &&
      requestedEventId > 0
        ? requestedEventId
        : null;
    const requestSequence = ++requestSequenceRef.current;

    selectedEventIdRef.current = eventId;
    setSelectedEventId(eventId);
    setDataLoading(true);
    setDataError(null);

    try {
      const notifications = await fetchPaginatedNotifications(
        eventId,
        eventOptionsRef.current
      );

      if (requestSequence === requestSequenceRef.current) {
        setNotificacoes(notifications);
      }

      return notifications;
    } catch {
      if (requestSequence === requestSequenceRef.current) {
        setNotificacoes([]);
        setDataError('Não foi possível carregar as notificações selecionadas.');
      }
      return [];
    } finally {
      if (requestSequence === requestSequenceRef.current) {
        setDataLoading(false);
      }
    }
  }, [fetchPaginatedNotifications]);

  const reloadNotifications = useCallback(
    () => loadNotificationsForEvent(selectedEventIdRef.current),
    [loadNotificationsForEvent]
  );

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  return {
    notificacoes,
    exportOptions,
    loading,
    dataLoading,
    error,
    dataError,
    selectedEventId,
    loadProgress,
    setNotificacoes,
    loadNotificationsForEvent,
    reloadNotifications,
    reloadDashboardData: loadDashboardData
  };
};
