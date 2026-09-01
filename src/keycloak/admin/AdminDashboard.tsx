import React, { useState, useEffect } from 'react';
import { useAuth } from '@/keycloak/AuthProvider';
import { useTranslation } from '@/i18n/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminHeader } from './components/AdminHeader';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { 
  Users, 
  UserPlus, 
  Shield, 
  UserCheck,
  UserX,
  RefreshCw,
  Building2,
  MapPin,
  Globe,
  Bell,
  Eye,
  Calendar,
  AlertCircle,
  MessageCircle, // ✅ NOVO: Ícone para Chat
  BarChart3,
} from 'lucide-react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useNotificacoesByUserAccess, useNotificacoesStats } from '@/hooks/useNotificacoesHierarquicas';
import { usuarioGestaoService } from '@/services/UsuarioGestaoService';

interface AdminStats {
  totalUsers: number;
  totalRoles: number;
  timestamp: string;
}

interface RecentActivity {
  id: string;
  type: 'userCreated' | 'roleAssigned' | 'userDisabled';
  at: string;
  who?: string;
  details?: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const USE_INTERNAL_AUTH = (import.meta as any).env?.VITE_USE_INTERNAL_AUTH === 'true';
  const ADMIN_API_BASE = USE_INTERNAL_AUTH ? '/api/auth/admin' : '/api-auth/admin';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para funcionalidades hierárquicas
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Hook para permissões do usuário atual
  const userPermissions = useUserPermissions();
  
  // Hook para notificações hierárquicas baseado no nível de acesso do usuário atual
  const notificationsData = useNotificacoesByUserAccess(
    !userPermissions.loading && userPermissions.nivel && 
    ['municipio', 'estado', 'unidade', 'estabelecimento'].includes(userPermissions.nivel) ? {
      nivel: userPermissions.nivel === 'estabelecimento' ? 'unidade' : userPermissions.nivel as 'municipio' | 'estado' | 'unidade',
      estabelecimentoId: userPermissions.estabelecimentoId,
      municipioId: userPermissions.municipioId,
      estadoId: userPermissions.estadoId
    } : null,
    { page: 1, limit: 10 }
  );
  
  // Hook para estatísticas das notificações
  const notificationStats = useNotificacoesStats(
    Array.isArray(notificationsData.data) ? notificationsData.data : 
    notificationsData.data?.data || null
  );

  // Função para interpolação de strings de tradução
  const interpolate = (s?: string, vars: Record<string, string> = {}) =>
    (s || '').replace(/\{\{?(\w+)\}?\}/g, (_, k) => vars[k] ?? '');

  // Função para formatação de tempo relativo
  const formatRelative = (date: Date, locale = 'pt-BR') => {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const diff = (Date.now() - date.getTime()) / 1000;
    const abs = Math.abs(diff);
    if (abs < 60) return rtf.format(-Math.round(diff), 'second');
    if (abs < 3600) return rtf.format(-Math.round(diff / 60), 'minute');
    if (abs < 86400) return rtf.format(-Math.round(diff / 3600), 'hour');
    return rtf.format(-Math.round(diff / 86400), 'day');
  };

  // Função para mapear dados da API
  const mapStats = (raw: any): AdminStats => {
    const src = raw?.data ?? raw; // suporta { data: {...} } ou direto
    return {
      totalUsers: Number(src?.totalUsers ?? 0),
      totalRoles: Number(src?.totalRoles ?? 0),
      timestamp: src?.timestamp ?? new Date().toISOString(),
    };
  };

