import React from "react";
import { Menu, Bell } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslations";
import { Language } from "@/i18n/types";
import { AppHeaderLogos } from "./AppHeaderLogos";

interface CustomHeaderProps {
  onMenuToggle: () => void;
  selectedLanguage?: Language;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({
  onMenuToggle,
  selectedLanguage,
}) => {
  const { t } = useTranslation(selectedLanguage || "pt-BR");

  return (
    <header className="bg-blue-600 p-4">
      {/* Menu e Notificação */}
      <div className="flex justify-between items-center mb-4">
        <Menu
          className="h-6 w-6 text-white cursor-pointer"
          onClick={onMenuToggle}
          aria-label={t("menu.open")}
        />
        <Bell className="h-6 w-6 text-white" aria-label={t("notifications")} />
      </div>

      {/* Logos */}
      <div className="mb-4">
        <AppHeaderLogos compact />
      </div>
    </header>
  );
};

export default CustomHeader;
