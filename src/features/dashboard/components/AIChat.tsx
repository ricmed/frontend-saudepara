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
  AlertCircle
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      const response = await fetch('http://localhost:11434/api/generate', {
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

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.response) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Resposta vazia da IA');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Erro ao processar sua pergunta: ${errorMessage}\n\nVerifique se o Ollama está rodando (http://localhost:11434) e tente novamente.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, dashboardData, messages]);

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
            <p className="text-sm text-blue-600">Pergunte sobre os dados de saúde</p>
          </div>
        </div>
        
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
