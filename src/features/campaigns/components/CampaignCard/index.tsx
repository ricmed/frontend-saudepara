import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from "@/i18n/useTranslations";
import { Campaign } from '../../types/campaign.types';
import { TranslationRecord } from '@/i18n/types';

interface CampaignCardProps {
  campaign: Campaign;
  onClick: (link: string) => void;
}

export const CampaignCard = ({ campaign, onClick }: CampaignCardProps) => {
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);

  return (
    <div
      className="flex bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md cursor-pointer"
      onClick={() => onClick(campaign.link)}
    >
      <div className="w-20 h-20 flex-shrink-0">
        <img
          src={campaign.imageUrl}
          alt={t(campaign.titleKey as keyof TranslationRecord)}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "/api/placeholder/80/80";
          }}
        />
      </div>
      <div className="p-3 flex-1">
        <h3 className="font-medium text-gray-900 text-sm">
          {t(campaign.titleKey as keyof TranslationRecord)}
        </h3>
        <p className="text-xs text-gray-600 mt-1">
          {t(campaign.descriptionKey as keyof TranslationRecord)}
        </p>
      </div>
    </div>
  );
};