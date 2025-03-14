import React, { useState } from 'react';
import { Download } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslations";
import { useLanguage } from '@/contexts/LanguageContext';
import { CampaignLayout } from '../../components/layouts/CampaignLayout';

export const RedDecemberPage: React.FC = () => {
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const [currentTab, setCurrentTab] = useState("campanhas");

  return (
    <CampaignLayout
      title={t('campaigns.redDecember.title')}
      currentTab={currentTab}
      onTabChange={setCurrentTab}
    >
      <div className="w-full h-48 flex items-center justify-center mb-4 bg-blue-100 rounded-lg">
        <img
          src="./images/campaigns/MANDALA.jpg"
          alt={t('campaigns.redDecember.title')}
          className="h-full w-full object-contain p-2"
        />
      </div>

      <div className="space-y-4 mb-6">
        <p className="text-sm text-gray-700 text-justify">
          {t('campaigns.redDecember.description1')}
        </p>
        <p className="text-sm text-gray-700 text-justify">
          {t('campaigns.redDecember.description2')}
        </p>
        <p className="text-sm text-gray-700 text-justify">
          {t('campaigns.redDecember.description3')}
        </p>
      </div>

      <button 
        className="w-full bg-blue-600 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors mb-3"
        onClick={() => window.open('https://drive.google.com/file/d/1w7ewJX5WFkAS2pgXxdwcxdXZak-I4ix1/view?usp=drive_link')}
      >
        <Download className="w-5 h-5" />
        <span>{t('campaigns.redDecember.downloadButton')}</span>
      </button>
    </CampaignLayout>
  );
};

export default RedDecemberPage;