import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ArrowLeft, Contact, Ear } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslations";
import { useLanguage } from '@/contexts/LanguageContext';
import SideMenu from "@/features/home/components/SideMenu"; // Supondo que o caminho do SideMenu esteja correto

type ContactOption = {
  icon: JSX.Element;
  name: string;
  link: string;
  translationKey: string;
};

export const FaleConoscoPage: React.FC = () => {
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Definindo as opções de contato
  const contactOptions: ContactOption[] = [
    {
      icon: <Contact className="h-10 w-10 text-white" />,
      name: "ASCOM",
      link: "/fale-conosco/ascom",
      translationKey: "faleConosco.ascom"
    },
    {
      icon: <Ear className="h-10 w-10 text-white" />,
      name: "Ouvidoria",
      link: "/fale-conosco/ouvidoria",
      translationKey: "faleConosco.ouvitoria"
    }
  ];

  const handleGoBack = () => {
    navigate("/"); // Navega para a página inicial ou outra página de sua escolha
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 text-white hover:bg-blue-700 rounded-lg transition-colors"
                aria-label={t('menu.open')}
              >
                <Menu className="h-6 w-6" />
              </button>

              <button
                onClick={handleGoBack}
                className="p-2 text-white hover:bg-blue-700 rounded-lg transition-colors"
                aria-label={t('voltar')}
              >
                <ArrowLeft className="h-6 w-6" />
              </button>

              <h1 className="text-white text-xl font-semibold">
                {t('faleConosco.title')}
              </h1>
            </div>
          </div>
        </div>
      </header>
      
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        selectedLanguage={selectedLanguage}
        onLanguageChange={() => {}}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {contactOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => navigate(option.link)}
                className="group bg-blue-600 rounded-xl p-8 flex flex-col items-center justify-center gap-6 transition-all hover:scale-105 hover:shadow-xl hover:bg-blue-700 active:scale-95"
                aria-label={`${t('faleConosco.access')} ${t(option.translationKey)}`}
              >
                <div className="p-4 bg-blue-700/50 rounded-full transition-colors group-hover:bg-blue-800/50">
                  {option.icon}
                </div>
                <span className="text-white text-center text-xl font-medium tracking-wide">
                  {t(option.translationKey)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FaleConoscoPage;