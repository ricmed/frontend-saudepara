import React from "react";
import { AdminHeader } from "@/keycloak/admin/components/AdminHeader";
import Footer from "@/features/desktop/components/Footer";
import { SideMenu } from "@/features/home/components/SideMenu";
import { useNavigate } from "react-router-dom";
import { Language } from "@/i18n/types";
import { Info, Calendar, Code, Users, Shield, ArrowLeft } from "lucide-react";

const VersionPage: React.FC = () => {
  const [selectedLanguage] = React.useState<Language>("pt-BR");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const appVersion = "1.0.0";
  const releaseDate = "2025-10-08";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <AdminHeader
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        selectedLanguage={selectedLanguage}
      />

      {/* SideMenu */}
      <SideMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Botão de Voltar */}
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Voltar para Home</span>
          </button>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
                <div className="relative bg-blue-600 rounded-2xl p-6 shadow-xl">
                  <img
                    src="/images/logos/Logo Topo Saude Para.png"
                    alt="Saúde Pará"
                    className="h-28 md:h-32 w-auto"
                  />
                </div>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              App Saúde Pará
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Sistema de Comunicação de Casos para Eventos de Massa
            </p>
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg">
              <Code className="h-5 w-5" />
              <span className="text-lg font-semibold">Versão {appVersion}</span>
            </div>
          </div>

          {/* Information Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Version Info Card */}
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Info className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Informações da Versão
                  </h2>
                  <div className="space-y-2 text-gray-600">
                    <p>
                      <span className="font-medium">Versão:</span> {appVersion}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Release Date Card */}
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Data de Lançamento
                  </h2>
                  <div className="space-y-2 text-gray-600">
                    <p>
                      <span className="font-medium">Lançamento:</span>{" "}
                      {new Date(releaseDate).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ativo
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Card */}
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Principais Recursos
                  </h2>
                  <ul className="space-y-2 text-gray-600 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Sistema de comunicação de casos de saúde pública</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Gestão de estabelecimentos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Dashboard analítico</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Modo offline</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Integração Keycloak</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Segurança
                  </h2>
                  <ul className="space-y-2 text-gray-600 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Autenticação via Keycloak</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Controle de acesso hierárquico</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Criptografia de dados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>HTTPS obrigatório</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Information */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Informações Técnicas
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">React 18</div>
                <div className="text-blue-100">Framework Frontend</div>
              </div>
              <div className="text-center border-l border-r border-blue-400 md:border-l md:border-r-0 md:px-6">
                <div className="text-3xl font-bold mb-1">TypeScript</div>
                <div className="text-blue-100">Linguagem</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">Node.js</div>
                <div className="text-blue-100">Backend Runtime</div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center text-gray-600">
            <p className="mb-2">
              Desenvolvido pela{" "}
              <span className="font-semibold text-blue-600">
                Secretaria de Estado de Saúde Pública do Pará
              </span>
            </p>
            <p className="text-sm">
              © {new Date().getFullYear()} - Todos os direitos reservados
            </p>
          </div>
        </div>
      </main>

      <Footer selectedLanguage={selectedLanguage} />
    </div>
  );
};

export default VersionPage;
