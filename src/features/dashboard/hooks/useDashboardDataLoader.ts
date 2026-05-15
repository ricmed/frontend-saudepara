import { useCallback, useEffect, useState } from 'react';
import NotificacaoService from '@/services/NotificacaoService';
import { TiposEventoService } from '@/services/EventoService';
import indexedDBService from '@/services/indexedDB';

type UseDashboardDataLoaderOptions = {
  maxPages?: number;
  verboseLogs?: boolean;
};

const EMPTY_EXPORT_OPTIONS = {
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

export const useDashboardDataLoader = (options?: UseDashboardDataLoaderOptions) => {
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [exportOptions, setExportOptions] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const maxPages = options?.maxPages;
  const verboseLogs = options?.verboseLogs ?? false;

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      if (verboseLogs) {
        console.log('📊 Iniciando carregamento de dados para o dashboard...');
      }

      let eventosAtivos: any[] = [];
      try {
        const todosEventos = await TiposEventoService.getAll();
        eventosAtivos = todosEventos.filter((evento: any) =>
          evento.ativo === 'S' || evento.ativo === '1' || evento.ativo === true
        );
        await indexedDBService.saveOpcoes('eventos', todosEventos);
      } catch (apiError) {
        console.warn('⚠️ Erro ao buscar eventos da API, usando cache...', apiError);
        const eventosCache = await indexedDBService.getOpcoes('eventos') || [];
        eventosAtivos = eventosCache.filter((evento: any) =>
          evento.ativo === 'S' || evento.ativo === '1' || evento.ativo === true
        );
      }

      let notificacoesData: any[] = [];

      if (eventosAtivos.length === 0) {
        console.warn('⚠️ Nenhum evento ativo encontrado. Dashboard será exibido sem dados.');
      } else {
        const idsEventosAtivos = new Set(eventosAtivos.map((e: any) => e.idtipo_evento));
        let allNotificacoes: any[] = [];
        let page = 1;
        const pageSize = 200;
        let hasMore = true;

        while (hasMore && (!maxPages || page <= maxPages)) {
          if (verboseLogs) {
            console.log(`📄 Buscando página ${page}${maxPages ? `/${maxPages}` : ''}...`);
          }

          try {
            const response = await NotificacaoService.getAll(page, pageSize);
            if (response && response.data && response.data.length > 0) {
              allNotificacoes = [...allNotificacoes, ...response.data];
              if (response.data.length < pageSize || page >= response.meta.totalPages) {
                hasMore = false;
              } else {
                page++;
              }
            } else {
              hasMore = false;
            }
          } catch (pageError) {
            console.error(`❌ Erro ao buscar página ${page}:`, pageError);
            hasMore = false;
          }
        }

        if (maxPages && page > maxPages) {
          console.warn(`⚠️ Limite de segurança atingido (${maxPages} páginas). Total carregado: ${allNotificacoes.length}`);
        }

        notificacoesData = allNotificacoes.filter((notificacao: any) => {
          const idEvento = notificacao.original?.tipo_evento?.idtipo_evento ||
            notificacao.idtipo_evento ||
            notificacao.tipo_evento?.idtipo_evento;

          return idEvento && idsEventosAtivos.has(idEvento);
        });
      }

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

      setNotificacoes(notificacoesData);
      setExportOptions({
        eventoOptions: eventosAtivos,
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
      });
      setError(null);
    } catch (loadError) {
      console.error('❌ Erro ao carregar dados para o dashboard:', loadError);
      setNotificacoes([]);
      setExportOptions(EMPTY_EXPORT_OPTIONS);
    } finally {
      setLoading(false);
    }
  }, [maxPages, verboseLogs]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    notificacoes,
    exportOptions,
    loading,
    error,
    setNotificacoes,
    reloadDashboardData: loadDashboardData
  };
};
