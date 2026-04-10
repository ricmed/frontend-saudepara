import { Hospital, Activity, AlertTriangle, Building2, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslations";
import { useLanguage } from "../../../contexts/LanguageContext";
import { SideMenu } from "../../home/components/SideMenu";

type AppConfig = {
  icon: JSX.Element;
  nome: string;
  descricao: string;
  link: string;
  cor: string;
};

const PaginaAppsAuxiliaresDae = () => {
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

  const handleNavigation = (link: string) => {
    if (navigationState.isNavigating) return;
    setNavigationState({ isNavigating: true, targetLink: link });
    navigate(link);
  };

  const aplicativos: AppConfig[] = [
    {
      icon: <Hospital className="h-8 w-8 text-white" />,
      nome: "DAE",
      descricao: "Doenças e Agravos de Notificação",
      link: "/private/apps/comunicacao-dae/dae",
      cor: "from-blue-600 to-blue-700",
    },
    {
      icon: <Activity className="h-8 w-8 text-white" />,
      nome: "NHE",
      descricao: "Núcleo Hospitalar de Epidemiologia",
      link: "/private/apps/comunicacao-dae/nhe",
      cor: "from-green-600 to-green-700",
    },
    {
      icon: <AlertTriangle className="h-8 w-8 text-white" />,
      nome: "CIEVS",
      descricao: "Centro de Informações Estratégicas de Vigilância em Saúde",
      link: "/private/apps/comunicacao-dae/cievs",
      cor: "from-purple-600 to-purple-700",
    },
    {
      icon: <Building2 className="h-8 w-8 text-white" />,
      nome: "CRS",
      descricao: "Centro Regional de Saúde",
      link: "/private/apps/comunicacao-dae/crs",
      cor: "from-orange-600 to-orange-700",
    },
  ];

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
                onClick={() => navigate('/private/escolha-apps-auxiliares')}
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
                Apps Auxiliares - Formulário DAE
              </h1>
            </div>
          </div>
        </div>
      </header>

      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        selectedLanguage={selectedLanguage}
        onLanguageChange={() => {}}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Gerenciamento de DAE
          </h2>
          <p className="text-gray-600">
            Acesse os aplicativos auxiliares para gerenciar informações de Doenças, Agravos e Eventos
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {aplicativos.map((app, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigation(app.link)}
                  disabled={navigationState.isNavigating}
                  className={`group relative bg-gradient-to-br ${app.cor} rounded-xl p-6 flex flex-col items-center justify-center gap-4 transition-all shadow-lg
                    ${
                      navigationState.isNavigating
                        ? "opacity-75 cursor-default"
                        : "hover:scale-105 hover:shadow-2xl active:scale-95"
                    }
                    ${
                      navigationState.targetLink === app.link
                        ? "ring-4 ring-blue-300"
                        : ""
                    }
                  `}
                  aria-label={`Acessar ${app.nome}`}
                >
                  <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                    {app.icon}
                  </div>
                  
                  <div className="text-center">
                    <span className="text-white text-xl font-bold tracking-wide block mb-2">
                      {app.nome}
                    </span>
                    <span className="text-white/90 text-xs leading-tight block">
                      {app.descricao}
                    </span>
                  </div>

                  {navigationState.targetLink === app.link && (
                    <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <div className="animate-spin rounded-full h-8 w-8 border-3 border-white border-t-transparent"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-blue-900 mb-2">
                Sobre os Apps Auxiliares do DAE
              </h4>
              <ul className="text-blue-800 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>DAE:</strong> Gerenciar cadastros de Doenças e Agravos de Notificação</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>NHE:</strong> Administrar informações do Núcleo Hospitalar de Epidemiologia</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>CIEVS:</strong> Gerenciar dados do Centro de Informações Estratégicas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>CRS:</strong> Administrar informações dos Centros Regionais de Saúde</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaginaAppsAuxiliaresDae;
