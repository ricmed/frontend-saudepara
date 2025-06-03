import React, { useState, useEffect } from 'react';
import { useAuth } from '@/keycloak/AuthProvider';
import { useTranslation } from '@/i18n/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/features/desktop/components/Header';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { 
  Users, 
  UserPlus, 
  Shield, 
  BarChart3, 
  Activity,
  UserCheck,
  UserX,
  RefreshCw
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalRoles: number;
  recentEvents: number;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api-auth/admin/stats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: t('admin.dashboard.actions.createUser'),
      description: t('admin.dashboard.actions.createUserDesc'),
      icon: UserPlus,
      color: 'bg-blue-500',
      href: '/admin/users/new'
    },
    {
      title: t('admin.dashboard.actions.manageUsers'),
      description: t('admin.dashboard.actions.manageUsersDesc'),
      icon: Users,
      color: 'bg-green-500',
      href: '/admin/users'
    },
    {
      title: t('admin.dashboard.actions.manageRoles'),
      description: t('admin.dashboard.actions.manageRolesDesc'),
      icon: Shield,
      color: 'bg-purple-500',
      href: '/admin/roles'
    },
    {
      title: t('admin.dashboard.actions.viewReports'),
      description: t('admin.dashboard.actions.viewReportsDesc'),
      icon: BarChart3,
      color: 'bg-orange-500',
      href: '/admin/reports'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Cabeçalho */}
      <Header 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
        isMobile={false}
        selectedLanguage={selectedLanguage}
      />

      {/* Conteúdo principal */}
      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Título da página */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('admin.dashboard.title')}
            </h1>
            <p className="text-gray-600">
              {t('admin.dashboard.welcome', { name: user?.name || user?.preferred_username })}
            </p>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {t('admin.dashboard.stats.totalUsers')}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loading ? '...' : stats?.totalUsers || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {t('admin.dashboard.stats.totalRoles')}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loading ? '...' : stats?.totalRoles || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {t('admin.dashboard.stats.recentEvents')}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loading ? '...' : stats?.recentEvents || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <RefreshCw className="h-8 w-8 text-orange-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {t('admin.dashboard.stats.lastUpdate')}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
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
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {t('admin.dashboard.quickActions')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <a
                  key={index}
                  href={action.href}
                  className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 group"
                >
                  <div className="flex items-center mb-4">
                    <div className={`${action.color} rounded-lg p-3 group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {action.description}
                  </p>
                </a>
              ))}
            </div>
          </div>

          {/* Seção de atividades recentes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t('admin.dashboard.recentActivity')}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('admin.dashboard.activity.userCreated')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('admin.dashboard.activity.timeAgo', { time: '2 horas' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('admin.dashboard.activity.roleAssigned')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('admin.dashboard.activity.timeAgo', { time: '4 horas' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <UserX className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('admin.dashboard.activity.userDisabled')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('admin.dashboard.activity.timeAgo', { time: '1 dia' })}
                    </p>
                  </div>
                </div>
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
        selectedLanguage={selectedLanguage}
        onLanguageChange={() => {}}
      />
    </div>
  );
};

export default AdminDashboard;