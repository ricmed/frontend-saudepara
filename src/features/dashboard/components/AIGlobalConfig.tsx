// Componente de Configuração Global da IA
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Server, 
  Cloud, 
  Eye, 
  EyeOff, 
  Check,
  AlertCircle,
  Brain,
  ChevronDown,
  ChevronUp,
  TestTube,
  Info,
  Search
} from 'lucide-react';
import { STORAGE_KEYS, readStringWithLegacy } from '@/utils/storageKeys';

export interface AIConfig {
  mode: 'localhost' | 'api';
  apiKey?: string;
  endpoint?: string;
  model?: string;
}

interface AIGlobalConfigProps {
  onConfigChange?: (config: AIConfig) => void;
  className?: string;
}

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  top_provider?: {
    max_completion_tokens?: number;
  };
}

// Lista de modelos populares do OpenRouter
const AI_MODELS = [
  // Modelos gratuitos mais populares
  {
    id: 'meta-llama/llama-4-maverick:free',
    name: 'Llama 4 Maverick (Free)',
    provider: 'Meta',
    description: 'Modelo multimodal avançado da Meta, gratuito',
    category: 'free',
    contextLength: 128000
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1 (Free)',
    provider: 'DeepSeek',
    description: 'Modelo de raciocínio avançado, gratuito',
    category: 'free',
    contextLength: 163840
  },
  {
    id: 'qwen/qwen3-30b-a3b:free',
    name: 'Qwen3 30B (Free)',
    provider: 'Qwen',
    description: 'Modelo multilíngue avançado, gratuito',
    category: 'free',
    contextLength: 32768
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B (Free)',
    provider: 'Google',
    description: 'Modelo multimodal do Google, gratuito',
    category: 'free',
    contextLength: 128000
  },
  
  // Modelos pagos populares
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Modelo mais avançado da OpenAI',
    category: 'paid',
    contextLength: 128000
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Modelo avançado da Anthropic',
    category: 'paid',
    contextLength: 200000
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    description: 'Modelo mais avançado do Google',
    category: 'paid',
    contextLength: 1048576
  },
  {
    id: 'x-ai/grok-3',
    name: 'Grok 3',
    provider: 'xAI',
    description: 'Modelo flagship da xAI',
    category: 'paid',
    contextLength: 131072
  },
  {
    id: 'mistralai/mistral-large-2407',
    name: 'Mistral Large 2407',
    provider: 'Mistral',
    description: 'Modelo flagship da Mistral',
    category: 'paid',
    contextLength: 128000
  },
  {
    id: 'meta-llama/llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B Instruct',
    provider: 'Meta',
    description: 'Modelo mais potente da Meta',
    category: 'paid',
    contextLength: 32768
  }
];

// Lista de servidores API populares
const API_ENDPOINTS = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    description: 'Roteador inteligente de modelos com acesso a dezenas de IAs',
    features: ['Ampla variedade de modelos', 'Roteamento automático', 'Modelos gratuitos disponíveis']
  },
  {
    id: 'openai',
    name: 'OpenAI',
    url: 'https://api.openai.com/v1/chat/completions',
    description: 'API oficial da OpenAI (GPT-4, GPT-3.5, etc)',
    features: ['Modelos oficiais OpenAI', 'Alta qualidade', 'Suporte robusto']
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    url: 'https://api.anthropic.com/v1/messages',
    description: 'API oficial da Anthropic (Claude)',
    features: ['Modelos Claude', 'Excelente para análise', 'Segurança avançada']
  },
  {
    id: 'groq',
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    description: 'Processamento ultrarrápido de modelos de código aberto',
    features: ['Velocidade extrema', 'Modelos open-source', 'Baixa latência']
  },
  {
    id: 'together',
    name: 'Together AI',
    url: 'https://api.together.xyz/v1/chat/completions',
    description: 'Plataforma para modelos de código aberto',
    features: ['Modelos open-source', 'Boa variedade', 'Preços competitivos']
  }
];

export const AIGlobalConfig: React.FC<AIGlobalConfigProps> = ({ 
  onConfigChange,
  className = ""
}) => {
  const LEGACY_AI_GLOBAL_CONFIG_KEY = 'aiGlobalConfig';
  const LEGACY_AI_CHAT_CONFIG_KEY = 'aiChatConfig';
  const [isOpen, setIsOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showModelList, setShowModelList] = useState(false);
  const [modelFilter, setModelFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Configuração da IA - carrega do localStorage
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = readStringWithLegacy(
      STORAGE_KEYS.ai.globalConfig,
      [LEGACY_AI_GLOBAL_CONFIG_KEY, LEGACY_AI_CHAT_CONFIG_KEY]
    );
    return saved ? JSON.parse(saved) : { 
      mode: 'localhost',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'meta-llama/llama-4-maverick:free'
    };
  });

  // Função para buscar modelos disponíveis do OpenRouter
  const fetchAvailableModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      // Headers básicos - API key opcional para listar modelos
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Adicionar Authorization se houver API key
      if (aiConfig.apiKey) {
        headers['Authorization'] = `Bearer ${aiConfig.apiKey}`;
      }

      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data.data || []);
        console.log(`✅ Carregados ${data.data?.length || 0} modelos do OpenRouter`);
      } else {
        console.warn('Não foi possível carregar modelos do OpenRouter');
        // Usar modelos padrão como fallback
        setAvailableModels([]);
      }
    } catch (error) {
      console.warn('Erro ao buscar modelos:', error);
      setAvailableModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, [aiConfig.apiKey]);

  // Salvar configuração no localStorage e notificar mudanças
  const saveConfig = useCallback((config: AIConfig) => {
    setAiConfig(config);
    localStorage.setItem(STORAGE_KEYS.ai.globalConfig, JSON.stringify(config));
    localStorage.setItem(STORAGE_KEYS.ai.chatConfig, JSON.stringify(config));
    onConfigChange?.(config);
  }, [onConfigChange]);

  // Sincronizar com localStorage quando componente carrega
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = readStringWithLegacy(
        STORAGE_KEYS.ai.globalConfig,
        [LEGACY_AI_GLOBAL_CONFIG_KEY, LEGACY_AI_CHAT_CONFIG_KEY]
      );
      if (saved) {
        const config = JSON.parse(saved);
        setAiConfig(config);
        onConfigChange?.(config);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [onConfigChange]);

  // Buscar modelos disponíveis quando necessário
  useEffect(() => {
    // Sempre buscar modelos se estivermos em modo API com OpenRouter
    if (aiConfig.mode === 'api' && aiConfig.endpoint?.includes('openrouter')) {
      fetchAvailableModels();
    }
  }, [aiConfig.mode, aiConfig.endpoint, fetchAvailableModels]);

  // Buscar modelos também quando a página carrega pela primeira vez
  useEffect(() => {
    // Buscar modelos automaticamente na inicialização se estivermos em modo API
    if (aiConfig.mode === 'api' && aiConfig.endpoint?.includes('openrouter')) {
      fetchAvailableModels();
    }
  }, []); // Executa apenas uma vez na inicialização

  // Função para testar conexão da API
  const testConnection = useCallback(async () => {
    if (aiConfig.mode === 'localhost') {
      setTestingConnection(true);
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (response.ok) {
          alert('✅ Ollama conectado com sucesso!');
        } else {
          alert('❌ Ollama não está respondendo. Verifique se está rodando em localhost:11434');
        }
      } catch (error) {
        alert('❌ Não foi possível conectar ao Ollama. Verifique se está instalado e rodando.');
      } finally {
        setTestingConnection(false);
      }
      return;
    }

    if (!aiConfig.apiKey) {
      alert('❌ Insira uma chave de API primeiro');
      return;
    }

    setTestingConnection(true);
    try {
      const endpoint = aiConfig.endpoint || 'https://openrouter.ai/api/v1/chat/completions';
      const model = aiConfig.model || 'meta-llama/llama-4-maverick:free';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'SaudePara IA Test'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: 'Responda apenas "Teste de conexão bem-sucedido!" em português.'
            }
          ],
          max_tokens: 50
        })
      });

      if (response.ok) {
        const result = await response.json();
        const content = result.choices?.[0]?.message?.content || 'Resposta vazia';
        alert(`✅ API conectada com sucesso!\n\nModelo: ${model}\nResposta: ${content}`);
      } else {
        const errorText = await response.text();
        alert(`❌ Erro na API: ${response.status}\n\n${errorText}`);
      }
    } catch (error) {
      alert(`❌ Erro ao testar conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setTestingConnection(false);
    }
  }, [aiConfig]);

  const selectedEndpoint = API_ENDPOINTS.find(ep => ep.url === aiConfig.endpoint);
  const selectedModel = AI_MODELS.find(model => model.id === aiConfig.model);
  
  // Combinar modelos estáticos com modelos dinâmicos do OpenRouter
  const allModels = [
    ...AI_MODELS,
    ...availableModels.map(model => {
      // Extrair informações de preço
      const promptPrice = parseFloat(model.pricing.prompt);
      const completionPrice = parseFloat(model.pricing.completion);
      const isFree = promptPrice === 0 && completionPrice === 0;
      
      // Extrair provider do ID do modelo
      const provider = model.id.split('/')[0] || 'OpenRouter';
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
      
      // Formatar contexto em formato legível
      const contextFormatted = model.context_length >= 1000000 
        ? `${(model.context_length / 1000000).toFixed(1)}M tokens`
        : model.context_length >= 1000
          ? `${(model.context_length / 1000).toFixed(0)}K tokens`
          : `${model.context_length} tokens`;

      return {
        id: model.id,
        name: model.name,
        provider: providerName,
        description: isFree 
          ? `${model.description || 'Modelo gratuito'} • Contexto: ${contextFormatted}`
          : `${model.description || 'Modelo pago'} • Contexto: ${contextFormatted}`,
        category: isFree ? 'free' : 'paid' as 'free' | 'paid',
        contextLength: model.context_length,
        pricing: {
          prompt: model.pricing.prompt,
          completion: model.pricing.completion,
          formatted: isFree ? 'Gratuito' : `$${promptPrice}/1M tokens`
        }
      };
    })
  ];
  
  // Remover duplicatas baseadas no ID
  const uniqueModels = allModels.filter((model, index, self) => 
    index === self.findIndex(m => m.id === model.id)
  );
  
  const filteredModels = uniqueModels.filter(model => {
    // Filtro por categoria (free/paid/all)
    let matchesCategory = true;
    if (modelFilter === 'free') matchesCategory = model.category === 'free';
    if (modelFilter === 'paid') matchesCategory = model.category === 'paid';
    
    // Filtro por pesquisa (nome, provider, descrição)
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      matchesSearch = 
        model.name.toLowerCase().includes(query) ||
        model.provider.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query) ||
        model.id.toLowerCase().includes(query);
    }
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Configuração Global da IA</h3>
            <p className="text-sm text-gray-600">
              {aiConfig.mode === 'localhost' ? (
                <span className="flex items-center gap-1">
                  <Server className="h-3 w-3 text-green-600" />
                  Ollama Local (llama3.1)
                </span>
              ) : aiConfig.apiKey ? (
                <span className="flex items-center gap-1">
                  <Cloud className="h-3 w-3 text-blue-600" />
                  {selectedModel?.name || 'API Externa'} via {selectedEndpoint?.name || 'Custom'}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-orange-600">
                  <AlertCircle className="h-3 w-3" />
                  Clique para configurar API gratuita
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div className={`w-3 h-3 rounded-full ${
            aiConfig.mode === 'localhost' 
              ? 'bg-green-500 animate-pulse' 
              : aiConfig.apiKey 
                ? 'bg-blue-500' 
                : 'bg-gray-400'
          }`} />
          
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Painel de Configurações */}
      {isOpen && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          
          {/* Banner de Ajuda para API Key */}
          {aiConfig.mode === 'api' && !aiConfig.apiKey && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-2">🚀 Configure sua IA em 2 minutos!</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Para usar centenas de modelos de IA (incluindo <strong>opções gratuitas</strong>), você precisa de uma chave API.
                  </p>
                  <div className="flex gap-2">
                    <a 
                      href="https://openrouter.ai" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Brain className="h-4 w-4" />
                      Conseguir Chave Grátis
                    </a>
                    <button
                      onClick={() => {
                        const instructions = document.querySelector('[data-instructions]');
                        if (instructions) {
                          instructions.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="px-4 py-2 bg-white text-blue-600 text-sm rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      Ver Tutorial
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Modo de Operação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modo de Operação
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="aiMode"
                  value="localhost"
                  checked={aiConfig.mode === 'localhost'}
                  onChange={(e) => saveConfig({ ...aiConfig, mode: e.target.value as 'localhost' | 'api' })}
                  className="mr-2"
                />
                <Server className="h-4 w-4 mr-1 text-green-600" />
                <span className="text-sm">Localhost (Ollama)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="aiMode"
                  value="api"
                  checked={aiConfig.mode === 'api'}
                  onChange={(e) => saveConfig({ ...aiConfig, mode: e.target.value as 'localhost' | 'api' })}
                  className="mr-2"
                />
                <Cloud className="h-4 w-4 mr-1 text-blue-600" />
                <span className="text-sm">API Externa</span>
              </label>
            </div>
          </div>

          {/* Configurações para API Externa */}
          {aiConfig.mode === 'api' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              
              {/* Servidor da API */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servidor da API
                </label>
                <select
                  value={aiConfig.endpoint || ''}
                  onChange={(e) => saveConfig({ ...aiConfig, endpoint: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  {API_ENDPOINTS.map(endpoint => (
                    <option key={endpoint.id} value={endpoint.url}>
                      {endpoint.name} - {endpoint.description}
                    </option>
                  ))}
                </select>
                
                {selectedEndpoint && (
                  <div className="mt-2 p-2 bg-white rounded border text-xs">
                    <div className="font-medium text-gray-700 mb-1">Características:</div>
                    <ul className="text-gray-600 list-disc list-inside">
                      {selectedEndpoint.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Modelo de IA */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Modelo de IA
                  </label>
                  <button
                    onClick={() => setShowModelList(!showModelList)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Info className="h-3 w-3" />
                    {loadingModels 
                      ? 'Carregando modelos...' 
                      : showModelList 
                        ? 'Ocultar lista' 
                        : `Ver ${uniqueModels.length} modelos disponíveis`
                    }
                  </button>
                </div>
                
                <select
                  value={aiConfig.model || ''}
                  onChange={(e) => saveConfig({ ...aiConfig, model: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="">Selecione um modelo...</option>
                  {uniqueModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {model.provider} {model.category === 'free' ? '(Gratuito)' : '(Pago)'}
                    </option>
                  ))}
                </select>

                {selectedModel && (
                  <div className="mt-2 p-2 bg-white rounded border text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedModel.category === 'free' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedModel.category === 'free' ? 'Gratuito' : 'Pago'}
                      </span>
                      <span className="text-gray-600">
                        Contexto: {selectedModel.contextLength.toLocaleString()} tokens
                      </span>
                    </div>
                    <p className="text-gray-600">{selectedModel.description}</p>
                  </div>
                )}

                {/* Lista expandida de modelos */}
                {showModelList && (
                  <div className="mt-3 border border-gray-200 rounded">
                    <div className="p-3 bg-gray-50 border-b space-y-3">
                      {/* Campo de Pesquisa */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Pesquisar modelos (ex: GPT, Claude, Llama...)"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      
                      {/* Filtros por Categoria */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModelFilter('all')}
                          className={`px-3 py-1 rounded text-xs ${
                            modelFilter === 'all' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Todos
                        </button>
                        <button
                          onClick={() => setModelFilter('free')}
                          className={`px-3 py-1 rounded text-xs ${
                            modelFilter === 'free' 
                              ? 'bg-green-600 text-white' 
                              : 'bg-white text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Gratuitos
                        </button>
                        <button
                          onClick={() => setModelFilter('paid')}
                          className={`px-3 py-1 rounded text-xs ${
                            modelFilter === 'paid' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Pagos
                        </button>
                        
                        {/* Contador de resultados */}
                        <div className="ml-auto text-xs text-gray-600 flex items-center">
                          {filteredModels.length} de {uniqueModels.length} modelos
                        </div>
                      </div>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto">
                      {filteredModels.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <Search className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm">
                            {searchQuery 
                              ? `Nenhum modelo encontrado para "${searchQuery}"`
                              : 'Nenhum modelo encontrado para os filtros selecionados'
                            }
                          </p>
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className="mt-2 text-xs text-blue-600 hover:underline"
                            >
                              Limpar pesquisa
                            </button>
                          )}
                        </div>
                      ) : (
                        filteredModels.map(model => (
                          <div 
                            key={model.id}
                            className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                              aiConfig.model === model.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                            onClick={() => {
                              saveConfig({ ...aiConfig, model: model.id });
                              setShowModelList(false);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{model.name}</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  model.category === 'free' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {model.category === 'free' ? 'Gratuito' : 'Pago'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{model.description}</p>
                              <p className="text-xs text-gray-500">
                                {model.provider} • {model.contextLength.toLocaleString()} tokens
                              </p>
                            </div>
                            
                            {aiConfig.model === model.id && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                        </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Chave de API */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chave de API
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={aiConfig.apiKey || ''}
                    onChange={(e) => saveConfig({ ...aiConfig, apiKey: e.target.value })}
                    placeholder="Insira sua chave de API..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                <div className="mt-2 text-xs text-gray-500 space-y-2">
                  <p>💡 Sua chave é armazenada apenas no seu navegador</p>
                  
                  {selectedEndpoint?.id === 'openrouter' && (
                    <div data-instructions className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Como conseguir sua chave API gratuita</span>
                      </div>
                      
                      <div className="space-y-2 text-xs text-blue-700">
                        <div>
                          <strong>Passo 1:</strong> Acesse o OpenRouter
                          <div className="ml-4 mt-1">
                            🔗 <a 
                              href="https://openrouter.ai" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium"
                            >
                              openrouter.ai
                            </a> (Clique para abrir)
                          </div>
                        </div>
                        
                        <div>
                          <strong>Passo 2:</strong> Crie sua conta
                          <div className="ml-4 mt-1">
                            • Clique em "Sign Up" (Cadastrar)
                            <br />
                            • Use seu email ou conta Google/GitHub
                            <br />
                            • Confirme sua conta pelo email
                          </div>
                        </div>
                        
                        <div>
                          <strong>Passo 3:</strong> Gere sua chave API
                          <div className="ml-4 mt-1">
                            🔗 <a 
                              href="https://openrouter.ai/keys" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium"
                            >
                              openrouter.ai/keys
                            </a> (Link direto)
                            <br />
                            • Clique em "Create Key" (Criar Chave)
                            <br />
                            • Dê um nome (ex: "Saúde Pará")
                            <br />
                            • <strong>Copie a chave</strong> (começa com "sk-...")
                          </div>
                        </div>
                        
                        <div>
                          <strong>Passo 4:</strong> Cole aqui e configure
                          <div className="ml-4 mt-1">
                            • Cole a chave no campo acima
                            <br />
                            • Clique em "Atualizar Modelos"
                            <br />
                            • Escolha seu modelo favorito
                          </div>
                        </div>
                        
                        <div className="mt-3 p-2 bg-green-100 rounded border border-green-300">
                          <strong className="text-green-800">💰 Créditos Grátis:</strong>
                          <div className="text-green-700 mt-1">
                            • OpenRouter oferece <strong>$5 grátis</strong> para novos usuários
                            <br />
                            • Muitos modelos são <strong>100% gratuitos</strong>
                            <br />
                            • Suficiente para milhares de mensagens
                          </div>
                        </div>
                        
                        <div className="mt-2 text-center">
                          🆘 <strong>Precisa de ajuda?</strong>
                          <br />
                          <a 
                            href="https://openrouter.ai/docs/quick-start" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Guia oficial do OpenRouter
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedEndpoint?.id === 'openai' && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="space-y-2 text-xs text-gray-700">
                        <div>
                          <strong>Como conseguir chave da OpenAI:</strong>
                        </div>
                        <div>
                          1. Acesse: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">platform.openai.com/api-keys</a>
                        </div>
                        <div>
                          2. Faça login ou cadastre-se
                        </div>
                        <div>
                          3. Clique em "Create new secret key"
                        </div>
                        <div>
                          ⚠️ <strong>Atenção:</strong> OpenAI cobra por uso (não é gratuita)
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedEndpoint?.id === 'anthropic' && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="space-y-2 text-xs text-gray-700">
                        <div>
                          <strong>Como conseguir chave da Anthropic (Claude):</strong>
                        </div>
                        <div>
                          1. Acesse: <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">console.anthropic.com/settings/keys</a>
                        </div>
                        <div>
                          2. Crie sua conta
                        </div>
                        <div>
                          3. Gere uma nova chave API
                        </div>
                        <div>
                          ⚠️ <strong>Atenção:</strong> Anthropic cobra por uso
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Configurações para Localhost */}
          {aiConfig.mode === 'localhost' && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Server className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Modo Local (Ollama)</span>
              </div>
              <p className="text-sm text-green-700 mb-2">
                Usando Ollama local em localhost:11434 com modelo llama3.1
              </p>
              <p className="text-xs text-green-600">
                ✅ Privacidade total - nenhum dado sai do seu computador
              </p>
            </div>
          )}

          {/* Botões de Teste e Atualização */}
          <div className="flex justify-end gap-2">
            {aiConfig.mode === 'api' && aiConfig.endpoint?.includes('openrouter') && (
              <button
                onClick={fetchAvailableModels}
                disabled={loadingModels}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingModels ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Carregando...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    Atualizar Modelos
                  </>
                )}
              </button>
            )}
            <button
              onClick={testConnection}
              disabled={testingConnection}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {testingConnection ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Testando...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4" />
                  Testar Conexão
                </>
              )}
            </button>
          </div>

          {/* Informações sobre aplicação */}
          <div className="mt-4 p-3 bg-gray-50 rounded border text-xs text-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Aplicação das Configurações</span>
            </div>
            <p>
              Estas configurações são aplicadas automaticamente a todos os componentes de IA:
              <strong> Chat Interativo</strong>, <strong>Insights Automáticos</strong> e <strong>Alertas Inteligentes</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIGlobalConfig;
