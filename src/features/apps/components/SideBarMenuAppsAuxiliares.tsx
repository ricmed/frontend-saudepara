import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  FileSpreadsheet,
  Award,
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
  AlertTriangle,
  HeartPulse,
  Stethoscope,
  Thermometer
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

const SideBarMenuAppsAuxiliares = ({ isOpen, onClose }: SidebarMenuProps) => {
  const navigate = useNavigate();

  const aplicativos: MenuItem[] = [
    {
      icon: <Building2 className="h-6 w-6 text-white" />,
      nome: "Componentes",
      link: "/private/componente",
    },
    {
      icon: <FileSpreadsheet className="h-6 w-6 text-white" />,
      nome: "Estabelecimentos",
      link: "/private/tipo-estabelecimentos/lista",
    },
    {
      icon: <Award className="h-6 w-6 text-white" />,
      nome: "Qualificações",
      link: "/relatorio-qualificacao",
    },
    {
      icon: <FileCheck className="h-6 w-6 text-white" />,
      nome: "Habilitações",
      link: "/private/habilitacao",
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-white" />,
      nome: "Tipos de Encerramento",
      link: "/private/encerramento",
    },
    {
      icon: <Users className="h-6 w-6 text-white" />,
      nome: "Tipos de Público",
      link: "/private/publico",
    },
    {
      icon: <Calendar className="h-6 w-6 text-white" />,
      nome: "Tipos de Evento",
      link: "/private/evento",
    },
    {
      icon: <AlertTriangle className="h-6 w-6 text-white" />,
      nome: "Tipos de Trauma",
      link: "/private/trauma",
    },
    {
      icon: <HeartPulse className="h-6 w-6 text-white" />,
      nome: "Tipos de Atendimento",
      link: "/private/atendimento",
    },
    {
      icon: <Stethoscope className="h-6 w-6 text-white" />,
      nome: "Tipos de Hipótese Diagnóstica",
      link: "/private/hipotese-diagnostica",
    },
    {
      icon: <Thermometer className="h-6 w-6 text-white" />,
      nome: "Tipos de Sintoma",
      link: "/private/sintoma",
    },
    {
      icon: <Clock className="h-6 w-6 text-white" />,
      nome: "Turno",
      link: "/private/turnos",
    },
    {
      icon: <Leaf className="h-6 w-6 text-white" />,
      nome: "Natureza",
      link: "/private/naturezas",
    },
    {
      icon: <UserSquare className="h-6 w-6 text-white" />,
      nome: "Raça",
      link: "/private/raca",
    },
    {
      icon: <GraduationCap className="h-6 w-6 text-white" />,
      nome: "Escolaridade", 
      link: "/private/escolaridade",
    },
    {
      icon: <Building2 className="h-6 w-6 text-white" />,
      nome: "CBO",
      link: "/private/cbo",
    },
    {
      icon: <MapPin className="h-6 w-6 text-white" />,
      nome: "Países",
      link: "/private/pais",
    },
    {
      icon: <Map className="h-6 w-6 text-white" />,
      nome: "Estados",
      link: "/private/estado",
    },
    {
      icon: <MapPin className="h-6 w-6 text-white" />,
      nome: "Municípios",
      link: "/private/municipio",
    },
    {
      icon: <MapPin className="h-6 w-6 text-white" />,
      nome: "Gênero",
      link: "/private/genero",
    },
    {
      icon: <MapPin className="h-6 w-6 text-white" />,
      nome: "Orientação Sexual",
      link: "/orientacao-sexual/lista",
    }
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
          <h2 className="text-xl font-bold mb-6">Aplicativos Auxiliares</h2>
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

export default SideBarMenuAppsAuxiliares;