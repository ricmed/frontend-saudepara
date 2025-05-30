import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/keycloak/AuthProvider';
import { useTranslation } from '@/i18n/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/features/desktop/components/Header';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';
import { LogOut } from 'lucide-react';

const LogoutConfirmation: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleConfirmLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCancel = () => {
    navigate(-1); // Volta para a página anterior
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Cabeçalho */}
      <Header 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
        isMobile={false}
        selectedLanguage={selectedLanguage}
      />

      {/* Conteúdo principal */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md sm:max-w-xl p-4 sm:p-8 bg-white rounded-2xl shadow-lg mx-2 flex flex-col items-center">
          <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mb-4 shadow">
            <LogOut size={48} className="text-blue-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-4 text-center">
            {t('logout.confirmation.title')}
          </h2>
          <p className="text-gray-600 mb-6 text-base sm:text-lg text-center">
            {t('logout.confirmation.message')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={handleConfirmLogout}
              className="bg-blue-600 text-white py-2 px-8 rounded-lg hover:bg-blue-800 transition text-base font-medium w-full"
            >
              {t('logout.confirmation.confirm')}
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-200 text-gray-700 py-2 px-8 rounded-lg hover:bg-gray-300 transition text-base font-medium w-full"
            >
              {t('logout.confirmation.cancel')}
            </button>
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <Footer selectedLanguage={selectedLanguage} />
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        selectedLanguage={selectedLanguage}
        onLanguageChange={() => {}}
      />
    </div>
  );
};

export default LogoutConfirmation;