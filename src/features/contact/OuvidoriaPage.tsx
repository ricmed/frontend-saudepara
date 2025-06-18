import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Globe, ExternalLink, PhoneCall } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslations";
import { useLanguage } from '@/contexts/LanguageContext';

export const OuvidoriaPage: React.FC = () => {
  // Hooks para tradução e navegação
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const navigate = useNavigate();

  // Função para voltar à página anterior
  const handleGoBack = () => {
    navigate("/fale-conosco");
  };

  // URL para o formulário externo
  const formUrl = "https://ouvidor.saude.gov.br/public/form-web/registrar";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Cabeçalho da Página */}
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
              {t('ouvitoria.title')}
            </h1>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full">
        <div className="bg-white rounded-xl shadow-md overflow-hidden h-full">
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Coluna da Imagem (2/3) - Bem maior agora */}
              <div className="lg:col-span-2 flex items-center justify-center bg-gray-100 rounded-lg p-8">
                <img
                  src="/images/contact/ouvidoria.png"
                  alt={t('ouvitoria.title')}
                  className="w-full h-auto object-contain rounded-lg" // Removida restrição de altura
                />
              </div>
              
              {/* Coluna do Conteúdo (1/3) */}
              <div className="lg:col-span-1 flex flex-col justify-center">
                <p className="text-gray-700 text-lg mb-6">
                  {t('ouvitoria.description')}
                </p>
                <div className="space-y-5 border-t border-gray-200 pt-6">
                  
                  {/* Canais de Acesso */}
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{t('ouvitoria.inPersonLabel')}</h3>
                      <p className="text-gray-600">{t('ouvitoria.address')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{t('ouvitoria.phoneLabel')}</h3>
                      <p className="text-gray-600">(91) 3212-5000 / 3222-4892 / 3212-0225 / 3222-4184</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <PhoneCall className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{t('ouvitoria.freeCallLabel')}</h3>
                      <p className="text-gray-600">0800 280 9889</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{t('ouvitoria.emailLabel')}</h3>
                      <a href="mailto:ouvidoria@sespa.pa.gov.br" className="text-blue-700 hover:underline">
                        ouvidoria@sespa.pa.gov.br
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Globe className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-gray-800">{t('ouvitoria.siteLabel')}</h3>
                        <a href="http://www.saude.pa.gov.br/ouvidoria" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline break-all">
                            www.saude.pa.gov.br/ouvidoria
                        </a>
                    </div>
                  </div>
                </div>

                {/* Botão para Formulário Externo */}
                <div className="mt-8">
                  <button 
                    className="w-full md:w-auto bg-blue-600 text-white rounded-lg py-3 px-6 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                    onClick={() => window.open(formUrl, '_blank')}
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>{t('ouvitoria.formButton')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OuvidoriaPage;