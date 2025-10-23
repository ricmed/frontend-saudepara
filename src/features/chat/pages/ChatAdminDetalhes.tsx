import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Loader, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import axios from 'axios';
import { AdminHeader } from '@/keycloak/admin/components/AdminHeader';
import { SideMenu } from '@/features/home/components/SideMenu';
import Footer from '@/features/desktop/components/Footer';
import './ChatAdminDetalhes.css';

interface Mensagem {
  id: number;
  remetente_tipo: 'usuario' | 'admin';
  remetente_nome: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

interface Conversa {
  id: number;
  user_id: string;
  usuario_nome: string;
  usuario_email: string | null;
  status: string;
  mensagens: Mensagem[];
}

interface ChatAdminDetalhesProps {
  conversaId: number;
  onVoltar: () => void;
}

const ChatAdminDetalhes: React.FC<ChatAdminDetalhesProps> = ({ conversaId, onVoltar }) => {
  const { selectedLanguage } = useLanguage();
  const [conversa, setConversa] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    carregarConversa();
    marcarComoLidas(); // ✅ Marcar mensagens como lidas ao abrir
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(() => {
      carregarConversa();
    }, 5000);

    return () => clearInterval(interval);
  }, [conversaId]);

  // Removido: scroll automático ao carregar mensagens
  // useEffect(() => {
  //   scrollParaFinal();
  // }, [mensagens]);

  const scrollParaFinal = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const marcarComoLidas = async () => {
    try {
      await axios.put(
        `/api/chat/admin/conversa/${conversaId}/marcar-lidas`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  const carregarConversa = async () => {
    try {
      const response = await axios.get(`/api/chat/admin/conversa/${conversaId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        setConversa(response.data.data);
        setMensagens(response.data.data.mensagens);
      }
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
    } finally {
      setLoading(false);
    }
  };

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!novaMensagem.trim()) return;

    setEnviando(true);

    try {
      const response = await axios.post(
        `/api/chat/admin/responder/${conversaId}`,
        { mensagem: novaMensagem.trim() },
        { withCredentials: true }
      );

      if (response.data.success) {
        setNovaMensagem('');
        carregarConversa();
        // Scroll para o final apenas quando admin envia mensagem
        setTimeout(() => scrollParaFinal(), 100);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setEnviando(false);
    }
  };

  const alterarStatus = async (novoStatus: string) => {
    setAtualizandoStatus(true);

    try {
      await axios.put(
        `/api/chat/admin/conversa/${conversaId}/status`,
        { status: novoStatus },
        { withCredentials: true }
      );

      carregarConversa();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setAtualizandoStatus(false);
    }
  };

  const formatarData = (data: string) => {
    const date = new Date(data);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return '#f59e0b';
      case 'em_andamento': return '#3b82f6';
      case 'fechado': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="chat-admin-loading">
        <Loader className="spinner" size={48} />
        <p>Carregando conversa...</p>
      </div>
    );
  }

  if (!conversa) {
    return (
      <div className="chat-admin-erro">
        <p>Conversa não encontrada</p>
        <button onClick={onVoltar}>Voltar</button>
      </div>
    );
  }

  return (
    <div className="chat-admin-page">
      {/* Header */}
      <AdminHeader 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
        selectedLanguage={selectedLanguage}
      />

      {/* Menu */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Conteúdo */}
      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Título e botão voltar */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={onVoltar}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Voltar para Lista de Conversas"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {conversa.usuario_nome}
              </h1>
              {conversa.usuario_email && (
                <p className="text-gray-600">
                  {conversa.usuario_email}
                </p>
              )}
            </div>
          </div>

      <div className="chat-admin-detalhes">
      <div className="detalhes-info-header">
        <div className="info-principal">
          <h3>{conversa.usuario_nome}</h3>
          {conversa.usuario_email && <p>{conversa.usuario_email}</p>}
        </div>

        <div className="header-acoes">
          <select
            value={conversa.status}
            onChange={(e) => alterarStatus(e.target.value)}
            disabled={atualizandoStatus}
            style={{ borderColor: getStatusColor(conversa.status) }}
          >
            <option value="aberto">Aberto</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="fechado">Fechado</option>
          </select>
        </div>
      </div>

      {/* Mensagens */}
      <div className="detalhes-mensagens">
        {mensagens.map((msg) => (
          <div
            key={msg.id}
            className={`detalhes-mensagem ${
              msg.remetente_tipo === 'usuario' ? 'mensagem-usuario' : 'mensagem-admin'
            }`}
          >
            <div className="mensagem-header">
              <span className="mensagem-autor">{msg.remetente_nome}</span>
              <span className="mensagem-data">{formatarData(msg.created_at)}</span>
            </div>
            <div className="mensagem-texto">{msg.mensagem}</div>
            {msg.remetente_tipo === 'usuario' && (
              <div className="mensagem-status">
                {msg.lida ? (
                  <>
                    <CheckCircle size={14} />
                    <span>Lida</span>
                  </>
                ) : (
                  <span className="nao-lida">Não lida</span>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="detalhes-input-container" onSubmit={enviarMensagem}>
        <textarea
          className="detalhes-input"
          placeholder="Digite sua resposta..."
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          rows={3}
          disabled={enviando}
        />
        <button
          type="submit"
          className="detalhes-send-btn"
          disabled={!novaMensagem.trim() || enviando}
        >
          {enviando ? (
            <Loader className="spinner" size={20} />
          ) : (
            <>
              <Send size={20} />
              Enviar
            </>
          )}
        </button>
      </form>
      </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ChatAdminDetalhes;
