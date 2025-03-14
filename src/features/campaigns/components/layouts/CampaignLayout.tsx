import React from 'react';
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/shared/components/layouts/BottomNavigation";

interface CampaignLayoutProps {
  children: React.ReactNode;
  title: string;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const CampaignLayout: React.FC<CampaignLayoutProps> = ({
  children,
  title,
  currentTab,
  onTabChange
}) => {
  const navigate = useNavigate();

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-md">
        <div className="border-8 border-gray-800 rounded-[2.5rem] overflow-hidden h-[720px] relative bg-gray-50">
          <div className="bg-gray-800 h-6 w-40 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl"></div>

          <div className="h-full flex flex-col">
            {/* Header */}
            <header className="bg-blue-600 p-4">
              <div className="flex items-center mb-4">
                <ArrowLeft 
                  className="h-6 w-6 text-white cursor-pointer" 
                  onClick={() => navigate(-1)}
                />
                <h1 className="text-white text-xl ml-4">{title}</h1>
              </div>
            </header>

            {/* Content area with padding bottom to account for navigation */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
              {children}
            </div>

            {/* Bottom Navigation */}
            <BottomNavigation
              currentTab={currentTab}
              onTabChange={onTabChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};