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
      link: "/lista-componentes",
    },
    {
      icon: <FileSpreadsheet className="h-6 w-6 text-white" />,
      nome: "Estabelecimentos",
      link: "/estabelecimentos/lista",
    },
    {
      icon: <Award className="h-6 w-6 text-white" />,
      nome: "Qualificações",
      link: "/relatorio-qualificacao",
    },
    {
      icon: <FileCheck className="h-6 w-6 text-white" />,
      nome: "Habilitações",
      link: "/lista-habilitacoes",
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-white" />,
      nome: "Tipos de Encerramento",
      link: "/lista-tipos-encerramento",
    },
    {
      icon: <Users className="h-6 w-6 text-white" />,
      nome: "Tipos de Público",
      link: "/lista-tipos-publico",
    },
    {
      icon: <Calendar className="h-6 w-6 text-white" />,
      nome: "Tipos de Evento",
      link: "/lista-tipos-evento",
    },
    {
      icon: <AlertTriangle className="h-6 w-6 text-white" />,
      nome: "Tipos de Trauma",
      link: "/lista-tipos-trauma",
    },
    {
      icon: <HeartPulse className="h-6 w-6 text-white" />,
      nome: "Tipos de Atendimento",
      link: "/lista-tipos-atendimento",
    },
    {
      icon: <Stethoscope className="h-6 w-6 text-white" />,
      nome: "Tipos de Hipótese Diagnóstica",
      link: "/lista-tipos-hipotese-diag",
    },
    {
      icon: <Thermometer className="h-6 w-6 text-white" />,
      nome: "Tipos de Sintoma",
      link: "/lista-tipos-sintoma",
    },
    {
      icon: <Clock className="h-6 w-6 text-white" />,
      nome: "Turno",
      link: "/turnos",
    },
    {
      icon: <Leaf className="h-6 w-6 text-white" />,
      nome: "Natureza",
      link: "/naturezas",
    },
    {
      icon: <UserSquare className="h-6 w-6 text-white" />,
      nome: "Raça",
      link: "/raca/lista",
    },
    {
      icon: <GraduationCap className="h-6 w-6 text-white" />,
      nome: "Escolaridade", 
      link: "/escolaridade/lista",
    },
    {
      icon: <Building2 className="h-6 w-6 text-white" />,
      nome: "CBO",
      link: "/cbo/lista",
    },
    {
      icon: <MapPin className="h-6 w-6 text-white" />,
      nome: "Países",
      link: "/pais/lista",
    },
    {
      icon: <Map className="h-6 w-6 text-white" />,
      nome: "Estados",
      link: "/estado/lista",
    },
    {
      icon: <MapPin className="h-6 w-6 text-white" />,
      nome: "Municípios",
      link: "/municipio/lista",
    },
    {
      icon: <MapPin className="h-6 w-6 text-white" />,
      nome: "Gênero",
      link: "/genero/lista",
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