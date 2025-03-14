import React, { useState } from 'react';
import { useTranslation } from "@/i18n/useTranslations";
import { useLanguage } from '@/contexts/LanguageContext';
import { CampaignLayout } from '../../components/layouts/CampaignLayout';

export const GreenSeptemberPage: React.FC = () => {
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const [currentTab, setCurrentTab] = useState("campanhas");

  return (
    <CampaignLayout
      title={t('campaigns.greenSeptember.title')}
      currentTab={currentTab}
      onTabChange={setCurrentTab}
    >
      <div className="w-full h-48 flex items-center justify-center mb-4 bg-blue-100 rounded-lg">
        <img
          src="./images/campaigns/Setembro Verde.png"
          alt={t('campaigns.greenSeptember.title')}
          className="h-full w-full object-contain p-2"
        />
      </div>
      
      <h1 className="text-xl font-bold mb-4 text-blue-600 text-center">
        {t('campaigns.greenSeptember.title')}
      </h1>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-700 text-justify">
          {t('campaigns.greenSeptember.description1')}
        </p>
        <p className="text-sm text-gray-700 text-justify">
          {t('campaigns.greenSeptember.description2')}
        </p>
      </div>
    </CampaignLayout>
  );
};

export default GreenSeptemberPage;