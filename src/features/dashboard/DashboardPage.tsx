// src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import EnhancedNotificationDashboard from '@/features/dashboard/NotificationDashboard';
import NotificacaoService from '@/services/NotificacaoService';
import { TiposEventoService } from '@/services/EventoService';
import indexedDBService from '@/services/indexedDB';

const DashboardPage: React.FC = () => {
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [exportOptions, setExportOptions] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        console.log("📊 Iniciando carregamento de dados para o dashboard...");

        // 🆕 PASSO 1: Buscar eventos ativos primeiro
        console.log("🔍 Buscando eventos ativos...");
        let eventosAtivos: any[] = [];
        try {
          // Tentar buscar da API primeiro
          const todosEventos = await TiposEventoService.getAll();
          eventosAtivos = todosEventos.filter((evento: any) => 
            evento.ativo === 'S' || evento.ativo === '1' || evento.ativo === true
          );
          console.log(`✅ ${eventosAtivos.length} eventos ativos encontrados`);
          
          // Salvar no IndexedDB para cache
          await indexedDBService.saveOpcoes('eventos', todosEventos);
        } catch (apiError) {
          console.warn('⚠️ Erro ao buscar eventos da API, usando cache...', apiError);
          // Fallback: buscar do IndexedDB
          const eventosCache = await indexedDBService.getOpcoes('eventos') || [];
          eventosAtivos = eventosCache.filter((evento: any) => 
            evento.ativo === 'S' || evento.ativo === '1' || evento.ativo === true
          );
        }

        // Se não há eventos ativos, ainda permite visualizar o dashboard (com dados vazios)
        let notificacoesData: any[] = [];
        
        if (eventosAtivos.length === 0) {
          console.warn('⚠️ Nenhum evento ativo encontrado. Dashboard será exibido sem dados.');
          notificacoesData = []; // Dashboard vazio
        } else {
          const idsEventosAtivos = new Set(eventosAtivos.map((e: any) => e.idtipo_evento));
          console.log(`📋 IDs dos eventos ativos: [${Array.from(idsEventosAtivos).join(', ')}]`);

          // 🆕 PASSO 2: Buscar notificações e filtrar por eventos ativos
          console.log("📥 Buscando notificações da API...");
          let allNotificacoes: any[] = [];
          let page = 1;
          const pageSize = 200; // ⚡ Aumentado de 100 para 200
          let hasMore = true;
          const maxPages = 100; // 🔒 SEGURANÇA: Limite máximo de páginas (100 * 200 = 20.000 registros)

          // ✅ CORRIGIDO: Buscar TODAS as notificações sem limite artificial de 1000
          while (hasMore && page <= maxPages) {
            console.log(`📄 Buscando página ${page}/${maxPages}...`);
            
            try {
              const response = await NotificacaoService.getAll(page, pageSize);
              
              if (response && response.data && response.data.length > 0) {
                allNotificacoes = [...allNotificacoes, ...response.data];
                console.log(`   ✅ Página ${page}: ${response.data.length} notificações | Total acumulado: ${allNotificacoes.length}/${response.meta?.total || '?'}`);
                
                // Parar quando: última página OU total de páginas atingido
                if (response.data.length < pageSize || page >= response.meta.totalPages) {
                  console.log(`🏁 Última página alcançada (${page}/${response.meta.totalPages})`);
                  hasMore = false;
                } else {
                  page++;
                }
              } else {
                console.log(`⚠️ Página ${page} retornou vazia - finalizando`);
                hasMore = false;
              }
            } catch (pageError) {
              console.error(`❌ Erro ao buscar página ${page}:`, pageError);
              console.warn(`⚠️ Parando na página ${page}. Total carregado: ${allNotificacoes.length}`);
              hasMore = false;
            }
          }
          
          if (page > maxPages) {
            console.warn(`⚠️ Limite de segurança atingido (${maxPages} páginas). Total carregado: ${allNotificacoes.length}`);
          }

          console.log(`✅ ${allNotificacoes.length} notificações baixadas da API`);

          // 🆕 PASSO 3: Filtrar notificações por eventos ativos
          console.log("🔍 Filtrando notificações por eventos ativos...");
          const notificacoesFiltradas = allNotificacoes.filter((notificacao: any) => {
            // Buscar idEvento em múltiplos caminhos
            const idEvento = notificacao.original?.tipo_evento?.idtipo_evento || 
                            notificacao.idtipo_evento || 
                            notificacao.tipo_evento?.idtipo_evento;
            
            return idEvento && idsEventosAtivos.has(idEvento);
          });

          console.log(`✅ Filtro aplicado: ${allNotificacoes.length} → ${notificacoesFiltradas.length} notificações (apenas eventos ativos)`);
          notificacoesData = notificacoesFiltradas;
        }

        // 🆕 PASSO 4: Buscar todas as opções necessárias em paralelo
        console.log("📦 Carregando opções para o dashboard...");
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

        // 🆕 PASSO 5: Montar objeto de opções para o dashboard (com eventos ativos)
        const options = {
          eventoOptions: eventosAtivos, // 🆕 USAR APENAS EVENTOS ATIVOS
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

        // Atualizar estados com os dados carregados
        setNotificacoes(notificacoesData);
        setExportOptions(options);

        console.log(`✅ Dashboard carregado: ${notificacoesData.length} notificações e ${Object.keys(options).length} categorias de opções`);
        
        // Log detalhado para debug
        console.log("📊 Contagem de opções por categoria:", {
          eventos: eventosAtivos.length, // 🆕 APENAS ATIVOS
          publicos: publicoOptions.length,
          paises: paisOptions.length,
          estados: estadoOptions.length,
          municipios: municipioOptions.length,
          racas: racaOptions.length,
          escolaridades: escolaridadeOptions.length,
          generos: generoOptions.length,
          atendimentos: atendimentoOptions.length,
          sintomas: sintomaOptions.length,
          hipoteses: hipoteseDiagOptions.length,
          traumas: traumaOptions.length,
          estabelecimentos: estabelecimentoOptions.length,
          encerramentos: encerramentoOptions.length,
          cbos: cboOptions.length,
          bairros: bairroOptions.length
        });

        // Se as opções estiverem vazias, log de aviso
        if (!eventosAtivos.length || !publicoOptions.length) {
          console.warn("⚠️ Algumas opções importantes estão vazias. Verifique as APIs.");
        }
        
        // Limpar erro se chegou até aqui
        setError(null);
      } catch (error) {
        console.error("❌ Erro ao carregar dados para o dashboard:", error);
        
        // ✅ IMPORTANTE: Não bloquear o dashboard, apenas exibir com dados vazios
        console.warn("⚠️ Exibindo dashboard vazio devido a erro no carregamento");
        
        // Garantir que o dashboard seja exibido com dados vazios
        setNotificacoes([]);
        setExportOptions({
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
        });
        
        // Não setar erro para não bloquear a UI
        // setError("Falha ao carregar dados. Por favor, tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Componente para mostrar durante o carregamento
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          {/* Spinner de carregamento simples com CSS */}
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Carregando dados para o dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">Isso pode levar alguns instantes.</p>
        </div>
      </div>
    );
  }

  // Componente para mostrar em caso de erro
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Erro</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Renderizar o dashboard com os dados carregados (mesmo se estiver vazio)
  return (
    <EnhancedNotificationDashboard 
      notificacoes={notificacoes}
      exportOptions={exportOptions}
    />
  );
};

export default DashboardPage;