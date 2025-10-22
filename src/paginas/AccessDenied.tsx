import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/i18n/types';
import { SideMenu } from '@/features/home/components/SideMenu';
import { Header } from '../features/desktop/components/Header';
import Footer from '@/features/desktop/components/Footer';
import { useTranslation } from '@/i18n/useTranslations';

const MobileAccessDenied = ({ 
  onMenuToggle, 
  handleLogout,
  selectedLanguage
}: { 
  onMenuToggle: () => void, 
  handleLogout: () => void,
  selectedLanguage: Language
}) => {
  const { t } = useTranslation(selectedLanguage);
  
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Header 
        onMenuToggle={onMenuToggle} 
        isMobile={true} 
        selectedLanguage={selectedLanguage} 
      />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-blue-900 mb-4">{t('accessDenied.title')}</h1>
          <p className="text-gray-600 mb-6">{t('accessDenied.message')}</p>
          <div className="flex flex-col gap-3">
            <Link to="/" className="bg-blue-900 text-white py-2 px-4 rounded hover:bg-blue-800 transition">
              {t('accessDenied.button')}
            </Link>
            <button 
              onClick={handleLogout} 
              className="bg-blue-900 text-white py-2 px-4 rounded hover:bg-blue-800 transition"
            >
              Fazer Logout
            </button>
          </div>
        </div>
      </main>

      <Footer selectedLanguage={selectedLanguage} />
    </div>
  );
};

const DesktopAccessDenied = ({ 
  onMenuToggle, 
  selectedLanguage,
  handleLogout
}: { 
  onMenuToggle: () => void, 
  selectedLanguage: Language,
  handleLogout: () => void
}) => {
  const { t } = useTranslation(selectedLanguage);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header 
        onMenuToggle={onMenuToggle} 
        isMobile={false} 
        selectedLanguage={selectedLanguage} 
      />

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg p-10 max-w-lg w-full text-center">
          <div className="bg-red-100 text-red-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-blue-600 mb-4">{t('accessDenied.title')}</h1>
          <p className="text-gray-600 mb-8 text-lg">{t('accessDenied.message')}</p>
          <div className="flex justify-center gap-4">
            <Link to="/" className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-800 transition">
              {t('accessDenied.button')}
            </Link>
            <button 
              onClick={handleLogout} 
              className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-800 transition"
            >
              Fazer Logout
            </button>
          </div>
        </div>
      </main>

      <Footer selectedLanguage={selectedLanguage} />
    </div>
  );
};

const AccessDenied: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { selectedLanguage } = useLanguage();

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    window.location.href = '/login';
  };

  return (
    <div>
      <div className="md:hidden">
        <MobileAccessDenied 
          onMenuToggle={handleMenuToggle}
          handleLogout={handleLogout}
          selectedLanguage={selectedLanguage}
        />
      </div>
      <div className="hidden md:block">
        <DesktopAccessDenied 
          onMenuToggle={handleMenuToggle} 
          selectedLanguage={selectedLanguage}
          handleLogout={handleLogout}
        />
      </div>
      <SideMenu 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </div>
  );
};

export default AccessDenied;