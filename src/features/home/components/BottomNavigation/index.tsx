import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/keycloak/AuthProvider';
import { Home, Map, Heart, User, FileText } from 'lucide-react';
import { Language } from '@/i18n/types';

interface BottomNavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  selectedLanguage?: Language;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onTabChange,
  selectedLanguage: propSelectedLanguage
}) => {
  const navigate = useNavigate();
  const { selectedLanguage: contextLanguage } = useLanguage(); // Pegando a linguagem do contexto
  const selectedLanguage = propSelectedLanguage || contextLanguage; // Use prop if provided, otherwise use context
  const { t } = useTranslation(selectedLanguage); // Passando a linguagem para o hook
  const { user } = useAuth();

  const canAccessComunicacaoDae = !!user?.roles?.some((role: string) =>
    ['comunicacao.dae', 'admin', 'admin.estado', 'admin.crs'].includes(role)
  );

  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100">
      <div className="flex items-center h-16 relative px-2">
        <div className="flex-1 flex justify-around items-center">
          <button
            className="flex flex-col items-center"
            onClick={() => {
              onTabChange("inicio");
              navigate("/");
            }}
          >
            <Home
              className={`w-6 h-6 ${
                currentTab === "inicio" ? "text-blue-600" : "text-gray-400"
              }`}
            />
            <span
              className={`text-xs ${
                currentTab === "inicio" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              {t("nav.home")}
            </span>
          </button>
          
          <button
            className="flex flex-col items-center"
            onClick={() => {
              onTabChange("mapa");
              navigate("/mapa");
            }}
          >
            <Map
              className={`w-6 h-6 ${
                currentTab === "mapa" ? "text-blue-600" : "text-gray-400"
              }`}
            />
            <span
              className={`text-xs ${
                currentTab === "mapa" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              {t("nav.map")}
            </span>
          </button>
        </div>

        {/* FAB Button - Comunicar DAE */}
        <div className="w-12"></div>
        {canAccessComunicacaoDae && (
          <button 
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-blue-600 rounded-full flex flex-col items-center justify-center shadow-lg"
            onClick={() => {
              navigate("/private/comunicacao-dae/nova");
            }}
            title="Comunicar DAE"
          >
            <FileText className="w-6 h-6 text-white" />
          </button>
        )}

        <div className="flex-1 flex justify-around items-center">
          <button
            className="flex flex-col items-center"
            onClick={() => {
              onTabChange("campanhas");
              navigate("/campanhas");
            }}
          >
            <Heart
              className={`w-6 h-6 ${
                currentTab === "campanhas" ? "text-blue-600" : "text-gray-400"
              }`}
            />
            <span
              className={`text-xs ${
                currentTab === "campanhas" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              {t("nav.campaigns")}
            </span>
          </button>

          <button
            className="flex flex-col items-center"
            onClick={() => {
              onTabChange("login");
              navigate("/login");
            }}
          >
            <User
              className={`w-6 h-6 ${
                currentTab === "login" ? "text-blue-600" : "text-gray-400"
              }`}
            />
            <span
              className={`text-xs ${
                currentTab === "login" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              {t("nav.entrar")}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;