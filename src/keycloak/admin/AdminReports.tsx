import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/features/desktop/components/Header';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { 
  BarChart3, 
  Users, 
  Shield, 
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Clock,
  UserCheck,
  UserX,
  Mail
} from 'lucide-react';
import { useAdminStats, useUsers, useRoles } from '@/keycloak/admin/hooks/useAdminApi';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface TimeSeriesData {
  date: string;
  users: number;
  logins: number;
}

const AdminReports: React.FC = () => {
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [userStats, setUserStats] = useState<ChartData[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const statsApi = useAdminStats();
  const usersApi = useUsers();
  const rolesApi = useRoles();

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas básicas
      const statsData = await statsApi.getStats();
      setStats(statsData);

      // Carregar dados de usuários
      const usersData = await usersApi.listUsers({ max: 1000 });
      
      // Processar estatísticas de usuários
      const enabledUsers = usersData.filter((u: any) => u.enabled).length;
      const disabledUsers = usersData.filter((u: any) => !u.enabled).length;
      const verifiedUsers = usersData.filter((u: any) => u.emailVerified).length;
      const unverifiedUsers = usersData.filter((u: any) => !u.emailVerified).length;

      setUserStats([
        { name: t('admin.reports.enabledUsers'), value: enabledUsers, color: '#10B981' },
        { name: t('admin.reports.disabledUsers'), value: disabledUsers, color: '#EF4444' },
        { name: t('admin.reports.verifiedUsers'), value: verifiedUsers, color: '#3B82F6' },
        { name: t('admin.reports.unverifiedUsers'), value: unverifiedUsers, color: '#F59E0B' },
      ]);

      // Simular atividade recente (em produção, isso viria de um endpoint específico)
      setRecentActivity([
        {
          id: 1,
          type: 'user_created',
          description: 'Novo usuário criado',
          user: 'João Silva',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          icon: UserCheck,
          color: 'text-green-600'
        },
        {
          id: 2,
          type: 'user_login',
          description: 'Login realizado',
          user: 'Maria Santos',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          icon: Activity,
          color: 'text-blue-600'
        },
        {
          id: 3,
          type: 'user_disabled',
          description: 'Usuário desabilitado',
          user: 'Pedro Costa',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          icon: UserX,
          color: 'text-red-600'
        },
        {
          id: 4,
          type: 'password_reset',
          description: 'Senha redefinida',
          user: 'Ana Lima',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          icon: Mail,
          color: 'text-orange-600'
        },
      ]);

    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Implementar exportação de dados
    console.log('Exportando dados...');
  };

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return t('admin.reports.last7Days');
      case '30d': return t('admin.reports.last30Days');
      case '90d': return t('admin.reports.last90Days');
      case '1y': return t('admin.reports.lastYear');
      default: return t('admin.reports.last7Days');
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return t('admin.reports.justNow');
    } else if (diffInHours < 24) {
      return t('admin.reports.hoursAgo', { hours: String(diffInHours) });
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return t('admin.reports.daysAgo', { days: String(diffInDays) });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header 
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
          isMobile={false}
          selectedLanguage={selectedLanguage}
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('admin.reports.loading')}</p>
          </div>
        </main>
        <Footer selectedLanguage={selectedLanguage} />
      </div>
    );
  }

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
          {/* Título e controles */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('admin.reports.title')}
              </h1>
              <p className="text-gray-600">
                {t('admin.reports.subtitle')}
              </p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">{t('admin.reports.last7Days')}</option>
                <option value="30d">{t('admin.reports.last30Days')}</option>
                <option value="90d">{t('admin.reports.last90Days')}</option>
                <option value="1y">{t('admin.reports.lastYear')}</option>
              </select>
              <button
                onClick={loadReportData}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('admin.reports.refresh')}
              </button>
              <button
                onClick={exportData}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('admin.reports.export')}
              </button>
            </div>
          </div>

          {/* Cards de estatísticas principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {t('admin.reports.totalUsers')}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalUsers || 0}
                  </p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+12%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserCheck className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {t('admin.reports.activeUsers')}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {userStats.find(s => s.name === t('admin.reports.enabledUsers'))?.value || 0}
                  </p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+8%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-8 w-8 text-purple-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {t('admin.reports.totalRoles')}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalRoles || 0}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-gray-600">
                      {t('admin.reports.unchanged')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-8 w-8 text-orange-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {t('admin.reports.recentActivity')}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {recentActivity.length}
                  </p>
                  <div className="flex items-center mt-1">
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600">-5%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos e tabelas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Distribuição de usuários */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('admin.reports.userDistribution')}
              </h2>
              <div className="space-y-4">
                {userStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded mr-3" 
                        style={{ backgroundColor: stat.color }}
                      ></div>
                      <span className="text-sm text-gray-700">{stat.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-2">
                        {stat.value}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({((stat.value / (stats.totalUsers || 1)) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Atividade por período */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('admin.reports.activityTrend')}
              </h2>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('admin.reports.chartPlaceholder')}</p>
                <p className="text-sm mt-2">
                  {t('admin.reports.implementChart')}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de atividades recentes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('admin.reports.recentActivities')}
              </h2>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start p-4 bg-gray-50 rounded-lg">
                    <div className={`flex-shrink-0 p-2 rounded-lg ${
                      activity.color === 'text-green-600' ? 'bg-green-100' :
                      activity.color === 'text-blue-600' ? 'bg-blue-100' :
                      activity.color === 'text-red-600' ? 'bg-red-100' :
                      'bg-orange-100'
                    } mr-4`}>
                      <activity.icon className={`h-5 w-5 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {activity.description}
                          </p>
                          <p className="text-sm text-gray-600">
                            {t('admin.reports.user')}: {activity.user}
                          </p>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatRelativeTime(activity.timestamp)}
                        </div>
                      </div>
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
        selectedLanguage={selectedLanguage}
        onLanguageChange={() => {}}
      />
    </div>
  );
};

export default AdminReports;