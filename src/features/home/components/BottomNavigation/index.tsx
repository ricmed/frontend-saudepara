import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/keycloak/AuthProvider';
import { Home, Map, Heart, User } from 'lucide-react';
import { Language } from '@/i18n/types';
import { useSaireHomeCta } from '@/features/home/hooks/useSaireHomeCta';
import { HomeFabSpeedDial } from '@/features/home/components/HomeFabSpeedDial';

interface BottomNavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  selectedLanguage?: Language;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onTabChange,
  selectedLanguage: propSelectedLanguage,
}) => {
  const navigate = useNavigate();
  const { selectedLanguage: contextLanguage } = useLanguage();
  const selectedLanguage = propSelectedLanguage || contextLanguage;
  const { t } = useTranslation(selectedLanguage);
  const { user } = useAuth();
  const { showSaireCaseButton, canAccessComunicacaoDae } = useSaireHomeCta();

  // Mantém compatibilidade se o hook ainda estiver carregando / usuário sem unidade.
  const canAccessDaeFallback = !!user?.roles?.some((role: string) =>
    ['comunicacao.dae', 'admin', 'admin.estado', 'admin.crs'].includes(role),
  );
  const showDae = canAccessComunicacaoDae || canAccessDaeFallback;

  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 overflow-visible">
      <div className="flex items-center h-16 relative px-2 overflow-visible">
        <div className="flex-1 flex justify-around items-center">
          <button
            type="button"
            className="flex flex-col items-center"
            onClick={() => {
              onTabChange('inicio');
              navigate('/');
            }}
          >
            <Home
              className={`w-6 h-6 ${
                currentTab === 'inicio' ? 'text-blue-600' : 'text-gray-400'
              }`}
            />
            <span
              className={`text-xs ${
                currentTab === 'inicio' ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {t('nav.home')}
            </span>
          </button>

          <button
            type="button"
            className="flex flex-col items-center"
            onClick={() => {
              onTabChange('mapa');
              navigate('/mapa');
            }}
          >
            <Map
              className={`w-6 h-6 ${
                currentTab === 'mapa' ? 'text-blue-600' : 'text-gray-400'
              }`}
            />
            <span
              className={`text-xs ${
                currentTab === 'mapa' ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {t('nav.map')}
            </span>
          </button>
        </div>

        <HomeFabSpeedDial
          showSaire={showSaireCaseButton}
          showDae={showDae}
          saireLabel={t('menu.reportSaireCase')}
          daeLabel={t('menu.reportDAE')}
          onSaireClick={() => navigate('/private/comunicacao-de-caso/nova')}
          onDaeClick={() => navigate('/private/comunicacao-dae/nova')}
        />

        <div className="flex-1 flex justify-around items-center">
          <button
            type="button"
            className="flex flex-col items-center"
            onClick={() => {
              onTabChange('campanhas');
              navigate('/campanhas');
            }}
          >
            <Heart
              className={`w-6 h-6 ${
                currentTab === 'campanhas' ? 'text-blue-600' : 'text-gray-400'
              }`}
            />
            <span
              className={`text-xs ${
                currentTab === 'campanhas' ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {t('nav.campaigns')}
            </span>
          </button>

          <button
            type="button"
            className="flex flex-col items-center"
            onClick={() => {
              onTabChange('login');
              navigate('/login');
            }}
          >
            <User
              className={`w-6 h-6 ${
                currentTab === 'login' ? 'text-blue-600' : 'text-gray-400'
              }`}
            />
            <span
              className={`text-xs ${
                currentTab === 'login' ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {t('nav.entrar')}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
