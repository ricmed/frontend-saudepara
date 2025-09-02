// Componente de Chat Interativo com IA
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  Bot, 
  Loader,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Settings,
  Eye,
  EyeOff,
  Server,
  Cloud,
  Info
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

interface AIChatProps {
  dashboardData: DashboardData;
  className?: string;
}

export const AIChat: React.FC<AIChatProps> = ({ 
  dashboardData,
  className = ""
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Configuração da IA - salva no localStorage
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = localStorage.getItem('aiChatConfig');
    return saved ? JSON.parse(saved) : { mode: 'localhost' };
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Salvar configuração no localStorage
  const saveConfig = useCallback((config: AIConfig) => {
    setAiConfig(config);
    localStorage.setItem('aiChatConfig', JSON.stringify(config));
  }, []);

  const copyToClipboard = useCallback(async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    // Validar configuração da API
    if (aiConfig.mode === 'api' && !aiConfig.apiKey) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Chave de API não configurada. Clique no ícone de configurações para inserir sua chave de API do Llama 3.1.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Preparar contexto dos dados
      const dataContext = `
CONTEXTO DOS DADOS DE SAÚDE ATUAL:

📊 DADOS DISPONÍVEIS:
- Total de notificações: ${dashboardData.totalNotifications}
- Principais sintomas: ${dashboardData.topSymptoms.slice(0, 10).map(s => `${s.name} (${s.value} casos)`).join(', ')}
- Hipóteses críticas: ${dashboardData.criticalHypothesis.slice(0, 5).map(h => `${h.name} (${h.value} casos)`).join(', ')}
- Traumas: ${dashboardData.topTraumas.slice(0, 5).map(t => `${t.name} (${t.value} casos)`).join(', ')}
- Demografia - Gênero: ${dashboardData.demographics.gender.map(g => `${g.name}: ${g.value}`).join(', ')}
- Filtros ativos: ${Object.entries(dashboardData.activeFilters).filter(([,v]) => v !== null).map(([k,v]) => `${k}: ${v}`).join(', ') || 'Nenhum'}

HISTÓRICO DA CONVERSA:
${messages.slice(-6).map(m => `${m.role === 'user' ? 'USUÁRIO' : 'IA'}: ${m.content}`).join('\n')}
      `;

      const prompt = `${dataContext}

Você é um assistente especialista em epidemiologia e vigilância em saúde pública. Responda às perguntas do usuário com base nos dados do dashboard acima.

DIRETRIZES:
- Seja ESPECÍFICO e use os dados fornecidos
- Forneça respostas PRÁTICAS e ACIONÁVEIS  
- Use formatação clara com emojis quando apropriado
- Se não houver dados suficientes, seja honesto sobre as limitações
- Foque em aspectos epidemiológicos relevantes
- Mantenha respostas CONCISAS mas informativas

PERGUNTA DO USUÁRIO: ${userMessage.content}

RESPOSTA EM PORTUGUÊS:`;

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
              temperature: 0.4,
              top_p: 0.9,
              max_tokens: 800
            }
          })
        });
      } else {
        // Chamada para API externa (ex: OpenRouter, TogetherAI, etc)
        const endpoint = aiConfig.endpoint || 'https://openrouter.ai/api/v1/chat/completions';
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'SaudePara IA Chat'
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.1-8b-instruct:free',
            messages: [
              {
                role: 'system',
                content: 'Você é um assistente especialista em epidemiologia e vigilância em saúde pública.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.4,
            top_p: 0.9,
            max_tokens: 800
          })
        });
      }

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      let aiResponse = '';
      
      if (aiConfig.mode === 'localhost') {
        aiResponse = result.response;
      } else {
        aiResponse = result.choices?.[0]?.message?.content || 'Resposta vazia da API';
      }
      
      if (aiResponse) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Resposta vazia da IA');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      
      let errorContent = `❌ Erro ao processar sua pergunta: ${errorMessage}`;
      
      if (aiConfig.mode === 'localhost') {
        errorContent += `\n\n💡 Verifique se o Ollama está rodando (http://localhost:11434) e se o modelo llama3.1 está instalado.`;
      } else {
        errorContent += `\n\n💡 Verifique se sua chave de API está correta e se você tem créditos disponíveis.`;
      }
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, dashboardData, messages, aiConfig]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "Quais são os padrões mais preocupantes nos dados?",
    "Há indícios de surto ou aglomeração de casos?",
    "Como está a distribuição demográfica dos casos?",
    "Que recomendações você daria para vigilância?",
    "Existem correlações entre sintomas e hipóteses?"
  ];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 flex flex-col h-[600px] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-800">Chat com IA</h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-blue-600">
                {aiConfig.mode === 'localhost' ? 'Ollama Local' : 'API Externa'}
              </p>
              {aiConfig.mode === 'localhost' ? (
                <Server className="h-3 w-3 text-green-600" />
              ) : (
                <Cloud className="h-3 w-3 text-blue-600" />
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-blue-600 transition-colors"
            title="Ver instruções de instalação"
          >
            <Info className="h-4 w-4" />
            <span className="text-sm">Instruções</span>
          </button>
          
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-blue-600 transition-colors"
            title="Configurações da IA"
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm">Config</span>
          </button>
          
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-red-600 transition-colors"
              title="Limpar conversa"
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-sm">Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Painel de Configurações */}
      {showConfig && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <h4 className="font-medium text-gray-800 mb-3">⚙️ Configurações da IA</h4>
          
          <div className="space-y-4">
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

            {aiConfig.mode === 'api' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chave de API
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={aiConfig.apiKey || ''}
                      onChange={(e) => saveConfig({ ...aiConfig, apiKey: e.target.value })}
                      placeholder="Insira sua chave de API do Llama 3.1"
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
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endpoint da API (opcional)
                  </label>
                  <input
                    type="text"
                    value={aiConfig.endpoint || ''}
                    onChange={(e) => saveConfig({ ...aiConfig, endpoint: e.target.value })}
                    placeholder="https://openrouter.ai/api/v1/chat/completions"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Padrão: OpenRouter (compatível com OpenAI API)
                  </p>
                </div>
              </div>
            )}

            {aiConfig.mode === 'localhost' && (
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="text-sm text-green-700">
                  <strong>Modo Local:</strong> Usando Ollama rodando em localhost:11434
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Certifique-se de que o Ollama está instalado e o modelo llama3.1 baixado.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Painel de Instruções */}
      {showInstructions && (
        <div className="p-4 bg-blue-50 border-b border-blue-200 max-h-96 overflow-y-auto">
          <h4 className="font-medium text-gray-800 mb-3">📋 Como Instalar o Llama 3.1 Localmente</h4>
          
          <div className="space-y-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">🔧 Passo 1: Instalar o Ollama</h5>
              <div className="bg-white p-3 rounded border">
                <p className="mb-2"><strong>Windows:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Baixe o Ollama em: <code className="bg-gray-100 px-1 rounded">https://ollama.ai</code></li>
                  <li>Execute o instalador baixado</li>
                  <li>Abra o terminal (PowerShell ou CMD)</li>
                </ol>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-700 mb-2">📦 Passo 2: Baixar o Modelo Llama 3.1</h5>
              <div className="bg-white p-3 rounded border">
                <p className="mb-2">Execute no terminal:</p>
                <code className="bg-gray-800 text-green-400 p-2 rounded block">
                  ollama pull llama3.1
                </code>
                <p className="text-xs text-gray-500 mt-2">
                  Este comando baixará o modelo (aproximadamente 4.7GB)
                </p>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-700 mb-2">🚀 Passo 3: Iniciar o Ollama</h5>
              <div className="bg-white p-3 rounded border">
                <p className="mb-2">Execute no terminal:</p>
                <code className="bg-gray-800 text-green-400 p-2 rounded block">
                  ollama serve
                </code>
                <p className="text-xs text-gray-500 mt-2">
                  O Ollama ficará disponível em: <code>http://localhost:11434</code>
                </p>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-700 mb-2">✅ Passo 4: Testar a Instalação</h5>
              <div className="bg-white p-3 rounded border">
                <p className="mb-2">Para testar se tudo está funcionando:</p>
                <code className="bg-gray-800 text-green-400 p-2 rounded block">
                  ollama run llama3.1 "Olá, como você está?"
                </code>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <p className="text-sm text-yellow-700">
                <strong>💡 Dica:</strong> Mantenha o terminal com "ollama serve" sempre aberto enquanto usar o chat local.
              </p>
            </div>

            <div>
              <h5 className="font-medium text-gray-700 mb-2">🌐 Alternativa: Usar API Externa</h5>
              <div className="bg-white p-3 rounded border">
                <p className="mb-2">Se preferir não instalar localmente, você pode usar:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li><strong>OpenRouter:</strong> Crie uma conta em openrouter.ai</li>
                  <li><strong>Together AI:</strong> api.together.xyz</li>
                  <li><strong>Groq:</strong> console.groq.com</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  Obtenha sua chave de API e configure no modo "API Externa"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-blue-400 mx-auto mb-3" />
            <h4 className="font-medium text-gray-800 mb-2">
              Olá! Como posso ajudar com a análise dos dados?
            </h4>
            <p className="text-gray-600 text-sm mb-6">
              Faça perguntas sobre padrões, tendências ou recomendações epidemiológicas.
            </p>
            
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">Sugestões:</p>
              {suggestedQuestions.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="block w-full text-left p-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`p-2 rounded-lg flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              
              <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-3 rounded-lg max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-800 border'
                }`}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                  
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {copiedId === message.id ? (
                        <>
                          <Check className="h-3 w-3" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copiar
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                <div className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analisando dados...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta sobre os dados..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <AlertCircle className="h-3 w-3" />
          <span>Pressione Enter para enviar • Shift+Enter para quebra de linha</span>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
