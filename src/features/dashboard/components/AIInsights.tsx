// Componente de Insights Automáticos com IA
import React, { useState, useCallback } from 'react';
import { 
  Brain, 
  Zap, 
  Loader, 
  AlertTriangle, 
  TrendingUp, 
  Users,
  Activity,
  RefreshCw
} from 'lucide-react';

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

interface AIInsightsProps {
  dashboardData: DashboardData;
  className?: string;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ 
  dashboardData,
  className = ""
}) => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const generateInsights = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Preparar contexto dos dados
      const context = `
DADOS DO DASHBOARD DE SAÚDE PÚBLICA:

📊 RESUMO GERAL:
- Total de notificações: ${dashboardData.totalNotifications}

🔥 PRINCIPAIS SINTOMAS:
${dashboardData.topSymptoms.slice(0, 5).map(s => `- ${s.name}: ${s.value} casos`).join('\n')}

⚠️ HIPÓTESES CRÍTICAS:
${dashboardData.criticalHypothesis.slice(0, 3).map(h => `- ${h.name}: ${h.value} casos`).join('\n')}

🏥 TRAUMAS MAIS FREQUENTES:
${dashboardData.topTraumas.slice(0, 3).map(t => `- ${t.name}: ${t.value} casos`).join('\n')}

👥 DADOS DEMOGRÁFICOS:
Gênero: ${dashboardData.demographics.gender.map(g => `${g.name}: ${g.value}`).join(', ')}

🎯 FILTROS ATIVOS: ${Object.entries(dashboardData.activeFilters).filter(([,v]) => v !== null).map(([k,v]) => `${k}: ${v}`).join(', ') || 'Nenhum'}
      `;

      const prompt = `${context}

Você é um epidemiologista especialista em vigilância em saúde pública. Analise estes dados de notificações de saúde e forneça insights importantes em português brasileiro.

FOQUE EM:
1. 🚨 ALERTAS EPIDEMIOLÓGICOS: Identifique padrões preocupantes que requerem atenção imediata
2. 📈 TENDÊNCIAS: Analise distribuições e concentrações de casos
3. 🎯 RECOMENDAÇÕES: Sugira ações específicas para vigilância e controle
4. 💡 INSIGHTS INTELIGENTES: Correlações entre sintomas, demografias e hipóteses

Seja CONCISO, PRÁTICO e focado em AÇÕES. Use emojis para destacar pontos importantes.`;

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.1',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9,
            max_tokens: 1000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.response) {
        setInsights(result.response);
      } else {
        throw new Error('Resposta vazia da IA');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao gerar insights: ${errorMessage}`);
      console.error('Erro na IA:', err);
    } finally {
      setLoading(false);
    }
  }, [dashboardData]);

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-800">
              Análise Inteligente
            </h3>
            <p className="text-sm text-purple-600">
              Insights automáticos com Llama 3.1
            </p>
          </div>
        </div>
        
        <button
          onClick={generateInsights}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Gerar Insights
            </>
          )}
        </button>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-600">Total de Casos</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {dashboardData.totalNotifications.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-gray-600">Sintomas Únicos</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {dashboardData.topSymptoms.length}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-gray-600">Casos Críticos</span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {dashboardData.criticalHypothesis.reduce((acc, h) => acc + h.value, 0)}
          </p>
        </div>
      </div>

      {/* Área de insights */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Erro</span>
          </div>
          <p className="text-red-600 mt-1 text-sm">{error}</p>
          <button
            onClick={generateInsights}
            className="mt-3 flex items-center gap-2 text-red-600 hover:text-red-800 text-sm"
          >
            <RefreshCw className="h-3 w-3" />
            Tentar novamente
          </button>
        </div>
      )}

      {insights && (
        <div className="bg-white rounded-lg border border-purple-200 overflow-hidden">
          <div className="bg-purple-100 px-4 py-3 border-b border-purple-200">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-800">Insights da IA</span>
            </div>
          </div>
          <div className="p-4">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {insights}
              </div>
            </div>
          </div>
        </div>
      )}

      {!insights && !loading && !error && (
        <div className="bg-white rounded-lg border border-dashed border-purple-300 p-8 text-center">
          <Brain className="h-12 w-12 text-purple-400 mx-auto mb-3" />
          <h4 className="font-medium text-purple-800 mb-2">
            Pronto para análise inteligente
          </h4>
          <p className="text-purple-600 text-sm mb-4">
            Clique em "Gerar Insights" para que a IA analise os dados do dashboard
            e forneça recomendações epidemiológicas automatizadas.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-purple-500">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Detecção de padrões
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Alertas automáticos
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Análise demográfica
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
