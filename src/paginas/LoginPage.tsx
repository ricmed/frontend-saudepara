import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n/useTranslations";
import { useLanguage } from "../contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";

const LoginPage = () => {
  const { selectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto">
      <div className="border-8 border-gray-800 rounded-[2.5rem] overflow-hidden h-[720px] relative bg-gray-50">
        <div className="bg-gray-800 h-6 w-40 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl"></div>

        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 p-4">
            <div className="flex items-center mb-4">
              <ArrowLeft
                className="h-6 w-6 text-white cursor-pointer"
                onClick={() => navigate(-1)}
              />
              <h1 className="text-white text-xl ml-4">Login</h1>
            </div>

            <div className="flex justify-center items-center space-x-0">
              <img
                src="/mnt/data/Logo Topo Sespa.png"
                alt="SESPA"
                className="h-8 w-auto"
              />
              <img
                src="/mnt/data/Logo Topo Saude Para.png"
                alt="Saúde Pará"
                className="h-12 w-auto"
              />
              <img
                src="/mnt/data/Logo Topo Bandeira.png"
                alt="Bandeira"
                className="h-6 w-auto"
              />
            </div>
          </div>

          {/* Formulário */}
          <div className="flex-1 p-6 flex flex-col justify-center">
            <h2 className="text-xl font-semibold text-center text-gray-800 mb-8">
              Login - Saúde Pará
            </h2>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite seu e-mail"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite sua senha"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
                </label>
                <a href="#" className="text-sm text-blue-600">
                  Esqueceu a senha?
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
              >
                Entrar
              </button>

              <div className="text-center">
                <a href="#" className="text-sm text-blue-600">
                  Acesso ao Dashboard
                </a>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
            <span className="text-xs text-gray-500">
              Secretaria de Estado de Saúde Pública © 2024
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
