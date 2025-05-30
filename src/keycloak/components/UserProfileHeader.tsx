import React, { useState } from 'react';
import { useAuth } from '@/keycloak/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, User } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslations';
import { Language } from '@/i18n/types';

interface UserProfileHeaderProps {
  selectedLanguage: Language;
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ selectedLanguage }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(selectedLanguage);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

  // Fallback para dados do usuário
  const firstName = user?.firstName || user?.given_name || '';
  const lastName = user?.lastName || user?.family_name || '';
  const email = user?.email || '';
  const name = user?.name || `${firstName} ${lastName}`.trim();

  // Obter iniciais do usuário
  const getInitials = () => {
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return initials || email.charAt(0).toUpperCase() || 'U';
  };

  // Caso o usuário não esteja logado
  if (!user) {
    return (
      <div
        className="flex items-center gap-3 p-4 bg-blue-800 hover:bg-blue-700 cursor-pointer rounded-lg transition-colors"
        onClick={() => navigate('/login')}
      >
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full text-blue-600 font-bold text-lg">
          <User className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-white text-sm font-semibold">{t('menu.login')}</p>
        </div>
      </div>
    );
  }

  // Caso o usuário esteja logado
  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsSubmenuOpen(true)}
      onMouseLeave={() => setIsSubmenuOpen(false)}
    >
      {/* Cabeçalho do Perfil do Usuário */}
      <div
        className="flex items-center gap-3 p-4 bg-blue-800 hover:bg-blue-700 cursor-pointer rounded-lg transition-colors"
      >
        {/* Círculo com Iniciais */}
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full text-blue-600 font-bold text-lg">
          {getInitials()}
        </div>
        {/* Informações do Usuário */}
        <div className="flex-1">
          <p className="text-white text-sm font-semibold truncate">{name || 'Usuário'}</p>
          <p className="text-blue-300 text-xs truncate">{email || 'email'}</p>
        </div>
        {/* Ícone de Chevron */}
        <ChevronRight className="h-4 w-4 text-white" />
      </div>

      {/* Submenu */}
      {isSubmenuOpen && (
        <div className="fixed top-0 left-64 w-64 bg-blue-900 z-60">
          <div className="p-4 flex items-center h-[70px] border-b border-blue-800">
            <h2 className="text-xl font-bold text-white">
              {t('menu.profile')}
            </h2>
          </div>
          <button
            className="flex items-center w-full gap-3 p-3 text-white hover:bg-blue-800 transition-colors text-sm"
            onClick={() => {
              navigate('/perfil');
              setIsSubmenuOpen(false);
            }}
          >
            <User className="h-5 w-5 text-white" />
            <span>{t('menu.profile')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileHeader;