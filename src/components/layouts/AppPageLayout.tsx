import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ArrowLeft } from 'lucide-react';
import { SideMenu } from '@/features/home/components/SideMenu';
import { BottomNavigation } from '@/features/home/components/BottomNavigation';
import Footer from '@/features/desktop/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

interface AppPageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  showBackButton?: boolean;
  backPath?: string; // 🆕 Caminho customizado para o botão voltar
  showBottomNav?: boolean;
  currentTab?: string;
  variant?: 'mobile' | 'desktop'; // 🆕 Novo prop para escolher variante
  /** Largura do conteúdo em desktop (ex.: listagens com muitas colunas). */
  contentWidth?: 'default' | 'wide';
}

/**
 * Layout padrão do app Saúde Pará
 * Inclui: Header azul, Side Menu, Footer azul e Bottom Navigation
 * 
 * @param variant - 'mobile': Layout mobile com largura limitada | 'desktop': Layout full-width para admin
 */
export const AppPageLayout: React.FC<AppPageLayoutProps> = ({
  children,
  title,
  subtitle,
  icon,
  headerActions,
  showBackButton = true,
  backPath,
  showBottomNav = true,
  currentTab = 'inicio',
  variant = 'mobile', // 🆕 Default: mobile
  contentWidth = 'default',
}) => {
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(currentTab);

  const desktopContentMax =
    contentWidth === 'wide' ? 'max-w-[min(1920px,98vw)] w-full mx-auto' : 'max-w-7xl mx-auto';
  const desktopPad =
    contentWidth === 'wide' ? 'px-3 sm:px-4 lg:px-6 xl:px-8' : 'px-4 sm:px-6 lg:px-8';

  const handleGoBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  // 🆕 Classes dinâmicas baseadas na variante
  const containerClasses = variant === 'mobile'
    ? 'w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto relative bg-gray-50 min-h-screen'
    : 'w-full min-h-screen bg-gray-50';

  const headerContainerClasses = variant === 'mobile'
    ? 'px-4 py-4 sm:py-6'
    : `${desktopContentMax} ${desktopPad} py-4 sm:py-6`;

  const mainContainerClasses = variant === 'mobile'
    ? 'px-4 py-4 sm:py-6'
    : `${desktopContentMax} ${desktopPad} py-6 sm:py-8 pb-24 sm:pb-32`;

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Container responsivo ou full-width */}
      <div className={containerClasses}>
        <div className="h-full relative">
          <div className={`min-h-screen overflow-y-auto ${showBottomNav && variant === 'mobile' ? 'pb-20' : ''}`}>
            {/* Header Azul */}
            <header className="bg-blue-600 text-white shadow-lg">
              <div className={headerContainerClasses}>
                <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    {/* Botão Menu Sanduíche */}
                    <button
                      onClick={() => setIsMenuOpen(true)}
                      className="p-2 hover:bg-blue-700 rounded-full transition-colors flex-shrink-0"
                      aria-label="Abrir menu"
                    >
                      <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>

                    {/* Botão Voltar */}
                    {showBackButton && (
                      <button
                        onClick={handleGoBack}
                        className="p-2 hover:bg-blue-700 rounded-full transition-colors flex-shrink-0"
                        aria-label="Voltar"
                      >
                        <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                    )}

                    {/* Título e Ícone */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      {icon && <div className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">{icon}</div>}
                      <div className="min-w-0 flex-1">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">{title}</h1>
                        {subtitle && (
                          <p className="text-blue-100 text-xs sm:text-sm truncate">{subtitle}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações do Header */}
                  {headerActions && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {headerActions}
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Conteúdo Principal */}
            <main className={mainContainerClasses}>
              {children}
            </main>

            {/* Footer - Apenas em desktop */}
            {variant === 'desktop' && <Footer selectedLanguage={selectedLanguage} />}
          </div>

          {/* Bottom Navigation - Apenas em mobile */}
          {showBottomNav && variant === 'mobile' && (
            <BottomNavigation 
              currentTab={activeTab}
              onTabChange={setActiveTab}
            />
          )}

          {/* Side Menu */}
          <SideMenu 
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};
