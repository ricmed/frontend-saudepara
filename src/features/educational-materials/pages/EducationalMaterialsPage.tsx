import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Menu } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslations";
import { useLanguage } from '@/contexts/LanguageContext';
import { MaterialCard } from '../components/MaterialCard';
import { EDUCATIONAL_MATERIALS } from '../constants/materials';
import { useDebounce } from '@/hooks/useDebounce';
import { SideMenu } from '@/features/home/components/SideMenu';
import Paginacao from '@/features/apps/list/paginacao';
import { EducationalMaterial } from '../types/material.types';

export const EducationalMaterialsPage = () => {
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [materials, setMaterials] = useState<EducationalMaterial[]>([]);
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
    const fetchMaterials = async () => {
      setLoading(true);
      
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Filter materials based on search term
        let filteredData: EducationalMaterial[] = [...EDUCATIONAL_MATERIALS];
        
        if (debouncedSearchTerm) {
          const normalizedSearchTerm = normalizeText(debouncedSearchTerm);
          
          filteredData = filteredData.filter(material => 
            normalizeText(t(material.titleKey)).includes(normalizedSearchTerm) ||
            normalizeText(t(material.descriptionKey)).includes(normalizedSearchTerm)
          );
        }
        
        if (isMounted.current) {
          setMaterials(filteredData);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(t('educationalMaterials.errorLoading') || "Erro ao carregar materiais");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    fetchMaterials();
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

  const handleMaterialClick = (link: string) => {
    navigate(link);
  };
  
  // Get paginated materials
  const paginatedMaterials = materials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Calculate total pages
  const totalPages = Math.ceil(materials.length / itemsPerPage);

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
                aria-label={t('educationalMaterials.openMenuButton')}
              >
                <Menu className="h-6 w-6" />
              </button>

              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
                aria-label={t('educationalMaterials.backButton')}
              >
                <ArrowLeft className="h-6 w-6" />
              </button>

              <h1 className="text-2xl font-bold">
                {t('educationalMaterials.title')}
              </h1>
            </div>

            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('educationalMaterials.searchPlaceholder') || "Pesquisar materiais..."}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                autoComplete="off"
                aria-label={t('educationalMaterials.searchAriaLabel')}
              />
              {inputValue && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setInputValue("");
                    setSearchTerm("");
                  }}
                  aria-label={t('educationalMaterials.clearSearchButton')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-lg flex justify-between items-center animate-fade-in">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-800"
              aria-label={t('educationalMaterials.closeErrorButton')}
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
            {paginatedMaterials.length > 0 ? (
              <div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
                role="list" 
                aria-label={t('educationalMaterials.listAriaLabel')}
              >
                {paginatedMaterials.map((material) => (
                  <article 
                    key={material.id} 
                    role="listitem"
                    aria-label={`${t('educationalMaterials.itemAriaLabel')} - ${t(material.titleKey)}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:-translate-y-2 hover:shadow-lg h-full"
                  >
                    <MaterialCard
                      material={material}
                      onClick={handleMaterialClick}
                    />
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg">
                  {searchTerm
                    ? t('educationalMaterials.noResults') || "Nenhum resultado encontrado"
                    : t('educationalMaterials.noMaterials') || "Nenhum material disponível"}
                </p>
              </div>
            )}

            {materials.length > itemsPerPage && (
              <Paginacao
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={materials.length}
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
              © {new Date().getFullYear()} {t('educationalMaterials.footerCopyright')}
            </div>
            <div className="flex space-x-6">
              {["about", "contact", "privacy", "terms"].map((item) => (
                <a 
                  key={item} 
                  href={`/${item}`} 
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {t(`educationalMaterials.footer.${item}`)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EducationalMaterialsPage;