  useEffect(() => {
    loadStats();
    loadActivity();
    
    // Auto refresh a cada 30 segundos
    const interval = setInterval(() => {
      loadStats();
      loadActivity();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${ADMIN_API_BASE}/stats`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      setStats(mapStats(json));
    } catch (e: any) {
      console.error('Erro ao carregar stats:', e);
      setError('Não foi possível carregar as estatísticas.');
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      const resp = await fetch(`${ADMIN_API_BASE}/recent-activity?limit=5`, {
        credentials: 'include' 
      });
      if (!resp.ok) return;
      const json = await resp.json();
      setActivity(Array.isArray(json?.data) ? json.data : json);
    } catch (e) {
      console.warn('Sem atividade ou endpoint indisponível');
    }
  };

  const quickActions = [
    {
      title: t('admin.dashboard.actions.createUser'),
      description: t('admin.dashboard.actions.createUserDesc'),
      icon: UserPlus,
      color: 'bg-blue-500',
      href: '/admin/master/users/new'
    },
    {
      title: t('admin.dashboard.actions.manageUsers'),
      description: t('admin.dashboard.actions.manageUsersDesc'),
      icon: Users,
      color: 'bg-green-500',
      href: '/admin/master/users'
    },
    {
      title: t('admin.dashboard.actions.manageRoles'),
      description: t('admin.dashboard.actions.manageRolesDesc'),
      icon: Shield,
      color: 'bg-purple-500',
      href: '/admin/master/roles'
    },
    {
      title: 'ObservaSUS',
      description: 'Recursos, DataStorage e publicações do observatório',
      icon: BarChart3,
      color: 'bg-cyan-600',
      href: '/admin/master/observasus'
    },
    // ✅ Chat de Suporte - APENAS para admin master (não admin hierárquico)
    ...(user?.roles?.includes('admin') ? [{
      title: 'Chat de Suporte',
      description: 'Gerenciar conversas e reportes de bugs',
      icon: MessageCircle,
      color: 'bg-indigo-500',
      href: '/admin/chat-suporte'
    }] : [])
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Cabeçalho customizado para admin */}
      <AdminHeader 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
        selectedLanguage={selectedLanguage}
      />

      {/* Conteúdo principal */}
      <main className="flex-1 px-3 sm:px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Título da página */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 truncate">
                  {t('admin.dashboard.title')}
                </h1>
                <p className="text-gray-600 truncate">
                  {interpolate(t('admin.dashboard.welcome'), { 
                    name: user?.name || user?.preferred_username || t('common.user') || 'Usuário' 
                  })}
                </p>
              </div>
              <button
                onClick={() => {
                  loadStats();
                  loadActivity();
                }}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors whitespace-nowrap"
                disabled={loading}
                title="Atualizar estatísticas"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-w-0">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    {t('admin.dashboard.stats.totalUsers')}
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                    {loading ? '...' : stats?.totalUsers || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-w-0">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    {t('admin.dashboard.stats.totalRoles')}
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                    {loading ? '...' : stats?.totalRoles || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-w-0">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    {t('admin.dashboard.stats.lastUpdate')}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                    {loading ? '...' : stats?.timestamp ? 
                      new Date(stats.timestamp).toLocaleString(selectedLanguage) : 
                      t('admin.dashboard.stats.never')
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 truncate">
              {t('admin.dashboard.quickActions')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {quickActions.map((action, index) => (
                <a
                  key={index}
                  href={action.href}
                  className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 sm:p-6 group min-w-0"
                >
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className={`${action.color} rounded-lg p-2 sm:p-3 group-hover:scale-110 transition-transform flex-shrink-0`}>
                      <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 truncate">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm overflow-hidden text-ellipsis" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {action.description}
                  </p>
                </a>
              ))}
            </div>
          </div>

          {/* Seção de atividades recentes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 truncate">
                {t('admin.dashboard.recentActivity')}
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {activity.length === 0 && (
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-lg text-xs sm:text-sm text-gray-500">
                    Sem atividades recentes.
                  </div>
                )}
                {activity.map(a => (
                  <div key={a.id} className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg min-w-0">
                    {a.type === 'userCreated' && <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />}
                    {a.type === 'roleAssigned' && <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-2 sm:mr-3 flex-shrink-0" />}
                    {a.type === 'userDisabled' && <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {t(`admin.dashboard.activity.${a.type}`)}
                        {a.who && <span className="text-gray-600"> - {a.who}</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {formatRelative(new Date(a.at), selectedLanguage || 'pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <Footer selectedLanguage={selectedLanguage} />
      
      {/* Menu lateral */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </div>
  );
};

export default AdminDashboard;
