import React from "react";
import { Menu, Bell } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslations";
import { Language } from "@/i18n/types";

interface AdminHeaderProps {
  onMenuToggle: () => void;
  selectedLanguage?: Language;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onMenuToggle,
  selectedLanguage,
}) => {
  const { t } = useTranslation(selectedLanguage || "pt-BR");

  return (
    <header className="bg-blue-600 shadow-lg" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Seção esquerda: Menu + Logos compactas */}
          <div className="flex items-center space-x-3 sm:space-x-6">
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg hover:bg-blue-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label={t("menu.open")}
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </button>

            {/* Logos compactas para admin */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img
                src="./images/logos/Logo Topo Sespa.png"
                alt="Secretaria de Estado de Saúde Pública do Pará"
                className="h-8 sm:h-10 lg:h-12 w-auto"
              />
              <div className="h-6 sm:h-8 lg:h-10 w-px bg-white/20 hidden sm:block"></div>
              <img
                src="./images/logos/Logo Topo Saude Para.png"
                alt="Saúde Pará"
                className="h-7 sm:h-9 lg:h-11 w-auto"
              />
              <img
                src="./images/logos/Logo Topo Bandeira.png"
                alt="Governo do Estado do Pará"
                className="h-6 sm:h-7 lg:h-9 w-auto"
              />
            </div>
          </div>

          {/* Navegação principal compacta - apenas em desktop */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6" role="navigation">
            <a
              href="/"
              className="text-white font-medium hover:text-blue-100 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
              aria-current="page"
            >
              {t("nav.home")}
            </a>
            <a
              href="/unidades"
              className="text-white font-medium hover:text-blue-100 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
            >
              {t("menu.locations")}
            </a>
            <a
              href="/campanhas"
              className="text-white font-medium hover:text-blue-100 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
            >
              {t("nav.campaigns")}
            </a>
          </nav>

          {/* Seção direita: Notificação - sem barra de busca */}
          <div className="flex items-center">
            <button
              className="p-2 rounded-lg hover:bg-blue-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label={t("notifications")}
            >
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </button>
          </div>
        </div>

        {/* Navegação mobile/tablet - compacta */}
        <nav className="lg:hidden mt-3 pt-3 border-t border-white/10" role="navigation">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <a
              href="/"
              className="text-white font-medium hover:text-blue-100 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
              aria-current="page"
            >
              {t("nav.home")}
            </a>
            <a
              href="/unidades"
              className="text-white font-medium hover:text-blue-100 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
            >
              {t("menu.locations")}
            </a>
            <a
              href="/campanhas"
              className="text-white font-medium hover:text-blue-100 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
            >
              {t("nav.campaigns")}
            </a>
            <a
              href="/contato"
              className="text-white font-medium hover:text-blue-100 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
            >
              {t("menu.fale_conosco")}
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default AdminHeader;
