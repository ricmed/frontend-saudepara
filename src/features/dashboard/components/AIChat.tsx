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
  Server,
  Cloud,
  Info
} from 'lucide-react';
import { STORAGE_KEYS, readStringWithLegacy } from '@/utils/storageKeys';

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
  const LEGACY_AI_GLOBAL_CONFIG_KEY = 'aiGlobalConfig';
  const LEGACY_AI_CHAT_CONFIG_KEY = 'aiChatConfig';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Configuração da IA - carrega das configurações globais primeiro, depois do local antigo
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const globalSaved = readStringWithLegacy(
      STORAGE_KEYS.ai.globalConfig,
      [LEGACY_AI_GLOBAL_CONFIG_KEY, LEGACY_AI_CHAT_CONFIG_KEY]
    );
    if (globalSaved) {
      return JSON.parse(globalSaved);
    }
    const localSaved = readStringWithLegacy(STORAGE_KEYS.ai.chatConfig, [LEGACY_AI_CHAT_CONFIG_KEY]);
    return localSaved ? JSON.parse(localSaved) : { mode: 'localhost' };
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sincronizar com configurações globais
  useEffect(() => {
    const handleStorageChange = () => {
      const globalSaved = readStringWithLegacy(
        STORAGE_KEYS.ai.globalConfig,
        [LEGACY_AI_GLOBAL_CONFIG_KEY, LEGACY_AI_CHAT_CONFIG_KEY]
      );
      if (globalSaved) {
        const config = JSON.parse(globalSaved);
        setAiConfig(config);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Verificar se há configuração global no carregamento
    const globalSaved = readStringWithLegacy(
      STORAGE_KEYS.ai.globalConfig,
      [LEGACY_AI_GLOBAL_CONFIG_KEY, LEGACY_AI_CHAT_CONFIG_KEY]
    );
    if (globalSaved) {
      const config = JSON.parse(globalSaved);
      setAiConfig(config);
    }

    return () => window.removeEventListener('storage', handleStorageChange);
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
        content: `❌ Chave de API não configurada. Use a "Configuração Global de IA" na parte superior da seção de IA para inserir sua chave de API.`,
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
        
        // Detectar o modelo baseado no endpoint - usar modelos que realmente existem
        let model = 'meta-llama/llama-4-maverick:free'; // Modelo Llama 4 gratuito no OpenRouter
        
        if (endpoint.includes('groq.com')) {
          model = 'llama3-8b-8192';
        } else if (endpoint.includes('together')) {
          model = 'meta-llama/Llama-3-8b-chat-hf';
        } else if (endpoint.includes('openrouter')) {
          // Usar modelo Llama 4 gratuito que existe no OpenRouter
          model = 'meta-llama/llama-4-maverick:free'; // ✅ Modelo verificado
        }
        
        console.log('🔗 Fazendo chamada para API:', { endpoint, model, hasApiKey: !!aiConfig.apiKey });
        
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'SaudePara IA Chat'
          },
          body: JSON.stringify({
            model: model,
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
        const errorText = await response.text();
        console.error('❌ Erro da API:', { status: response.status, statusText: response.statusText, body: errorText });
        throw new Error(`Erro na API: ${response.status} - ${response.statusText}${errorText ? ` | ${errorText}` : ''}`);
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
        if (errorMessage.includes('404')) {
          errorContent += `\n\n💡 Erro 404: Verifique se o endpoint da API está correto. Para OpenRouter use: https://openrouter.ai/api/v1/chat/completions`;
        } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
          errorContent += `\n\n💡 Erro de autenticação: Verifique se sua chave de API está correta e ativa.`;
        } else if (errorMessage.includes('429')) {
          errorContent += `\n\n💡 Limite de requisições excedido. Aguarde um momento e tente novamente.`;
        } else {
          errorContent += `\n\n💡 Verifique se sua chave de API está correta e se você tem créditos disponíveis.`;
        }
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
              <div className="bg-white p-3 rounded border space-y-4">
                <p className="mb-3 text-gray-700">
                  <strong>Se preferir não instalar localmente</strong>, você pode usar serviços de IA na nuvem.
                  Escolha uma das opções abaixo e siga o guia passo a passo:
                </p>

                {/* OpenRouter */}
                <div className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50">
                  <h6 className="font-semibold text-blue-800 mb-2">🔵 OpenRouter (Recomendado)</h6>
                  <div className="space-y-2 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <p className="font-medium mb-2">Passo a Passo:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-600">
                        <li>Acesse: <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono">https://openrouter.ai</a></li>
                        <li>Clique em "Sign Up" e crie sua conta gratuita</li>
                        <li>Após login, vá em "Keys" no menu lateral</li>
                        <li>Clique em "Create Key" e dê um nome (ex: "SaudePara")</li>
                        <li>Copie a chave gerada (começa com "sk-or-...")</li>
                        <li>Cole a chave no campo "Chave de API" acima</li>
                      </ol>
                      <div className="mt-2 p-2 bg-green-50 rounded">
                        <p className="text-xs text-green-700">
                          ✅ <strong>Vantagem:</strong> Oferece Llama 3.1 gratuito (modelo: meta-llama/llama-3.1-8b-instruct:free)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Groq */}
                <div className="border-l-4 border-orange-400 pl-4 py-2 bg-orange-50">
                  <h6 className="font-semibold text-orange-800 mb-2">🟠 Groq (Muito Rápido)</h6>
                  <div className="space-y-2 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <p className="font-medium mb-2">Passo a Passo:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-600">
                        <li>Acesse: <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono">https://console.groq.com</a></li>
                        <li>Faça login com Google ou GitHub</li>
                        <li>No dashboard, clique em "API Keys"</li>
                        <li>Clique "Create API Key" e dê um nome</li>
                        <li>Copie a chave gerada (começa com "gsk_...")</li>
                        <li>Cole no campo "Chave de API" e mude o endpoint para:</li>
                      </ol>
                      <code className="block bg-gray-100 p-2 rounded mt-2 text-xs">
                        https://api.groq.com/openai/v1/chat/completions
                      </code>
                      <div className="mt-2 p-2 bg-green-50 rounded">
                        <p className="text-xs text-green-700">
                          ✅ <strong>Vantagem:</strong> Respostas muito rápidas + tier gratuito generoso
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Together AI */}
                <div className="border-l-4 border-purple-400 pl-4 py-2 bg-purple-50">
                  <h6 className="font-semibold text-purple-800 mb-2">🟣 Together AI</h6>
                  <div className="space-y-2 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <p className="font-medium mb-2">Passo a Passo:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-600">
                        <li>Acesse: <a href="https://api.together.xyz" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono">https://api.together.xyz</a></li>
                        <li>Clique "Sign Up" e crie conta</li>
                        <li>Vá em "API Keys" no menu</li>
                        <li>Clique "Create new API Key"</li>
                        <li>Copie a chave gerada</li>
                        <li>Cole no campo "Chave de API" e mude o endpoint para:</li>
                      </ol>
                      <code className="block bg-gray-100 p-2 rounded mt-2 text-xs">
                        https://api.together.xyz/v1/chat/completions
                      </code>
                      <div className="mt-2 p-2 bg-green-50 rounded">
                        <p className="text-xs text-green-700">
                          ✅ <strong>Vantagem:</strong> Boa variedade de modelos + créditos iniciais
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuração no Sistema */}
                <div className="border border-gray-300 rounded p-3 bg-gray-50">
                  <h6 className="font-semibold text-gray-800 mb-2">⚙️ Como Configurar no Sistema</h6>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    <li>Após obter sua chave de API de qualquer provedor acima</li>
                    <li>Vá até a "Configuração Global de IA" na parte superior da seção de IA</li>
                    <li>Selecione "API Externa"</li>
                    <li>Cole sua chave de API no campo correspondente</li>
                    <li>Se necessário, ajuste o endpoint da API</li>
                    <li>✅ Pronto! Comece a fazer perguntas</li>
                  </ol>
                </div>

                {/* Dicas de Segurança */}
                <div className="border border-yellow-300 rounded p-3 bg-yellow-50">
                  <h6 className="font-semibold text-yellow-800 mb-2">🔒 Dicas de Segurança</h6>
                  <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                    <li>Suas chaves de API ficam armazenadas apenas no seu navegador</li>
                    <li>Nunca compartilhe suas chaves de API com outras pessoas</li>
                    <li>Se suspeitar que a chave foi comprometida, gere uma nova</li>
                    <li>Use o modo localhost para dados extremamente sensíveis</li>
                  </ul>
                </div>

                {/* Comparação de Custos */}
                <div className="border border-green-300 rounded p-3 bg-green-50">
                  <h6 className="font-semibold text-green-800 mb-2">💰 Comparação de Custos (por mensagem)</h6>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div className="bg-white p-2 rounded">
                      <strong>OpenRouter:</strong><br />
                      Llama 3.1 gratuito<br />
                      <span className="text-green-600">$0.00</span>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <strong>Groq:</strong><br />
                      Tier gratuito robusto<br />
                      <span className="text-green-600">$0.00</span>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <strong>Together AI:</strong><br />
                      Créditos iniciais<br />
                      <span className="text-blue-600">~$0.001</span>
                    </div>
                  </div>
                </div>
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
