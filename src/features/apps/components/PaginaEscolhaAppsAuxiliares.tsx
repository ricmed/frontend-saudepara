import { FileText, Hospital, Menu } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslations";
import { useLanguage } from "../../../contexts/LanguageContext";
import { SideMenu } from "../../home/components/SideMenu";

type AppGroupConfig = {
  icon: JSX.Element;
  titulo: string;
  descricao: string;
  link: string;
  cor: string;
};

const PaginaEscolhaAppsAuxiliares = () => {
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

  const gruposApps: AppGroupConfig[] = [
    {
      icon: <FileText className="h-16 w-16 text-white" />,
      titulo: "Ficha de Comunicação",
      descricao: "Apps auxiliares para gerenciar casos e estabelecimentos",
      link: "/private/apps-auxiliares",
      cor: "from-blue-600 to-blue-700",
    },
    {
      icon: <Hospital className="h-16 w-16 text-white" />,
      titulo: "Formulário DAE",
      descricao: "Gerenciar DAE, NHE, CIEVS e CRS",
      link: "/private/apps-auxiliares-dae",
      cor: "from-purple-600 to-purple-700",
    },
  ];

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
                Escolha os Apps Auxiliares
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Selecione o Grupo de Apps Auxiliares
          </h2>
          <p className="text-lg text-gray-600">
            Escolha qual categoria de aplicativos auxiliares você deseja acessar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {gruposApps.map((grupo, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(grupo.link)}
              disabled={navigationState.isNavigating}
              className={`group relative bg-gradient-to-br ${grupo.cor} rounded-2xl p-8 shadow-xl transition-all duration-300
                ${
                  navigationState.isNavigating
                    ? "opacity-75 cursor-default"
                    : "hover:scale-105 hover:shadow-2xl active:scale-95"
                }
                ${
                  navigationState.targetLink === grupo.link
                    ? "ring-4 ring-blue-300"
                    : ""
                }
              `}
              aria-label={`Acessar ${grupo.titulo}`}
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="p-6 bg-white/20 rounded-full backdrop-blur-sm">
                  {grupo.icon}
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {grupo.titulo}
                  </h3>
                  <p className="text-white/90 text-base leading-relaxed">
                    {grupo.descricao}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-white/80 text-sm font-medium">
                  <span>Acessar</span>
                  <svg
                    className="h-5 w-5 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              {navigationState.targetLink === grupo.link && (
                <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-3xl mx-auto">
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
                Informação
              </h4>
              <p className="text-blue-800 text-sm leading-relaxed">
                Os apps auxiliares permitem gerenciar dados mestres e configurações 
                do sistema, como tipos de estabelecimentos, qualificações, eventos, 
                e informações específicas do DAE.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaginaEscolhaAppsAuxiliares;
