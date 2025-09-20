import React, { useState, useEffect } from 'react';
import { useAuth } from '@/keycloak/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminHeader } from './components/AdminHeader';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { 
  Users, 
  UserPlus, 
  RefreshCw,
  MapPin
} from 'lucide-react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { usuarioGestaoService } from '@/services/UsuarioGestaoService';

interface AdminStats {
  total: number;
  timestamp: string;
}

const DashboardMunicipio: React.FC = () => {
  const { user } = useAuth();
  const { selectedLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    total: 0,
    timestamp: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hook para permissões do usuário atual
  const userPermissions = useUserPermissions();

  // Função otimizada para buscar contagens por município
  const loadUserCounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (userPermissions.municipioId) {
        console.log(`📊 Carregando contagens para município ${userPermissions.municipioId}...`);
        
        // Usar novo método otimizado do service
        const contagens = await usuarioGestaoService.getContagensUsuariosPorMunicipio(userPermissions.municipioId);
        
        setStats({
          total: contagens.total,
          timestamp: new Date().toISOString()
        });
        
        console.log('✅ Contagens carregadas:', contagens);
      } else {
        // Fallback: usuário sem municipioId
        setStats({
          total: 0,
          timestamp: new Date().toISOString()
        });
        console.warn('⚠️ Usuário não possui municipioId definido');
      }
      
    } catch (err: any) {
      console.error('Erro ao carregar contagens de usuários:', err);
      setError('Não foi possível carregar as contagens de usuários');
      
      // Em caso de erro, manter os valores zerados
      setStats({
        total: 0,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para interpolação de strings de tradução
  const interpolate = (s?: string, vars: Record<string, string> = {}) =>
    (s || '').replace(/\{\{?(\w+)\}?\}/g, (_, k) => vars[k] ?? '');

  // Carregar contagens na inicialização
  useEffect(() => {
    loadUserCounts();
  }, [userPermissions.municipioId]); // Recarregar quando municipioId mudar

  // Auto refresh a cada 2 minutos (menos frequente para evitar sobrecarga)
  useEffect(() => {
    const interval = setInterval(() => {
      loadUserCounts();
    }, 120000); // 2 minutos
    return () => clearInterval(interval);
  }, [userPermissions.municipioId]);

  // Ações limitadas para admin.municipio
  const quickActions = [
    {
      title: 'Criar Usuário',
      description: 'Adicionar um novo usuário notificador ao município',
      icon: UserPlus,
      color: 'bg-blue-500',
      href: '/admin/municipio/users/new'
    },
    {
      title: 'Gerenciar Usuários',
      description: 'Visualizar e editar usuários do município',
      icon: Users,
      color: 'bg-green-500',
      href: '/admin/municipio/users'
    }
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
                  Painel Administrativo - Município
                </h1>
                <p className="text-gray-600 truncate">
                  {interpolate('Bem-vindo, {{name}} - Administração de Município', { 
                    name: user?.name || user?.preferred_username || 'Usuário' 
                  })}
                </p>
                {userPermissions.municipioId && (
                  <p className="text-sm text-blue-600 mt-1">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Município ID: {userPermissions.municipioId}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  loadUserCounts();
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

          {/* Cards de estatísticas simples */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Total de usuários */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-w-0">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    Total de Usuários do Município
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                    {loading ? '...' : stats.total}
                  </p>
                </div>
              </div>
            </div>

            {/* Última atualização */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-w-0">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    Última Atualização
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                    {loading ? '...' : stats.timestamp ? 
                      new Date(stats.timestamp).toLocaleString(selectedLanguage) : 
                      'Nunca'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 truncate">
              Ações Rápidas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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

export default DashboardMunicipio;