import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Loader, AlertCircle, CheckCheck, Trash2 } from 'lucide-react';
import { useAuth } from '@/keycloak/AuthProvider';
import axios from 'axios';
import './ChatSuporteModal.css';

interface Mensagem {
  id: number;
  remetente_tipo: 'usuario' | 'admin';
  remetente_nome: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

interface ChatSuporteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatSuporteModal: React.FC<ChatSuporteModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Carregar mensagens ao abrir o chat
  useEffect(() => {
    if (isOpen && user) {
      carregarMensagens();
      marcarComoLidas();
    }
  }, [isOpen, user]);

  // Auto scroll para última mensagem
  useEffect(() => {
    scrollParaFinal();
  }, [mensagens]);

  // Focar no input ao abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const scrollParaFinal = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const carregarMensagens = async () => {
    setLoading(true);
    setErro(null);
    
    try {
      const response = await axios.get('/api/chat/mensagens', {
        withCredentials: true
      });

      if (response.data.success && response.data.data) {
        setMensagens(response.data.data.mensagens || []);
      }
    } catch (error: any) {
      console.error('Erro ao carregar mensagens:', error);
      setErro('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLidas = async () => {
    try {
      await axios.put('/api/chat/marcar-lidas', {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Erro ao marcar como lidas:', error);
    }
  };

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!novaMensagem.trim()) return;

    setEnviando(true);
    setErro(null);

    try {
      const response = await axios.post('/api/chat/mensagem', {
        mensagem: novaMensagem.trim()
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        // Adicionar mensagem na lista
        const mensagemEnviada = response.data.data;
        setMensagens(prev => [...prev, mensagemEnviada]);
        setNovaMensagem('');
        
        // Recarregar para pegar dados atualizados
        setTimeout(() => carregarMensagens(), 500);
      }
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      setErro(error.response?.data?.message || 'Erro ao enviar mensagem');
    } finally {
      setEnviando(false);
    }
  };

  const formatarData = (data: string) => {
    const date = new Date(data);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    const isHoje = date.toDateString() === hoje.toDateString();
    const isOntem = date.toDateString() === ontem.toDateString();

    const hora = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (isHoje) return `Hoje às ${hora}`;
    if (isOntem) return `Ontem às ${hora}`;

    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deletarMensagem = async (mensagemId: number) => {
    if (!confirm('Deseja deletar esta mensagem?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/chat/mensagem/${mensagemId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        // Remover mensagem da lista
        setMensagens(prev => prev.filter(m => m.id !== mensagemId));
      }
    } catch (error: any) {
      console.error('Erro ao deletar mensagem:', error);
      alert(error.response?.data?.message || 'Erro ao deletar mensagem');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem(e as any);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-suporte-overlay" onClick={onClose}>
      <div className="chat-suporte-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar">
              <span>SP</span>
            </div>
            <div>
              <h3>Saúde Pará</h3>
              <p className="chat-subtitle">Suporte Técnico</p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Mensagens */}
        <div className="chat-messages">
          {loading ? (
            <div className="chat-loading">
              <Loader className="spinner" size={32} />
              <p>Carregando mensagens...</p>
            </div>
          ) : mensagens.length === 0 ? (
            <div className="chat-empty">
              <AlertCircle size={48} />
              <p>Nenhuma mensagem ainda</p>
              <span>Envie sua primeira mensagem para reportar um bug ou solicitar suporte</span>
            </div>
          ) : (
            <>
              {mensagens.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${
                    msg.remetente_tipo === 'usuario' ? 'mensagem-usuario' : 'mensagem-admin'
                  }`}
                >
                  <div className="mensagem-bubble">
                    {msg.remetente_tipo === 'admin' && (
                      <div className="mensagem-nome">{msg.remetente_nome}</div>
                    )}
                    <div className="mensagem-texto">{msg.mensagem}</div>
                    <div className="mensagem-info">
                      <span className="mensagem-hora">
                        {formatarData(msg.created_at)}
                      </span>
                      {msg.remetente_tipo === 'usuario' && (
                        <>
                          <CheckCheck
                            size={16}
                            className={msg.lida ? 'check-lida' : 'check-enviada'}
                          />
                          <button
                            onClick={() => deletarMensagem(msg.id)}
                            className="mensagem-delete-btn"
                            title="Deletar mensagem"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Erro */}
        {erro && (
          <div className="chat-erro">
            <AlertCircle size={16} />
            <span>{erro}</span>
          </div>
        )}

        {/* Input */}
        <form className="chat-input-container" onSubmit={enviarMensagem}>
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Digite sua mensagem..."
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
            disabled={enviando}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!novaMensagem.trim() || enviando}
          >
            {enviando ? (
              <Loader className="spinner" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSuporteModal;
