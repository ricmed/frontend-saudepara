import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslations";
import { useLanguage } from '@/contexts/LanguageContext';

export const HIVPreventionPage: React.FC = () => {
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate("/materiais-educativos");
  };

  const handleDownload = (pdfPath: string) => {
    window.open(pdfPath, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button onClick={handleGoBack} className="p-2 hover:bg-blue-700 rounded-full transition-colors" aria-label={t('educationalMaterials.backButton')}>
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold">{t('educationalMaterials.hivPrevention.title')}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center justify-center bg-blue-100 rounded-lg p-4">
                <img src="/images/materiais educativos/FOLDER - Hiv Prevention - EN.png" alt={t('educationalMaterials.hivPrevention.title')} className="w-full max-h-80 md:max-h-96 object-contain transition-all" />
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl font-bold mb-4 text-blue-600">{t('educationalMaterials.hivPrevention.title')}</h2>
                <div className="space-y-4">
                  <p className="text-gray-700">{t('educationalMaterials.hivPrevention.description1')}</p>
                  <p className="text-gray-700">{t('educationalMaterials.hivPrevention.description2')}</p>
                  <p className="text-gray-700">{t('educationalMaterials.hivPrevention.description3')}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button className="px-8 bg-blue-600 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors" onClick={() => handleDownload('/images/materiais educativos/FOLDER - Hiv Prevention - EN.pdf')}>
                <Download className="w-5 h-5" />
                <span>{t('educationalMaterials.hivPrevention.downloadButton')}</span>
                <span className="text-sm opacity-90 ml-2">(English)</span>
              </button>
              
              <button className="w-full md:w-auto md:px-8 bg-green-600 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 hover:bg-green-700 transition-colors" onClick={() => handleDownload('/images/materiais educativos/Mandala de Prevenção Combinada - HIV.pdf')}>
                <Download className="w-5 h-5" />
                <span>{t('educationalMaterials.hivMandala.downloadButton')}</span>
                <span className="text-sm opacity-90 ml-2">(Português)</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center md:justify-between flex-wrap gap-4">
            <div className="text-sm text-gray-600">© {new Date().getFullYear()} {t('educationalMaterials.footerCopyright')}</div>
            <div className="flex space-x-6">
              {["about", "contact", "privacy", "terms"].map((item) => (
                <a key={item} href={`/${item}`} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">{t(`educationalMaterials.footer.${item}`)}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HIVPreventionPage;
