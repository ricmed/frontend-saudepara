import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslations";
import { useLanguage } from '@/contexts/LanguageContext';

export const AscomPage: React.FC = () => {
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate("/fale-conosco");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              aria-label={t('voltar')}
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold">
              {t('ascom.title')}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow">
        <div className="bg-white rounded-xl shadow-md overflow-hidden h-full">
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Imagem */}
              <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4">
                <img
                  src="/images/contact/ascom-logo.png" // Crie esta pasta e coloque a imagem 'image_e1f864.png' aqui
                  alt={t('ascom.title')}
                  className="w-full max-w-sm object-contain"
                />
              </div>
              
              {/* Conteúdo */}
              <div className="flex flex-col justify-center">
                <h2 className="text-3xl font-bold mb-6 text-blue-600">
                  {t('ascom.subTitle')}
                </h2>
                <div className="space-y-6">
                  <p className="text-gray-700 text-lg">
                    {t('ascom.description')}
                  </p>
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <Mail className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-800">{t('ascom.emailLabel')}</h3>
                        <a href="mailto:ascom@sespa.pa.gov.br" className="text-gray-600 hover:text-blue-700">
                          ascom@sespa.pa.gov.br
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Phone className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-800">{t('ascom.phoneLabel')}</h3>
                        <p className="text-gray-600">(91) 4006-4298</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer (Opcional, pode ser removido se você tiver um layout global) */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-sm text-gray-600">
            © {new Date().getFullYear()} {t('footer.copyright')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AscomPage;