import React from "react";
import { Search, Menu, Bell } from "lucide-react";
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

      {/* Barra de busca com melhor acessibilidade */}
      <div className="relative">
        <label htmlFor="search-mobile" className="sr-only">
          {t("search.placeholder")}
        </label>
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-white/60" aria-hidden="true" />
        </div>
        <input
          id="search-mobile"
          type="search"
          placeholder={t("search.placeholder")}
          className="w-full bg-blue-500/40 border-none rounded-full py-3 pl-10 pr-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-blue-500/60 transition-colors"
          autoComplete="off"
        />
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

          {/* Seção direita: Busca + Controles */}
          <div className="flex items-center space-x-4">
            {/* Barra de busca melhorada */}
            <div className="relative w-64">
              <label htmlFor="search-desktop" className="sr-only">
                {t("search.placeholder")}
              </label>
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-white/60" aria-hidden="true" />
              </div>
              <input
                id="search-desktop"
                type="search"
                placeholder={t("search.placeholder")}
                className="w-full bg-[var(--sp-accent-hover)]/40 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-[var(--sp-accent-hover)]/60 focus:border-white/20 transition-all"
                autoComplete="off"
              />
            </div>

            {/* Botão de notificações */}
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
