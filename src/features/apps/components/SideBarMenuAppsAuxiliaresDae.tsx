import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hospital,
  Activity,
  AlertTriangle,
  Building2
} from 'lucide-react';

interface MenuItem {
  icon: ReactNode;
  nome: string;
  link: string;
}

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideBarMenuAppsAuxiliaresDae = ({ isOpen, onClose }: SidebarMenuProps) => {
  const navigate = useNavigate();

  const aplicativos: MenuItem[] = [
    {
      icon: <Hospital className="h-6 w-6 text-white" />,
      nome: "DAE - Doenças e Agravos",
      link: "/private/apps/comunicacao-dae/dae",
    },
    {
      icon: <Activity className="h-6 w-6 text-white" />,
      nome: "NHE - Núcleo Hospitalar",
      link: "/private/apps/comunicacao-dae/nhe",
    },
    {
      icon: <AlertTriangle className="h-6 w-6 text-white" />,
      nome: "CIEVS - Centro de Vigilância",
      link: "/private/apps/comunicacao-dae/cievs",
    },
    {
      icon: <Building2 className="h-6 w-6 text-white" />,
      nome: "CRS - Centro Regional",
      link: "/private/apps/comunicacao-dae/crs",
    },
  ];

  const handleNavigation = (link: string) => {
    navigate(link);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-blue-800 text-white transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex-shrink-0">
          <h2 className="text-xl font-bold mb-6">Apps Auxiliares - DAE</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <nav className="space-y-1">
            {aplicativos.map((item) => (
              <button
                key={item.link}
                onClick={() => handleNavigation(item.link)}
                className="flex items-center w-full gap-3 p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {item.icon}
                <span className="truncate">{item.nome}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default SideBarMenuAppsAuxiliaresDae;
