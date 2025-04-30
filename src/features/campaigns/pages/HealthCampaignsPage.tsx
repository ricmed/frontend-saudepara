import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Menu } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslations";
import { useLanguage } from '@/contexts/LanguageContext';
import { CampaignCard } from '../components/CampaignCard';
import { HEALTH_CAMPAIGNS, HEADER } from '../constants/campaigns';
import { useDebounce } from '@/hooks/useDebounce';
import { SideMenu } from '@/features/home/components/SideMenu'; // Updated import
import Paginacao from '@/features/apps/list/paginacao';
import { Campaign } from '../types/campaign.types';
import { Language } from '@/i18n/types';

export const HealthCampaignsPage = () => {
  const navigate = useNavigate();
  const { selectedLanguage, setSelectedLanguage } = useLanguage(); // Updated property name
  const { t } = useTranslation(selectedLanguage);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const itemsPerPage = 9;
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const isMounted = useRef(false);
  
  // Set isMounted ref
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Normalize text for search - remove accents and convert to lowercase
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics (accents)
  };

  // Simulate API fetch with loading
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Filter campaigns based on search term
        let filteredData: Campaign[] = [...HEALTH_CAMPAIGNS];
        
        if (debouncedSearchTerm) {
          const normalizedSearchTerm = normalizeText(debouncedSearchTerm);
          
          filteredData = filteredData.filter(campaign => 
            normalizeText(t(campaign.titleKey)).includes(normalizedSearchTerm) ||
            normalizeText(t(campaign.descriptionKey)).includes(normalizedSearchTerm)
          );
        }
        
        if (isMounted.current) {
          setCampaigns(filteredData);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(t('healthCampaigns.errorLoading') || "Error loading campaigns");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    fetchCampaigns();
  }, [debouncedSearchTerm, t]);
  
  // Reset to page 1 when search term changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  const handleGoBack = () => {
    navigate("/");
  };

  const handleCampaignClick = (link: string) => {
    navigate(link);
  };
  
  // Get paginated campaigns
  const paginatedCampaigns = campaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Calculate total pages
  const totalPages = Math.ceil(campaigns.length / itemsPerPage);

  // Handler for language change
  const handleLanguageChange = (language: Language) => {
    // Evitar o comportamento padrão que pode causar recarga
    if (language !== selectedLanguage) {
      setSelectedLanguage(language);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
                aria-label={t('healthCampaigns.openMenuButton')}
              >
                <Menu className="h-6 w-6" />
              </button>

              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
                aria-label={t('healthCampaigns.backButton')}
              >
                <ArrowLeft className="h-6 w-6" />
              </button>

              <h1 className="text-2xl font-bold">
                {t('healthCampaigns.title')}
              </h1>
            </div>

            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('healthCampaigns.searchPlaceholder') || "Pesquisar campanhas..."}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                autoComplete="off"
                aria-label={t('healthCampaigns.searchAriaLabel')}
              />
              {inputValue && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setInputValue("");
                    setSearchTerm("");
                  }}
                  aria-label={t('healthCampaigns.clearSearchButton')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Botão "Nova" removido */}
          </div>
        </div>
      </header>

      {/* Sidebar - Replaced with SideMenu */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-lg flex justify-between items-center animate-fade-in">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-800"
              aria-label={t('healthCampaigns.closeErrorButton')}
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {paginatedCampaigns.length > 0 ? (
              <div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
                role="list" 
                aria-label={t('healthCampaigns.listAriaLabel')}
              >
                {paginatedCampaigns.map((campaign) => (
                  <article 
                    key={campaign.id} 
                    role="listitem"
                    aria-label={`${t('healthCampaigns.itemAriaLabel')} - ${t(campaign.titleKey)}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:-translate-y-2 hover:shadow-lg h-full"
                  >
                    <CampaignCard
                      campaign={campaign}
                      onClick={handleCampaignClick}
                    />
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg">
                  {searchTerm
                    ? t('healthCampaigns.noResults') || "Nenhum resultado encontrado"
                    : t('healthCampaigns.noCampaigns') || "Nenhuma campanha disponível"}
                </p>
              </div>
            )}

            {campaigns.length > itemsPerPage && (
              <Paginacao
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={campaigns.length}
                itemsPerPage={itemsPerPage}
                isProcessing={loading}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center md:justify-between flex-wrap gap-4">
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} {t('healthCampaigns.footerCopyright')}
            </div>
            <div className="flex space-x-6">
              {["about", "contact", "privacy", "terms"].map((item) => (
                <a 
                  key={item} 
                  href={`/${item}`} 
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {t(`healthCampaigns.footer.${item}`)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HealthCampaignsPage;