// Componente de Alertas Inteligentes com IA
import React, { useState, useCallback, useEffect } from 'react';
import { 
  AlertTriangle, 
  Bell, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Users,
  Zap,
  RefreshCw,
  Clock,
  MapPin,
  Loader,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation: string;
  timestamp: Date;
  metrics?: {
    current: number;
    previous: number;
    change: number;
  };
  location?: string;
  isRead: boolean;
}

interface AIConfig {
  mode: 'localhost' | 'api';
  apiKey?: string;
  endpoint?: string;
}

interface DashboardData {
  totalNotifications: number;
  topSymptoms: Array<{ name: string; value: number }>;
  criticalHypothesis: Array<{ name: string; value: number }>;
  topTraumas: Array<{ name: string; value: number }>;
  demographics: {
    gender: Array<{ name: string; value: number }>;
    age: Array<{ name: string; value: number }>;
  };
  activeFilters: any;
}

interface AIAlertsProps {
  dashboardData: DashboardData;
  className?: string;
}

export const AIAlerts: React.FC<AIAlertsProps> = ({ 
  dashboardData,
  className = ""
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Configuração da IA - carrega das configurações globais primeiro
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const globalSaved = localStorage.getItem('aiGlobalConfig');
    if (globalSaved) {
      return JSON.parse(globalSaved);
    }
    const localSaved = localStorage.getItem('aiChatConfig');
    return localSaved ? JSON.parse(localSaved) : { mode: 'localhost' };
  });

  // Sincronizar com configurações globais
  useEffect(() => {
    const handleStorageChange = () => {
      const globalSaved = localStorage.getItem('aiGlobalConfig');
      if (globalSaved) {
        const config = JSON.parse(globalSaved);
        setAiConfig(config);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Verificar se há configuração global no carregamento
    const globalSaved = localStorage.getItem('aiGlobalConfig');
    if (globalSaved) {
      const config = JSON.parse(globalSaved);
      setAiConfig(config);
    }

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const generateAlerts = useCallback(async () => {
    setLoading(true);
    
    try {
      // Preparar contexto dos dados para análise de alertas
      const context = `
ANÁLISE DE ALERTAS EPIDEMIOLÓGICOS:

📊 DADOS PARA MONITORAMENTO:
- Total de notificações: ${dashboardData.totalNotifications}
- Sintomas mais frequentes: ${dashboardData.topSymptoms.slice(0, 5).map(s => `${s.name}: ${s.value}`).join(', ')}
- Hipóteses críticas: ${dashboardData.criticalHypothesis.slice(0, 3).map(h => `${h.name}: ${h.value}`).join(', ')}
- Traumas: ${dashboardData.topTraumas.slice(0, 3).map(t => `${t.name}: ${t.value}`).join(', ')}
- Demografia: ${dashboardData.demographics.gender.map(g => `${g.name}: ${g.value}`).join(', ')}

🎯 FILTROS ATIVOS: ${Object.entries(dashboardData.activeFilters).filter(([,v]) => v !== null).map(([k,v]) => `${k}: ${v}`).join(', ') || 'Todos os dados'}
      `;

      const prompt = `${context}

Você é um sistema de alerta epidemiológico inteligente. Analise os dados e gere alertas estruturados em JSON.

TIPOS DE ALERTAS:
- CRITICAL: Situações que requerem ação imediata (surtos, casos críticos concentrados)
- WARNING: Padrões preocupantes que precisam monitoramento
- INFO: Insights úteis para tomada de decisão

FORMATE COMO JSON ARRAY com esta estrutura:
[
  {
    "type": "critical|warning|info",
    "title": "Título curto e direto",
    "description": "Descrição detalhada do padrão identificado",
    "recommendation": "Ação específica recomendada",
    "metrics": {
      "current": número_atual,
      "previous": número_anterior_estimado,
      "change": porcentagem_mudança
    },
    "location": "local_relevante_se_aplicável"
  }
]

Gere 3-5 alertas baseados nos dados fornecidos. Seja específico e prático.

JSON:`;

      let response;
      
      if (aiConfig.mode === 'localhost') {
        // Chamada para Ollama local
        response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.1',
            prompt: prompt,
            stream: false,
            options: {
              temperature: 0.2,
              top_p: 0.8,
              max_tokens: 1200
            }
          })
        });
      } else {
        // Chamada para API externa (reutiliza configuração do chat)
        if (!aiConfig.apiKey) {
          throw new Error('Chave de API não configurada. Configure no Chat com IA primeiro.');
        }
        
        const endpoint = aiConfig.endpoint || 'https://openrouter.ai/api/v1/chat/completions';
        let model = 'meta-llama/llama-4-maverick:free';
        
        if (endpoint.includes('groq.com')) {
          model = 'llama3-8b-8192';
        } else if (endpoint.includes('together')) {
          model = 'meta-llama/Llama-3-8b-chat-hf';
        }
        
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'SaudePara AI Alerts'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: 'Você é um especialista em epidemiologia e vigilância em saúde pública. Retorne sempre um JSON válido.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.2,
            top_p: 0.8,
            max_tokens: 1200
          })
        });
      }

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();
      
      // Tentar extrair JSON da resposta
      let alertsData = [];
      let rawResponse = '';
      
      if (aiConfig.mode === 'localhost') {
        rawResponse = result.response;
      } else {
        rawResponse = result.choices?.[0]?.message?.content || '';
      }
      
      try {
        const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          alertsData = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: criar alertas básicos se não conseguir parsear
          alertsData = [
            {
              type: 'info',
              title: 'Análise Disponível',
              description: `Dados processados: ${dashboardData.totalNotifications} notificações`,
              recommendation: 'Continue monitorando os padrões epidemiológicos',
              metrics: { current: dashboardData.totalNotifications, previous: 0, change: 0 }
            }
          ];
        }
      } catch (parseError) {
        console.error('Erro ao fazer parse do JSON:', parseError);
        alertsData = [
          {
            type: 'warning',
            title: 'Sistema de Alertas Ativo',
            description: 'O sistema está monitorando os dados, mas houve dificuldade na análise automática.',
            recommendation: 'Revise manualmente os dados do dashboard para identificar padrões',
            metrics: { current: dashboardData.totalNotifications, previous: 0, change: 0 }
          }
        ];
      }

      // Converter para objetos Alert com IDs e timestamps
      const newAlerts: Alert[] = alertsData.map((alert: any, index: number) => ({
        id: `alert-${Date.now()}-${index}`,
        type: alert.type || 'info',
        title: alert.title || 'Alerta sem título',
        description: alert.description || 'Descrição não disponível',
        recommendation: alert.recommendation || 'Recomendação não fornecida',
        metrics: alert.metrics,
        location: alert.location,
        timestamp: new Date(),
        isRead: false
      }));

      setAlerts(newAlerts);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Erro ao gerar alertas:', err);
      
      // Alertas de fallback em caso de erro
      const fallbackAlerts: Alert[] = [
        {
          id: 'error-alert',
          type: 'warning',
          title: 'Erro no Sistema de Alertas',
          description: `Não foi possível conectar com a IA. Verifique se o Ollama está rodando.`,
          recommendation: 'Reinicie o Ollama e tente novamente. Monitore os dados manualmente.',
          timestamp: new Date(),
          isRead: false
        }
      ];
      
      setAlerts(fallbackAlerts);
    } finally {
      setLoading(false);
    }
  }, [dashboardData]);

  const markAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Auto-refresh
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        generateAlerts();
      }, 5 * 60 * 1000); // 5 minutos
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, generateAlerts]);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Activity className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg relative">
            <Bell className="h-5 w-5 text-orange-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-orange-800">Alertas Inteligentes</h3>
            <p className="text-sm text-orange-600">
              Monitoramento automático com IA
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={autoRefresh ? 'Auto-refresh ativo' : 'Ativar auto-refresh'}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={generateAlerts}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Gerar Alertas
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status */}
      {lastUpdate && (
        <div className="px-4 py-2 bg-gray-50 border-b text-sm text-gray-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>Última atualização: {lastUpdate.toLocaleTimeString()}</span>
          </div>
          
          {alerts.length > 0 && (
            <button
              onClick={clearAlerts}
              className="text-gray-500 hover:text-red-600 transition-colors"
            >
              Limpar todos
            </button>
          )}
        </div>
      )}

      {/* Alerts */}
      <div className="max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h4 className="font-medium text-gray-800 mb-2">
              Sistema de Alertas Pronto
            </h4>
            <p className="text-gray-600 text-sm mb-4">
              Clique em "Gerar Alertas" para que a IA analise os dados
              e identifique padrões que requerem atenção.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-400" />
                Detecção de surtos
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-yellow-400" />
                Monitoramento contínuo
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 text-blue-400" />
                Análise populacional
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getAlertColor(alert.type)} ${
                  !alert.isRead ? 'shadow-sm' : 'opacity-75'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {alert.title}
                      </h4>
                      
                      <div className="flex items-center gap-1">
                        {alert.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {alert.location}
                          </span>
                        )}
                        
                        {!alert.isRead && (
                          <button
                            onClick={() => markAsRead(alert.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Marcar como lido"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 text-sm mt-1 mb-2">
                      {alert.description}
                    </p>
                    
                    {alert.metrics && (
                      <div className="flex items-center gap-4 mb-2 text-xs">
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Atual: {alert.metrics.current}
                        </span>
                        {alert.metrics.change !== 0 && (
                          <span className={`flex items-center gap-1 ${
                            alert.metrics.change > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {alert.metrics.change > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {Math.abs(alert.metrics.change)}%
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="bg-white bg-opacity-70 rounded p-2 border border-gray-200">
                      <p className="text-xs text-gray-700">
                        <strong>Recomendação:</strong> {alert.recommendation}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {alert.timestamp.toLocaleString()}
                      </span>
                      
                      {alert.isRead ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Lido
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-orange-600">
                          <Bell className="h-3 w-3" />
                          Novo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAlerts;
