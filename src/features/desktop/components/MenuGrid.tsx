import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Heart, Book, MessageCircle, FileText, Plus } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslations';
import { Language } from '@/i18n/types';
import { useSaireHomeCta } from '@/features/home/hooks/useSaireHomeCta';
import { BotoRosaIcon } from '@/features/home/components/BotoRosaIcon';
import { SaireLogoWatermark } from '@/features/home/components/SaireLogo';
import { buildNovaComunicacaoSairePath } from '@/features/notificationForms/utils/saireEventPrefill';

interface MenuGridProps {
  isMobile?: boolean;
  selectedLanguage?: Language;
}

export const MenuGrid: React.FC<MenuGridProps> = ({
  isMobile = true,
  selectedLanguage,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation(selectedLanguage || 'pt-BR');
  const { showSaireCaseButton, canAccessComunicacaoDae, saireEventId } =
    useSaireHomeCta();

  const menuItems = [
    {
      icon: (
        <Building
          className={`${isMobile ? 'h-6 w-6' : 'h-10 w-10'} text-[var(--sp-accent)] mb-${isMobile ? '2' : '3'}`}
        />
      ),
      label: 'menu.locations',
      onClick: () => navigate('/mapa'),
    },
    {
      icon: (
        <Heart
          className={`${isMobile ? 'h-6 w-6' : 'h-10 w-10'} text-[var(--sp-accent)] mb-${isMobile ? '2' : '3'}`}
        />
      ),
      label: 'menu.campaigns',
      onClick: () => navigate('/campanhas'),
    },
    {
      icon: (
        <Book
          className={`${isMobile ? 'h-6 w-6' : 'h-10 w-10'} text-[var(--sp-accent)] mb-${isMobile ? '2' : '3'}`}
        />
      ),
      label: 'menu.materials',
      onClick: () => navigate('/materiais-educativos'),
    },
    {
      icon: (
        <MessageCircle
          className={`${isMobile ? 'h-6 w-6' : 'h-10 w-10'} text-[var(--sp-accent)] mb-${isMobile ? '2' : '3'}`}
        />
      ),
      label: 'menu.fale_conosco',
      onClick: () => navigate('/fale-conosco'),
    },
  ];

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-t-3xl">
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={item.onClick}
            className="bg-white flex flex-col items-center p-6 rounded-xl shadow-sm cursor-pointer"
          >
            {item.icon}
            <span className="text-sm font-medium">{t(item.label)}</span>
          </div>
        ))}
      </div>
    );
  }

  const showQuickActions = showSaireCaseButton || canAccessComunicacaoDae;

  return (
    <div className="py-12 max-w-6xl mx-auto px-6">
      {showQuickActions && (
        <div className="mb-8 flex flex-wrap justify-center gap-4">
          {showSaireCaseButton && (
            <div
              onClick={() =>
                navigate(buildNovaComunicacaoSairePath(saireEventId))
              }
              className="relative overflow-hidden bg-[#ff4d94] hover:bg-gradient-to-r hover:from-[#ff4d94] hover:to-[#656B6F] text-white flex flex-col items-center p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 min-w-[220px] max-w-[280px]"
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(buildNovaComunicacaoSairePath(saireEventId));
                }
              }}
            >
              <SaireLogoWatermark />
              <div className="relative z-10 mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 p-2 shadow-inner">
                <BotoRosaIcon className="h-10 w-10" />
              </div>
              <span className="relative z-10 text-lg font-semibold mb-1 text-center leading-tight">
                {t('menu.reportSaireCase')}
              </span>
              <span className="relative z-10 text-xs text-white/90 text-center">
                {t('menu.reportSaireCaseDesc')}
              </span>
            </div>
          )}

          {canAccessComunicacaoDae && (
            <div
              onClick={() => navigate('/private/comunicacao-dae/nova')}
              className="bg-blue-600 hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-800 text-white flex flex-col items-center p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 min-w-[220px]"
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate('/private/comunicacao-dae/nova');
                }
              }}
            >
              <div className="mb-3 relative">
                <FileText className="h-10 w-10 text-white" />
                <Plus className="h-4 w-4 text-white absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5" />
              </div>
              <span className="text-lg font-semibold mb-1">{t('menu.reportDAE')}</span>
              <span className="text-xs text-blue-100 text-center">
                {t('menu.reportDAEDesc')}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={item.onClick}
            className="bg-white flex flex-col items-center p-8 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
          >
            {item.icon}
            <span className="text-lg font-medium">{t(item.label)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuGrid;
