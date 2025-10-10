// src/pages/DashboardPageCirio.tsx - Dashboard do Círio de Nazaré com Modo TV
import React, { useState, useEffect } from 'react';
import EnhancedNotificationDashboard from '@/features/dashboard/NotificationDashboardCirio';
import TVSlideshowDashboard from '@/components/common/TVSlideshowDashboard';
import NotificacaoService from '@/services/NotificacaoService';
import { Monitor, Grid } from 'lucide-react';

const DashboardPageCirio: React.FC = () => {
  const [modoTV, setModoTV] = useState(false);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [exportOptions, setExportOptions] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        console.log("Iniciando carregamento de dados para o dashboard...");

        // Buscar todas as notificações com um limite maior para o dashboard (ajuste conforme necessário)
        const response = await NotificacaoService.getAll(1, 1000);
        const notificacoesData = response.data || [];

        // Buscar todas as opções necessárias em paralelo
        const [
          eventoOptions,
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
          NotificacaoService.getEventoOptions(),
          NotificacaoService.getPublicoOptions(),
          NotificacaoService.getPaisOptions(),
          NotificacaoService.getEstadoOptions(),
          NotificacaoService.getMunicipioOptions(), // 🆕 CORRIGIDO: Carregar municípios
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

        // Montar objeto de opções para o dashboard
        const options = {
          eventoOptions,
          publicoOptions,
          paisOptions,
          estadoOptions,
          municipioOptions, // 🆕 CORRIGIDO: Usar a variável carregada
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

        console.log(`Dashboard: Carregados ${notificacoesData.length} registros e ${Object.keys(options).length} categorias de opções`);
        
        // Log detalhado para debug
        console.log("Contagem de opções por categoria:", {
          eventos: eventoOptions.length,
          publicos: publicoOptions.length,
          paises: paisOptions.length,
          estados: estadoOptions.length,
          municipios: municipioOptions.length, // 🆕 ADICIONADO: Log de municípios
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
        if (!eventoOptions.length || !publicoOptions.length) {
          console.warn("Algumas opções importantes estão vazias. Verifique as APIs.");
        }
      } catch (error) {
        console.error("Erro ao carregar dados para o dashboard:", error);
        setError("Falha ao carregar dados. Por favor, tente novamente mais tarde.");
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

  // Verificação se os dados mínimos foram carregados
  const hasSufficientData = notificacoes.length > 0 && Object.keys(exportOptions).length > 0;
  
  // Se não houver notificações, mostrar mensagem apropriada
  if (!hasSufficientData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-xl font-semibold text-yellow-600 mb-4">Sem dados disponíveis</h2>
          <p className="text-gray-700 mb-4">
            Não foram encontradas notificações para exibição no dashboard. 
            Cadastre notificações para visualizar estatísticas.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Atualizar
            </button>
            <button
              onClick={() => window.location.href = '/notificacoes/criar'}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Criar notificação
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar o dashboard com os dados carregados
  return (
    <>
      {/* Toggle para Modo TV - Fixo no Topo */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setModoTV(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all ${
            !modoTV 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Modo Normal"
        >
          <Grid className="h-5 w-5" />
          <span className="hidden sm:inline">Normal</span>
        </button>
        <button
          onClick={() => setModoTV(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all ${
            modoTV 
              ? 'bg-red-600 text-white animate-pulse' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Modo TV - Slideshow Automático"
        >
          <Monitor className="h-5 w-5" />
          <span className="hidden sm:inline">Modo TV</span>
        </button>
      </div>

      {/* Renderização Condicional */}
      {modoTV ? (
        <TVSlideshowDashboard
          slides={[
            // Slide único: Dashboard Completo com rolagem automática
            <div key="slide-1" className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
              <div className="max-w-[1920px] mx-auto">
                <EnhancedNotificationDashboard 
                  notificacoes={notificacoes}
                  exportOptions={exportOptions}
                />
              </div>
            </div>,
          ]}
          autoPlayInterval={25}
          enableAutoScroll={true}
          scrollSpeed={80}
        />
      ) : (
        <EnhancedNotificationDashboard 
          notificacoes={notificacoes}
          exportOptions={exportOptions}
        />
      )}
    </>
  );
};

export default DashboardPageCirio;