import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, Filter, TrendingUp, Clock, CheckCircle, XCircle, ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '@/keycloak/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ChatAdminDetalhes from './ChatAdminDetalhes';
import { AdminHeader } from '@/keycloak/admin/components/AdminHeader';
import { SideMenu } from '@/features/home/components/SideMenu';
import Footer from '@/features/desktop/components/Footer';
import './ChatAdminDashboard.css';

interface Mensagem {
  id: number;
  remetente_tipo: 'usuario' | 'admin';
  mensagem: string;
  created_at: string;
}

interface Conversa {
  id: number;
  user_id: string;
  usuario_nome: string;
  usuario_email: string | null;
  status: string;
  mensagens_nao_lidas: number;
  ultima_mensagem_em: string | null;
  mensagens: Mensagem[];
}

interface Estatisticas {
  totalConversas: number;
  conversasAbertas: number;
  conversasEmAndamento: number;
  conversasFechadas: number;
  totalMensagensNaoLidas: number;
}

const ChatAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedLanguage } = useLanguage();
  const navigate = useNavigate();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversaSelecionada, setConversaSelecionada] = useState<number | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [mostrarNaoLidas, setMostrarNaoLidas] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ✅ Verificar se é admin master (não admin hierárquico)
  const isAdminMaster = user?.roles?.includes('admin');

  // ✅ Redirecionar se não for admin master
  useEffect(() => {
    if (user && !isAdminMaster) {
      navigate('/access-denied');
    }
  }, [user, isAdminMaster, navigate]);

  useEffect(() => {
    if (!isAdminMaster) return; // Não carregar dados se não for admin master
    
    carregarDados();
    
    // Atualizar a cada 10 segundos
    const interval = setInterval(() => {
      carregarDados();
    }, 10000);

    return () => clearInterval(interval);
  }, [filtroStatus, filtroBusca, mostrarNaoLidas, isAdminMaster]);

  const carregarDados = async () => {
    try {
      const [conversasRes, statsRes] = await Promise.all([
        axios.get('/api/chat/admin/conversas', {
          params: {
            status: filtroStatus || undefined,
            busca: filtroBusca || undefined,
            comNaoLidas: mostrarNaoLidas || undefined
          },
          withCredentials: true
        }),
        axios.get('/api/chat/admin/estatisticas', {
          withCredentials: true
        })
      ]);

      if (conversasRes.data.success) {
        setConversas(conversasRes.data.data);
      }

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarDataRelativa = (data: string | null) => {
    if (!data) return 'Sem mensagens';
    
    const now = new Date();
    const msgDate = new Date(data);
    const diff = now.getTime() - msgDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    
    return msgDate.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'status-aberto';
      case 'em_andamento': return 'status-andamento';
      case 'fechado': return 'status-fechado';
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aberto': return 'Aberto';
      case 'em_andamento': return 'Em Andamento';
      case 'fechado': return 'Fechado';
      default: return status;
    }
  };

  const deletarConversa = async (conversaId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar abrir a conversa ao clicar em deletar

    if (!confirm('Tem certeza que deseja deletar esta conversa? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/chat/admin/conversa/${conversaId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        // Recarregar dados
        carregarDados();
      }
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
      alert('Erro ao deletar conversa');
    }
  };

  if (conversaSelecionada) {
    return (
      <ChatAdminDetalhes
        conversaId={conversaSelecionada}
        onVoltar={() => {
          setConversaSelecionada(null);
          carregarDados();
        }}
      />
    );
  }

  return (
    <div className="chat-admin-page">
      {/* Header */}
      <AdminHeader 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
        selectedLanguage={selectedLanguage}
      />

      {/* Menu Lateral */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Título e botão voltar */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Voltar ao Painel Administrativo"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Chat de Suporte
              </h1>
              <p className="text-gray-600">
                Gerenciamento de conversas e atendimentos
              </p>
            </div>
          </div>

      <div className="chat-admin-content">
      {/* Estatísticas */}
      {stats && (
        <div className="admin-stats">
          <div className="stat-card">
            <TrendingUp size={24} />
            <div className="stat-info">
              <span className="stat-value">{stats.totalConversas}</span>
              <span className="stat-label">Total de Conversas</span>
            </div>
          </div>

          <div className="stat-card">
            <Clock size={24} />
            <div className="stat-info">
              <span className="stat-value">{stats.conversasAbertas}</span>
              <span className="stat-label">Abertas</span>
            </div>
          </div>

          <div className="stat-card">
            <CheckCircle size={24} />
            <div className="stat-info">
              <span className="stat-value">{stats.conversasEmAndamento}</span>
              <span className="stat-label">Em Andamento</span>
            </div>
          </div>

          <div className="stat-card">
            <XCircle size={24} />
            <div className="stat-info">
              <span className="stat-value">{stats.conversasFechadas}</span>
              <span className="stat-label">Fechadas</span>
            </div>
          </div>

          <div className="stat-card destaque">
            <MessageCircle size={24} />
            <div className="stat-info">
              <span className="stat-value">{stats.totalMensagensNaoLidas}</span>
              <span className="stat-label">Não Lidas</span>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="admin-filtros">
        <div className="filtro-busca">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, email ou ID..."
            value={filtroBusca}
            onChange={(e) => setFiltroBusca(e.target.value)}
          />
        </div>

        <div className="filtro-opcoes">
          <Filter size={18} />
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="aberto">Aberto</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="fechado">Fechado</option>
          </select>

          <label className="filtro-checkbox">
            <input
              type="checkbox"
              checked={mostrarNaoLidas}
              onChange={(e) => setMostrarNaoLidas(e.target.checked)}
            />
            Apenas não lidas
          </label>
        </div>
      </div>

      {/* Lista de conversas */}
      <div className="admin-conversas-lista">
        {loading ? (
          <div className="admin-loading">Carregando...</div>
        ) : conversas.length === 0 ? (
          <div className="admin-empty">
            <MessageCircle size={48} />
            <p>Nenhuma conversa encontrada</p>
          </div>
        ) : (
          conversas.map((conversa) => (
            <div
              key={conversa.id}
              className="conversa-card"
              onClick={() => setConversaSelecionada(conversa.id)}
            >
              <div className="conversa-avatar">
                {conversa.usuario_nome.charAt(0).toUpperCase()}
              </div>

              <div className="conversa-info">
                <div className="conversa-header">
                  <span className="conversa-nome">{conversa.usuario_nome}</span>
                  <span className="conversa-data">
                    {formatarDataRelativa(conversa.ultima_mensagem_em)}
                  </span>
                </div>

                <div className="conversa-preview">
                  {conversa.mensagens[0] ? (
                    <span>
                      {conversa.mensagens[0].remetente_tipo === 'admin' ? 'Você: ' : ''}
                      {conversa.mensagens[0].mensagem.substring(0, 60)}
                      {conversa.mensagens[0].mensagem.length > 60 ? '...' : ''}
                    </span>
                  ) : (
                    <span className="sem-mensagens">Sem mensagens</span>
                  )}
                </div>

                <div className="conversa-footer">
                  <span className={`conversa-status ${getStatusColor(conversa.status)}`}>
                    {getStatusLabel(conversa.status)}
                  </span>
                  {conversa.usuario_email && (
                    <span className="conversa-email">{conversa.usuario_email}</span>
                  )}
                </div>
              </div>

              {conversa.mensagens_nao_lidas > 0 && (
                <div className="conversa-badge">
                  {conversa.mensagens_nao_lidas}
                </div>
              )}

              {/* Botão deletar */}
              <button
                onClick={(e) => deletarConversa(conversa.id, e)}
                className="conversa-delete-btn"
                title="Deletar conversa"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
      </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ChatAdminDashboard;
