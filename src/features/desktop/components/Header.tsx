import React from "react";
import { Search, Menu, Bell } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslations";
import { Language } from "@/i18n/types";

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
    <header className="p-4">
      <div className="flex justify-between">
        <Menu
          className="h-6 w-6 text-white cursor-pointer"
          onClick={onMenuToggle}
        />
        <Bell className="h-6 w-6 text-white" />
      </div>

      {/* Logos */}
      <div className="mt-2 flex justify-between items-center">
        <img
          src="./images/logos/Logo Topo Sespa.png"
          alt="Sespa Logo"
          className="h-12 w-auto"
        />

        <div className="flex items-center">
          <img
            src="./images/logos/Logo Topo Saude Para.png"
            alt="Saúde Pará Logo"
            className="h-10 w-auto mr-2"
          />
          <img
            src="./images/logos/Logo Topo Bandeira.png"
            alt="Bandeira Logo"
            className="h-6 w-auto"
          />
        </div>
      </div>

      {/* Barra de busca */}
      <div className="mt-4 relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-white/60" />
        </div>
        <input
          type="text"
          placeholder={t("search.placeholder")}
          className="w-full bg-blue-500/40 border-none rounded-full py-2 pl-10 pr-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>
    </header>
  ) : (
    <header className="bg-blue-600 px-6 py-4">
      <div className="flex items-center max-w-7xl mx-auto relative">
        {/* Menu hamburguer na extremidade esquerda */}
        <Menu
          className="h-6 w-6 text-white cursor-pointer absolute left-6"
          onClick={onMenuToggle}
        />

        {/* Logos à esquerda com margem para o menu */}
        <div className="flex items-center ml-20">
          <img
            src="./images/logos/Logo Topo Sespa.png"
            alt="Sespa Logo"
            className="h-12 w-auto"
          />
          <img
            src="./images/logos/Logo Topo Saude Para.png"
            alt="Saúde Pará Logo"
            className="h-12 w-auto mr-2"
          />
          <img
            src="./images/logos/Logo Topo Bandeira.png"
            alt="Bandeira Logo"
            className="h-8 w-auto"
          />
        </div>

        {/* Navegação centralizada */}
        <nav className="hidden md:flex items-center justify-center flex-1 mx-auto">
          <div className="flex space-x-8">
            <a
              href="/"
              className="text-white font-medium hover:text-blue-100 transition"
            >
              {t("nav.home")}
            </a>
            <a
              href="/servicos"
              className="text-white font-medium hover:text-blue-100 transition"
            >
              {t("nav.map")}
            </a>
            <a
              href="/unidades"
              className="text-white font-medium hover:text-blue-100 transition"
            >
              {t("menu.locations")}
            </a>
            <a
              href="/campanhas"
              className="text-white font-medium hover:text-blue-100 transition"
            >
              {t("nav.campaigns")}
            </a>
            <a
              href="/contato"
              className="text-white font-medium hover:text-blue-100 transition"
            >
              {t("menu.fale_conosco")}
            </a>
          </div>
        </nav>

        {/* Barra de busca à direita */}
        <div className="relative w-60">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-white/60" />
          </div>
          <input
            type="text"
            placeholder={t("search.placeholder")}
            className="w-full bg-[#4D6FFF]/40 border-none rounded-full py-2 pl-10 pr-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
