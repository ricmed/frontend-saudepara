import {  Building2,  Award,  FileSpreadsheet,  FileCheck,  Clock,  Leaf,  Menu,  GraduationCap,  UserSquare,  MapPin, Map, CheckCircle, Users, Calendar, AlertTriangle, HeartPulse, Stethoscope, Thermometer} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslations";
import { useLanguage } from "../../../contexts/LanguageContext";
import { SideMenu } from "./SideMenu";

type AppConfig = {
  icon: JSX.Element;
  nome: string;
  link: string;
};

const PaginaAppsAuxiliares = () => {
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const navigate = useNavigate();
  const [navigationState, setNavigationState] = useState<{
    isNavigating: boolean;
    targetLink: string;
  }>({
    isNavigating: false,
    targetLink: "",
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const aplicativos: AppConfig[] = [
    {
      icon: <Building2 className="h-8 w-8 text-white" />,
      nome: "Componentes",
      link: "/lista-componentes",
    },
    {
      icon: <FileSpreadsheet className="h-8 w-8 text-white" />,
      nome: "Tipos de Estabelecimentos",
      link: "/estabelecimentos/lista",
    },
    {
      icon: <Award className="h-8 w-8 text-white" />,
      nome: "Qualificações",
      link: "/qualificacao/lista",
    },
    {
      icon: <FileCheck className="h-8 w-8 text-white" />,
      nome: "Habilitações",
      link: "/lista-habilitacoes",
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-white" />,
      nome: "Tipos de Encerramento",
      link: "/lista-tipos-encerramento",
    },
    {
      icon: <Users className="h-8 w-8 text-white" />,
      nome: "Tipos de Público",
      link: "/lista-tipos-publico",
    },
    {
      icon: <Calendar className="h-8 w-8 text-white" />,
      nome: "Tipos de Evento",
      link: "/lista-tipos-evento",
    },
    {
      icon: <AlertTriangle className="h-8 w-8 text-white" />,
      nome: "Tipos de Trauma",
      link: "/lista-tipos-trauma",
    },
    {
      icon: <HeartPulse className="h-8 w-8 text-white" />,
      nome: "Tipos de Atendimento",
      link: "/lista-tipos-atendimento",
    },
    {
      icon: <Stethoscope className="h-8 w-8 text-white" />,
      nome: "Tipos de Hipótese Diagnóstica",
      link: "/lista-tipos-hipotese-diag",
    },
    {
      icon: <Thermometer className="h-8 w-8 text-white" />,
      nome: "Tipos de Sintoma",
      link: "/lista-tipos-sintoma",
    },
    {
      icon: <Clock className="h-8 w-8 text-white" />,
      nome: "Turno",
      link: "/turnos",
    },
    {
      icon: <Leaf className="h-8 w-8 text-white" />,
      nome: "Natureza",
      link: "/naturezas",
    },
    {
      icon: <UserSquare className="h-8 w-8 text-white" />,
      nome: "Raça",
      link: "/raca/lista",
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-white" />,
      nome: "Escolaridade", 
      link: "/escolaridade/lista",
    },
    {
      icon: <Building2 className="h-8 w-8 text-white" />,
      nome: "CBO",
      link: "/cbo/lista",
    },
    {
      icon: <MapPin className="h-8 w-8 text-white" />,
      nome: "Países",
      link: "/pais/lista",
    },
    {
      icon: <Map className="h-8 w-8 text-white" />,
      nome: "Estados",
      link: "/estado/lista",
    },
    {
      icon: <MapPin className="h-8 w-8 text-white" />,
      nome: "Municípios",
      link: "/municipio/lista",
    },
    {
      icon: <MapPin className="h-8 w-8 text-white" />,
      nome: "Gênero Sexual",
      link: "/genero/lista",
    }
  ];

  const handleNavigation = (link: string) => {
    if (navigationState.isNavigating) return;
    setNavigationState({ isNavigating: true, targetLink: link });
    navigate(link);
  };

  useEffect(() => {
    const unlisten = () => {
      setNavigationState({ isNavigating: false, targetLink: "" });
    };
    return unlisten;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 text-white hover:bg-blue-700 rounded-lg transition-colors"
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6" />
              </button>

              <button
                onClick={() => navigate('/')}
                className="p-2 text-white hover:bg-blue-700 rounded-lg transition-colors"
                aria-label={t("voltar")}
                disabled={navigationState.isNavigating}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <h1 className="text-white text-xl font-semibold">
                Apps Auxiliares
              </h1>
            </div>
          </div>
        </div>
      </header>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {aplicativos.map((app, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigation(app.link)}
                  disabled={navigationState.isNavigating}
                  className={`group relative bg-blue-600 rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all
                    ${
                      navigationState.isNavigating
                        ? "opacity-75 cursor-default"
                        : "hover:scale-105 hover:shadow-xl hover:bg-blue-700 active:scale-95"
                    }
                    ${
                      navigationState.targetLink === app.link
                        ? "ring-2 ring-blue-300"
                        : ""
                    }
                  `}
                  aria-label={`Acessar ${app.nome}`}
                >
                  <div className="p-3 bg-blue-700/20 rounded-full">
                    {app.icon}
                  </div>
                  <span className="text-white text-center text-sm font-medium tracking-wide">
                    {app.nome}
                  </span>

                  {navigationState.targetLink === app.link && (
                    <div className="absolute inset-0 bg-blue-800/50 rounded-xl flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaginaAppsAuxiliares;