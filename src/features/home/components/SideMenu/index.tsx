import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslations";
import { Language } from "@/i18n/types";
import { LanguageSelector } from "@/components/LanguageSelector";
import {
  FileText,
  ChartSpline,
  BookType,
  Award,
  Lock,
  Network,
  AlertTriangle,
  LogOut,
  Building2,
  ChevronRight,
} from "lucide-react";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  selectedLanguage,
  onLanguageChange,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation(selectedLanguage);

  const menuItems = [
    {
      icon: <Award />,
      label: t("menu.qualify_establishments"),
      onClick: () => navigate("/relatorio-estabelecimentos"),
    },
    {
      icon: <FileText />,
      label: t("menu.notification"),
      onClick: () => navigate("/modulo-pacientes-ficha"),
    },
    {
      icon: <ChartSpline />,
      label: t("menu.dashboard"),
      onClick: () => navigate("/dashboard"),
    },
    {
      icon: <BookType />,
      label: t("menu.educational"),
      onClick: () => {},
    },
    {
      icon: <Building2 />,
      label: t("menu.apps"),
      onClick: () => navigate("/apps-auxiliares"),
    },
    {
      icon: <Lock />,
      label: t("menu.security"),
      onClick: () => {},
    },
    {
      icon: <Network />,
      label: t("menu.version"),
      onClick: () => {},
    },
    {
      icon: <AlertTriangle />,
      label: t("menu.bug"),
      onClick: () => {},
    },
    {
      icon: <LogOut className="rotate-180" />,
      label: t("menu.logout"),
      onClick: () => {},
    },
  ];

  return (
    <>
      {/* Menu Lateral */}
      <div
        className={`absolute inset-y-0 left-0 w-64 bg-blue-900 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between mb-6">
            <img
              src="./images/logos/lateral completo.png"
              alt="Logo Saúde Pará"
              className="bg-white rounded p-1"
            />
          </div>

          {/* Itens do Menu */}
          <div className="flex-grow">
            {menuItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-white py-3 px-2 hover:bg-blue-800 rounded-lg cursor-pointer"
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
              >
                <span className="text-white">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-white ml-auto" />
              </div>
            ))}
          </div>

          {/* Seletor de Idiomas */}
          <div className="mt-auto border-t border-blue-800 pt-4">
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={onLanguageChange}
            />
          </div>
        </div>
      </div>

      {/* Overlay do Menu */}
      {isOpen && (
        <div className="absolute inset-0 bg-black/50 z-40" onClick={onClose} />
      )}
    </>
  );
};

export default SideMenu;
