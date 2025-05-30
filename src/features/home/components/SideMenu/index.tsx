import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslations";
import { Language } from "@/i18n/types";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useAuth } from '@/keycloak/AuthProvider';
import UserProfileHeader from "@/keycloak/components/UserProfileHeader";
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
  FileSpreadsheet,
  FileCheck,
  Clock,
  Leaf,
  UserSquare,
  GraduationCap,
  MapPin,
  Map,
  CheckCircle,
  Users,
  Calendar,
  HeartPulse,
  Stethoscope,
  Thermometer,
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
  const { logout } = useAuth();
  const [showAppsSubmenu, setShowAppsSubmenu] = useState(false);

  // List of auxiliary apps
  const appsMenuItems = [
    {
      icon: <Building2 className="h-6 w-6 text-white" />,
      nome: t("apps.components"),
      link: "/private/componente",
    },
    {
      icon: <FileSpreadsheet className="h-6 w-6 text-white" />,
      nome: t("apps.establishments"),
      link: "/private/tipo-estabelecimentos/lista",
    },
    {
      icon: <Award className="h-6 w-6 text-white" />,
      nome: t("apps.qualifications"),
      link: "/relatorio-qualificacao",
    },
    {
      icon: <FileCheck className="h-6 w-6 text-white" />,
      nome: t("apps.enablings"),
      link: "/private/habilitacao",
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-white" />,
      nome: t("apps.closure_types"),
      link: "/private/encerramento",
    },
    {
      icon: <Users className="h-6 w-6 text-white" />,
      nome: t("apps.public_types"),
      link: "/private/publico",
    },
    {
      icon: <Calendar className="h-6 w-6 text-white" />,
      nome: t("apps.event_types"),
      link: "/private/evento",
    },
    {
      icon: <AlertTriangle className="h-6 w-6 text-white" />,
      nome: t("apps.trauma_types"),
      link: "/private/trauma",
    },
    {
      icon: <HeartPulse className="h-6 w-6 text-white" />,
      nome: t("apps.care_types"),
      link: "/private/atendimento",
    },
    {
      icon: <Stethoscope className="h-6 w-6 text-white" />,
      nome: t("apps.diagnostic_hypothesis_types"),
      link: "/private/hipotese-diagnostica",
    },
    {
      icon: <Thermometer className="h-6 w-6 text-white" />,
      nome: t("apps.symptom_types"),
      link: "/private/sintoma",
    },
    {
      icon: <Clock className="h-6 w-6 text-white" />,
      nome: t("apps.shift"),
      link: "/private/turnos",
    },
    {
      icon: <Leaf className="h-6 w-6 text-white" />,
      nome: t("apps.nature"),
      link: "/private/naturezas",
    },
    {
      icon: <UserSquare className="h-6 w-6 text-white" />,
      nome: t("apps.race"),
      link: "/private/raca",
    },
    {
      icon: <GraduationCap className="h-6 w-6 text-white" />,
      nome: t("apps.education"),
      link: "/private/escolaridade",
    },
    {
      icon: <Building2 className="h-6 w-6 text-white" />,
      nome: t("apps.cbo"),
      link: "/private/cbo",
    },
    {
      icon: <MapPin className="h-6 w-6 text-white" />,
      nome: t("apps.countries"),
      link: "/private/pais",
    },
    {
      icon: <Map className="h-6 w-6 text-white" />,
      nome: t("apps.states"),
      link: "/private/estado",
    },
    {
      icon: <MapPin className="h-6 w-6 text-white" />,
      nome: t("apps.cities"),
      link: "/private/municipio",
    },
    {
      icon: <MapPin className="h-6 w-6 text-white" />,
      nome: t("apps.gender"),
      link: "/private/genero",
    },
    {
      icon: <MapPin className="h-6 w-6 text-white" />,
      nome: t("apps.sexual_orientation"),
      link: "/orientacao-sexual/lista",
    },
  ];

  // Main menu items
  const menuItems = [
    {
      icon: <Award />,
      label: t("menu.qualify_establishments"),
      onClick: () => navigate("/private/relatorio-estabelecimentos"),
    },
    {
      icon: <FileText />,
      label: t("menu.notification"),
      onClick: () => navigate("/private/pagina-paciente-ficha"),
    },
    {
      icon: <ChartSpline />,
      label: t("menu.dashboard"),
      onClick: () => navigate("/dashboard-page"),
    },
    {
      icon: <BookType />,
      label: t("menu.educational"),
      onClick: () => {},
    },
    {
      icon: <Building2 />,
      label: t("menu.apps"),
      submenu: true,
      onClick: () => {},
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
      onClick: () => {
        logout();
        navigate("/login");
        onClose();
      },
    },
  ];

  const handleAppNavigation = (link: string) => {
    navigate(link);
    onClose();
  };

  return (
    <>
      {/* Main Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-blue-900 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between mb-6">
            <img
              src="/images/logos/lateral completo.png"
              alt="Logo Saúde Pará"
              className="bg-white rounded p-1"
            />
          </div>
{/* User Profile Header */}
  <UserProfileHeader selectedLanguage={selectedLanguage} />
          {/* Itens do Menu */}
          <div className="flex-grow">
            {menuItems.map((item, i) => (
              <div key={i} className="relative">
                <div
                  className="flex items-center gap-3 text-white py-3 px-2 hover:bg-blue-800 rounded-lg cursor-pointer"
                  onClick={() => {
                    if (item.submenu) {
                      navigate("/private/apps-auxiliares");
                    } else {
                      item.onClick();
                      onClose();
                    }
                  }}
                  onMouseEnter={() => {
                    if (item.submenu) setShowAppsSubmenu(true);
                  }}
                  onMouseLeave={() => {
                    if (item.submenu && !showAppsSubmenu)
                      setShowAppsSubmenu(false);
                  }}
                >
                  <span className="text-white">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-white ml-auto" />
                </div>

                {/* Apps Submenu */}
                {item.submenu && showAppsSubmenu && (
                  <div
                    className="fixed top-0 left-64 w-64 h-full bg-blue-900 z-60 overflow-y-auto"
                    onMouseEnter={() => setShowAppsSubmenu(true)}
                    onMouseLeave={() => setShowAppsSubmenu(false)}
                  >
                    <div className="p-4 flex items-center h-[70px] border-b border-blue-800">
                      <h2 className="text-xl font-bold text-white">
                        Aplicativos Auxiliares
                      </h2>
                    </div>
                    <div>
                      {appsMenuItems.map((appItem) => (
                        <button
                          key={appItem.link}
                          onClick={() => handleAppNavigation(appItem.link)}
                          className="flex items-center w-full gap-3 p-3 hover:bg-blue-800 transition-colors"
                        >
                          {appItem.icon}
                          <span className="text-white text-sm">
                            {appItem.nome}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      )}
    </>
  );
};

export default SideMenu;