import {
    UserCircle,
    FileText,
    Menu,
  } from "lucide-react";
  import { useState, useEffect } from "react";
  import { useNavigate } from "react-router-dom";
  import { useTranslation } from "../../../i18n/useTranslations";
  import { useLanguage } from "../../../contexts/LanguageContext";
  import { SideMenu } from "@/features/apps/components/SideMenu";
  
  type AppConfig = {
    icon: JSX.Element;
    nome: string;
    link: string;
  };
  
  const PaginaPacientesFicha = () => {
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
        icon: <UserCircle className="h-8 w-8 text-white" />,
        nome: "Dados dos Pacientes",
        link: "/pacientes/lista",
      },
      {
        icon: <FileText className="h-8 w-8 text-white" />,
        nome: "Ficha de Comunicação",
        link: "/lista-comunicacao",
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
                  Módulo de Comunicação
                </h1>
              </div>
            </div>
          </div>
        </header>
  
        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
  
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aplicativos.map((app, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavigation(app.link)}
                    disabled={navigationState.isNavigating}
                    className={`group relative bg-blue-600 rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-all
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
                    <div className="p-4 bg-blue-700/20 rounded-full">
                      {app.icon}
                    </div>
                    <span className="text-white text-center text-lg font-medium tracking-wide">
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
  
  export default PaginaPacientesFicha;