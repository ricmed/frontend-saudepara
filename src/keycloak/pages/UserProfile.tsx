import { useAuth } from '../AuthProvider';
import { Header } from '../../features/desktop/components/Header';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { useState } from 'react';
import { User as UserIcon, Mail, UserPlus } from 'lucide-react';

const UserProfile = () => {
  const { user, logout, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Helpers para lidar com diferentes possíveis nomes de campos
  const firstName = user?.firstName || user?.given_name || '';
  const lastName = user?.lastName || user?.family_name || '';
  const username = user?.username || user?.preferred_username || '';
  const email = user?.email || '';
  const name = user?.name || `${firstName} ${lastName}`.trim();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded shadow text-center">
          <p className="mb-4">Você precisa estar logado para ver o perfil.</p>
          <a href="/login" className="text-blue-600 underline">Ir para login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Cabeçalho */}
      <Header 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
        isMobile={false}
        selectedLanguage={'pt-BR'}
      />

      {/* Conteúdo principal */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md sm:max-w-xl p-4 sm:p-8 bg-white rounded-2xl shadow-lg mx-2 flex flex-col items-center">
          <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mb-4 shadow">
            <UserIcon size={48} className="text-blue-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 break-words">
            {name}
          </h2>
          <p className="text-gray-600 mb-2 text-base sm:text-lg">
            <span className="font-semibold">Nome:</span> {firstName}
          </p>
          <p className="text-gray-600 mb-2 text-base sm:text-lg">
            <span className="font-semibold">Sobrenome:</span> {lastName}
          </p>
          <div className="flex items-center gap-2 text-gray-700 mb-2">
            <UserPlus size={18} className="text-blue-500" />
            <span className="font-semibold">Username:</span>
            <span className="break-all">{username}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 mb-2">
            <Mail size={18} className="text-blue-500" />
            <span className="font-semibold">E-mail:</span>
            <span className="break-all">{email}</span>
          </div>
          {user.roles && (
            <div className="mb-2 text-gray-700 text-sm">
              <span className="font-semibold">Roles:</span> {user.roles.join(', ')}
            </div>
          )}
          {user.groups && (
            <div className="mb-2 text-gray-700 text-sm">
              <span className="font-semibold">Grupos:</span> {user.groups.join(', ')}
            </div>
          )}
          <button
            onClick={logout}
            className="mt-6 bg-blue-600 text-white py-2 px-8 rounded-lg hover:bg-blue-800 transition text-base font-medium w-full sm:w-auto"
          >
            Sair da Conta
          </button>
        </div>
      </main>

      {/* Rodapé */}
      <Footer selectedLanguage={'pt-BR'} />
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        selectedLanguage={'pt-BR'}
        onLanguageChange={() => {}}
      />
    </div>
  );
};

export default UserProfile;
