// frontend/src/features/apps/components/SideMenuAppsAuxiliares.tsx
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface SideMenuAppsAuxiliaresProps {
  isOpen: boolean;
  onClose: () => void;
  aplicativos: Array<{
    icon: JSX.Element;
    nome: string;
    link: string;
  }>;
}

export const SideMenuAppsAuxiliares = ({
  isOpen,
  onClose,
  aplicativos,
}: SideMenuAppsAuxiliaresProps) => {
  const navigate = useNavigate();

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-blue-900 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Cabeçalho do Menu */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-lg font-semibold">
              Apps Auxiliares
            </h2>
          </div>

          {/* Lista de Aplicativos */}
          <div className="flex-grow">
            {aplicativos.map((app, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-white py-3 px-2 hover:bg-blue-800 rounded-lg cursor-pointer"
                onClick={() => {
                  navigate(app.link);
                  onClose();
                }}
              >
                <span className="text-white">{app.icon}</span>
                <span className="text-sm">{app.nome}</span>
                <ChevronRight className="h-4 w-4 text-white ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          role="button"
          aria-label="Fechar menu"
        />
      )}
    </>
  );
};