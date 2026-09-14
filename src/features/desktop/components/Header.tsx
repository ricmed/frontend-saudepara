import React from "react";
import { Menu, Bell } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslations";
import { Language } from "@/i18n/types";
import { AppHeaderLogos } from "./AppHeaderLogos";

interface HeaderProps {
  onMenuToggle: () => void;
  isMobile?: boolean;
  selectedLanguage?: Language;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  isMobile = true,
  selectedLanguage,
}) => {
  const { t } = useTranslation(selectedLanguage || "pt-BR");

  return isMobile ? (
    <header className="p-4" role="banner">
      {/* Barra superior com controles principais */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label={t("menu.open")}
        >
          <Menu className="h-6 w-6 text-white" />
        </button>
        
        <button
          className="p-2 -mr-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label={t("notifications")}
        >
          <Bell className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Logos com melhor hierarquia visual */}
      <div className="flex justify-between items-center mb-4">
        <AppHeaderLogos compact />
      </div>
    </header>
  ) : (
    <header className="bg-blue-600 shadow-lg" role="banner">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Seção esquerda: Menu + Logos */}
          <div className="flex items-center space-x-6">
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg hover:bg-blue-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label={t("menu.open")}
            >
              <Menu className="h-6 w-6 text-white" />
            </button>

            <AppHeaderLogos />
          </div>

          {/* Navegação principal centralizada */}
          <nav className="hidden lg:flex items-center space-x-8" role="navigation">
            <a
              href="/"
              className="text-white font-medium hover:text-blue-100 transition-colors py-2 px-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-current="page"
            >
              {t("nav.home")}
            </a>
            <a
              href="/mapa"
              className="text-white font-medium hover:text-blue-100 transition-colors py-2 px-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {t("menu.locations")}
            </a>
            <a
              href="/campanhas"
              className="text-white font-medium hover:text-blue-100 transition-colors py-2 px-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {t("nav.campaigns")}
            </a>
            <a
              href="/contato"
              className="text-white font-medium hover:text-blue-100 transition-colors py-2 px-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {t("menu.fale_conosco")}
            </a>
          </nav>

          {/* Seção direita: Controles */}
          <div className="flex items-center space-x-4">
            <button
              className="p-2 rounded-lg hover:bg-blue-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label={t("notifications")}
            >
              <Bell className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Navegação mobile (tablet) */}
        <nav className="lg:hidden mt-4 pt-4 border-t border-white/10" role="navigation">
          <div className="flex flex-wrap justify-center gap-6">
            <a
              href="/"
              className="text-white font-medium hover:text-blue-100 transition-colors py-2 px-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-current="page"
            >
              {t("nav.home")}
            </a>
            <a
              href="/mapa"
              className="text-white font-medium hover:text-blue-100 transition-colors py-2 px-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {t("menu.locations")}
            </a>
            <a
              href="/campanhas"
              className="text-white font-medium hover:text-blue-100 transition-colors py-2 px-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {t("nav.campaigns")}
            </a>
            <a
              href="/contato"
              className="text-white font-medium hover:text-blue-100 transition-colors py-2 px-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {t("menu.fale_conosco")}
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
