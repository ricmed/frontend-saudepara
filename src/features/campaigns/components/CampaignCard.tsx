import { useTranslation } from "@/i18n/useTranslations";
import { Campaign } from '../types/campaign.types';
import { useLanguage } from '@/contexts/LanguageContext';

interface CampaignCardProps {
  campaign: Campaign;
  onClick: (link: string) => void;
}

export const CampaignCard = ({ campaign, onClick }: CampaignCardProps) => {
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  
  return (
    <div 
      className="flex flex-col h-full cursor-pointer"
      onClick={() => onClick(campaign.link)}
    >
      {/* Image with larger, consistent height */}
      <div className="relative overflow-hidden" style={{ paddingTop: "60%" }}>
        {campaign.imageUrl && (
          <img
            src={campaign.imageUrl}
            alt={t(campaign.titleKey)}
            className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        )}
      </div>
      
      {/* Content */}
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {t(campaign.titleKey)}
        </h3>
        <p className="text-gray-600 mb-4 flex-grow">
          {t(campaign.descriptionKey)}
        </p>
        <button
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {t('healthCampaigns.viewCampaignButton')}
        </button>
      </div>
    </div>
  );
};