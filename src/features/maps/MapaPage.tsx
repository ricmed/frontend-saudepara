import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Componentes do layout
import Header from '@/features/desktop/components/Header';
import { CustomHeader } from '@/features/desktop/components/CustomHeader';
import Footer from '@/features/desktop/components/Footer';
import { SideMenu } from '@/features/home/components/SideMenu';

// Componente do mapa
import MapaLocais from '@/features/maps/google';
import { useMapaFilters } from './hooks/useMapaFilters';

interface MapaPageProps {
  // Props opcionais para configuração
  showHeader?: boolean;
  showFooter?: boolean;
  fullScreen?: boolean;
}

const MapaPage: React.FC<MapaPageProps> = ({ 
  showHeader = true, 
  showFooter = true,
  fullScreen = false 
}) => {
  // Estados e hooks
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const filters = useMapaFilters();

  // Pega parâmetros da URL (tipo de estabelecimento, etc.)
  const tipoFiltro = searchParams.get('tipo');

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Se for fullScreen, renderiza apenas o mapa
  if (fullScreen) {
    return (
      <div className="w-full h-screen relative">
        {/* Botão de voltar flutuante */}
        <button
          onClick={handleGoBack}
          className="absolute top-4 left-4 z-50 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        
        <MapaLocais />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Responsivo */}
      {showHeader && (
        <>
          {/* Header Mobile */}
          <div className="md:hidden">
            <div className="bg-blue-600">
              <CustomHeader 
                onMenuToggle={handleMenuToggle} 
                selectedLanguage={selectedLanguage} 
              />
            </div>
          </div>
          
          {/* Header Desktop */}
          <div className="hidden md:block">
            <Header 
              onMenuToggle={handleMenuToggle} 
              isMobile={false} 
              selectedLanguage={selectedLanguage} 
            />
          </div>
        </>
      )}

      {/* Barra de navegação do mapa */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleGoBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            
            <div className="h-6 w-px bg-gray-300"></div>
            
            <h1 className="text-lg font-semibold text-gray-900">
              {tipoFiltro ? `Mapa - ${tipoFiltro}` : 'Localizar Estabelecimentos'}
            </h1>
          </div>
          
          {/* Botão para tela cheia */}
          <button
            onClick={() => navigate(`/mapa/fullscreen${window.location.search}`)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Tela Cheia
          </button>
        </div>
      </div>

      {/* Container do Mapa */}
      <div className="relative">
        {/* Mapa com altura responsiva */}
        <div 
          className="w-full"
          style={{ 
            height: showFooter ? 'calc(100vh - 200px)' : 'calc(100vh - 120px)',
            minHeight: '500px'
          }}
        >
          <MapaLocais initialFilters={filters} />
        </div>
      </div>

      {/* Footer (apenas desktop) */}
      {showFooter && (
        <div className="hidden md:block">
          <Footer selectedLanguage={selectedLanguage} />
        </div>
      )}

      {/* Menu Lateral */}
      <SideMenu 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />
    </div>
  );
};

export default MapaPage;
