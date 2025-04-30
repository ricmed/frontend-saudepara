import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslations";
import { useLanguage } from '@/contexts/LanguageContext';

export const BlueNovemberPage: React.FC = () => {
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate("/campanhas");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              aria-label={t('campaigns.backButton')}
            >
              <ArrowLeft className="h-6 w-6" />
            </button>

            <h1 className="text-2xl font-bold">
              {t('campaigns.blueNovember.title')}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Imagem */}
              <div className="flex items-center justify-center bg-blue-100 rounded-lg p-4">
                <img
                  src="./images/campaigns/Novembro Azul.png"
                  alt={t('campaigns.blueNovember.title')}
                  className="w-full max-h-80 md:max-h-96 object-contain transition-all"
                />
              </div>
              
              {/* Conteúdo */}
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl font-bold mb-4 text-blue-600">
                  {t('campaigns.blueNovember.title')}
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    {t('campaigns.blueNovember.description1')}
                  </p>
                  <p className="text-gray-700">
                    {t('campaigns.blueNovember.description2')}
                  </p>
                  <p className="text-gray-700">
                    {t('campaigns.blueNovember.description3')}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <button 
                className="w-full md:w-auto md:px-8 bg-blue-600 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                onClick={() => window.open('https://drive.google.com/file/d/1qYfjWju9VDAsWmGFRtiuIdEJXaUrNYDr/view?usp=drive_link')}
              >
                <Download className="w-5 h-5" />
                <span>{t('campaigns.blueNovember.downloadButton1')}</span>
              </button>

              <button 
                className="w-full md:w-auto md:px-8 bg-blue-600 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                onClick={() => window.open('https://drive.google.com/file/d/1rU_b50gY1NphYk4cwAN1HFfjoVstC_-L/view?usp=drive_link')}
              >
                <Download className="w-5 h-5" />
                <span>{t('campaigns.blueNovember.downloadButton2')}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center md:justify-between flex-wrap gap-4">
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} {t('campaigns.footerCopyright')}
            </div>
            <div className="flex space-x-6">
              {["about", "contact", "privacy", "terms"].map((item) => (
                <a 
                  key={item} 
                  href={`/${item}`} 
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {t(`campaigns.footer.${item}`)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlueNovemberPage;