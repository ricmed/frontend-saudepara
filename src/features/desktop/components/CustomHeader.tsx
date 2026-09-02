import React from "react";
import { Search, Menu, Bell } from "lucide-react";
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
        />
        <Bell className="h-6 w-6 text-white" />
      </div>

      {/* Logos */}
      <div className="mb-4">
        <AppHeaderLogos compact />
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-white/60" />
        </div>
        <input
          type="text"
          placeholder={t("search.placeholder") || "Buscar serviços"}
          className="w-full bg-blue-500/40 border-none rounded-full py-2.5 pl-10 pr-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
        />
      </div>
    </header>
  );
};

export default CustomHeader;