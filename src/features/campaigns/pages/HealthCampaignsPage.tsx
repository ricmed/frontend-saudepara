import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslations";
import { useLanguage } from '@/contexts/LanguageContext';
import { CampaignCard } from '../components/CampaignCard';
import { BottomNavigation } from '@/shared/components/layouts/BottomNavigation';
import { HEALTH_CAMPAIGNS, HEADER, LAYOUT } from '../constants/campaigns';
import { TabType } from '../types/campaign.types';

export const HealthCampaignsPage = () => {
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const [currentTab, setCurrentTab] = useState<TabType>("campanhas");

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleCampaignClick = (link: string) => {
    navigate(link);
  };

  return (
    <div className="w-full flex justify-center pt-4">
      <div className="w-full max-w-md">
        <div className={`${LAYOUT.border.width} ${LAYOUT.border.color} ${LAYOUT.border.radius} 
          overflow-hidden ${LAYOUT.height} relative ${LAYOUT.background}`}>
          <div className={`${LAYOUT.notch.color} ${LAYOUT.notch.height} ${LAYOUT.notch.width} 
            absolute top-0 left-1/2 -translate-x-1/2 ${LAYOUT.notch.radius}`}/>

          <div className="h-full flex flex-col">
            {/* Header */}
            <header className={`${HEADER.backgroundColor} p-4`}>
              <div className="flex items-center mb-4">
                <ArrowLeft 
                  className={`h-6 w-6 ${HEADER.iconColor} cursor-pointer`} 
                  onClick={handleGoBack}
                  aria-label={t('healthCampaigns.backButton')}
                />
                <h1 className={`${HEADER.textColor} text-xl ml-4`}>
                  {t('healthCampaigns.title')}
                </h1>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4">
              <section 
                className="space-y-4" 
                role="list" 
                aria-label={t('healthCampaigns.listAriaLabel')}
              >
                {HEALTH_CAMPAIGNS.map((campaign) => (
                  <article 
                    key={campaign.id} 
                    role="listitem"
                    aria-label={`${t('healthCampaigns.itemAriaLabel')} - ${t(campaign.titleKey)}`}
                  >
                    <CampaignCard
                      campaign={campaign}
                      onClick={handleCampaignClick}
                    />
                  </article>
                ))}
              </section>
            </main>

            {/* Bottom Navigation */}
            <BottomNavigation
              currentTab={currentTab}
              onTabChange={setCurrentTab as (tab: string) => void}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthCampaignsPage;