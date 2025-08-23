import React, { useState } from 'react';
import { Local } from '../types';

interface NavigationMenuProps {
  local: Local;
  className?: string;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ 
  local, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const abrirNoGoogleMaps = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${local.lat},${local.lng}&destination_place_id=${encodeURIComponent(local.nome)}`;
    
    if (isMobile) {
      window.open(url, '_system');
    } else {
      window.open(url, '_blank');
    }
    setIsOpen(false);
  };

  const abrirNoWaze = () => {
    const url = `https://waze.com/ul?ll=${local.lat},${local.lng}&navigate=yes&zoom=17`;
    window.open(url, '_blank');
    setIsOpen(false);
  };

  const abrirNoAppleMaps = () => {
    const url = `http://maps.apple.com/?daddr=${local.lat},${local.lng}&dirflg=d`;
    window.open(url, '_blank');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botão principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        Navegar
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <>
          {/* Overlay para fechar */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Lista de aplicativos */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
            {/* Google Maps */}
            <button
              onClick={abrirNoGoogleMaps}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="w-6 h-6 flex-shrink-0">
                {/* Ícone oficial do Google Maps */}
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path fill="#4285F4" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle fill="#fff" cx="12" cy="9" r="2.5"/>
                  <path fill="#EA4335" d="M12 14l-7-13h14l-7 13z" opacity="0.3"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Google Maps</div>
                <div className="text-xs text-gray-500">Navegação completa</div>
              </div>
            </button>

            {/* Waze */}
            <button
              onClick={abrirNoWaze}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="w-6 h-6 flex-shrink-0">
                {/* Ícone oficial do Waze */}
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path fill="#00D8FF" d="M8.5 12.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5-.7-1.5-1.5-1.5-1.5.7-1.5 1.5z"/>
                  <path fill="#00D8FF" d="M14 12.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5-.7-1.5-1.5-1.5-1.5.7-1.5 1.5z"/>
                  <path fill="#00D8FF" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.12.23-2.18.65-3.15C5.87 7.24 7.5 6.5 9.5 6.5c1.2 0 2.3.4 3.2 1.1.4-.1.8-.1 1.3-.1 2 0 3.63.74 4.85 2.35.42.97.65 2.03.65 3.15 0 4.41-3.59 8-8 8z"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Waze</div>
                <div className="text-xs text-gray-500">Trânsito em tempo real</div>
              </div>
            </button>

            {/* Apple Maps */}
            <button
              onClick={abrirNoAppleMaps}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="w-6 h-6 flex-shrink-0">
                {/* Ícone oficial do Apple Maps */}
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path fill="#007AFF" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  <circle fill="#fff" cx="12" cy="9" r="1.5"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Apple Maps</div>
                <div className="text-xs text-gray-500">Integração iOS</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
