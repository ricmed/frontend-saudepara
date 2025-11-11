import { useTranslation } from "@/i18n/useTranslations";
import { EducationalMaterial } from '../types/material.types';
import { useLanguage } from '@/contexts/LanguageContext';

interface MaterialCardProps {
  material: EducationalMaterial;
  onClick: (link: string) => void;
}

export const MaterialCard = ({ material, onClick }: MaterialCardProps) => {
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  
  return (
    <div 
      className="flex flex-col h-full cursor-pointer bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
      onClick={() => onClick(material.link)}
    >
      {/* Image with translucent background - full image visible */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100" style={{ paddingTop: "75%" }}>
        {material.imageUrl && (
          <img
            src={material.imageUrl}
            alt={t(material.titleKey)}
            className="absolute top-0 left-0 w-full h-full object-contain p-4 transition-transform duration-300 hover:scale-105"
          />
        )}
      </div>
      
      {/* Content */}
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {t(material.titleKey)}
        </h3>
        <p className="text-gray-600 mb-4 flex-grow">
          {t(material.descriptionKey)}
        </p>
        <button
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {t('educationalMaterials.viewMaterialButton')}
        </button>
      </div>
    </div>
  );
};
