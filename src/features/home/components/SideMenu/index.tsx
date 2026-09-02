import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslations";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useAuth } from '@/keycloak/AuthProvider';
import useUserPermissions from '@/hooks/useUserPermissions';
import UserProfileHeader from "@/keycloak/components/UserProfileHeader";
import ChatSuporteModal from '@/features/chat/components/ChatSuporteModal';
import { useChatSuporte } from '@/features/chat/hooks/useChatSuporte';
import { useComunicacaoDaeLeituraResumo } from '@/features/comunicacao-dae/hooks/useComunicacaoDaeLeituraResumo';
import {
  FileText,
  ChartSpline,
  Award,
  Network,
  AlertTriangle,
  LogOut,
  Building2,
  ChevronRight,
  GraduationCap,
  Users,
  HeartPulse,
  UserCog,
  Home,
  Database,
  Hospital,
  ClipboardList,
  Settings,
  QrCode,
  LineChart,
} from "lucide-react";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const { t } = useTranslation(selectedLanguage);
  const { user } = useAuth();
  const permissions = useUserPermissions();
  const [showAppsSubmenu, setShowAppsSubmenu] = useState(false);
  
  // ✅ NOVO: Chat de suporte
  const { isOpen: isChatOpen, abrirChat, fecharChat, mensagensNaoLidas } = useChatSuporte();
  const { resumo: comunicacaoDaeLeituraResumo } = useComunicacaoDaeLeituraResumo();

  // Função para verificar se o usuário é admin (incluindo admins hierárquicos)
  const isAdmin = () => {
    if (!user) return false;
    // Verifica se o usuário tem qualquer tipo de role admin
    return user.roles?.some((role: string) => 
      role === 'admin' || 
      role === 'admin.unidade' || 
      role === 'admin.municipio' || 
      role === 'admin.crs' || 
      role === 'admin.estado'
    );
  };

  // Função para verificar se é APENAS admin master (não hierárquico)
  const isAdminMaster = () => {
    if (!user) return false;
    return user.roles?.includes('admin');
  };

  // Função para verificar se é admin.crs
  const isAdminCrs = () => {
    if (!user) return false;
    return user.roles?.includes('admin.crs');
  };

  // ✅ NOVO: Submenu simplificado de Apps Auxiliares - apenas duas categorias principais
  const appsMenuItems = [
    {
      icon: <FileText className="h-6 w-6 text-white" />,
      nome: "Ficha de Comunicação",
      link: "/private/apps-auxiliares",
    },
    {
      icon: <Hospital className="h-6 w-6 text-white" />,
      nome: "Formulário DAE",
      link: "/private/apps-auxiliares-dae",
    },
  ];

  // ✅ REMOVIDO: Submenu de Comunicação DAE - agora acessa diretamente a lista
  // Os apps auxiliares (DAE, NHE, CIEVS, CRS) são acessados via Apps Auxiliares > Formulário DAE

  // ✅ NOVO: Main menu items reorganizados com Home e Gerenciamento Offline
  const menuItems = [
    // ✅ NOVO: Home - sempre visível
    {
      icon: <Home />,
      label: t("menu.home"), // Adicionar tradução: "Início" ou "Home"
      onClick: () => navigate("/"), // ou "/private/dashboard" ou "/"
    },
    
    // Menu Qualificar Estabelecimentos - apenas para qualificadores (OCULTAR para admin.crs)
    ...(!isAdminCrs() && permissions.isQualificador ? [{
      icon: <Award />,
      label: t("menu.qualify_establishments"),
      onClick: () => navigate("/private/relatorio-estabelecimentos"),
    }] : []),
    
    // Menu Notificação - apenas para notificadores (OCULTAR para admin.crs)
    ...(!isAdminCrs() && permissions.isNotificador ? [{
      icon: <FileText />,
      label: t("menu.notification"),
      onClick: () => navigate("/private/comunicacao-de-caso"),
    }] : []),
    
    // Formulários dinâmicos: qualquer usuário logado (a lista vem do GET /api/forms conforme ACL/escopo)
    ...(user
      ? [
          {
            icon: <ClipboardList />,
            label: t("menu.dynamic_forms"),
            onClick: () => navigate("/private/formularios"),
          },
        ]
      : []),

    // ✅ Google-Forms-like: Meus formulários (criadores)
    ...(user && (user.roles?.includes('forms.creator') || isAdmin()) ? [{
      icon: <FileText />,
      label: "Meus formulários",
      onClick: () => {
        navigate("/private/meus-formularios");
        onClose();
      },
    }] : []),
    
    // Menu Dashboard - para notificadores OU usuários com role dashboard (OCULTAR para admin.crs)
    ...(!isAdminCrs() && (permissions.isNotificador || permissions.isDashboard) ? [{
      icon: <ChartSpline />,
      label: t("menu.dashboard"),
      onClick: () => navigate("/dashboard-page"),
    }] : []),

    // ✅ MOVIDO E CORRIGIDO: Menu de Comunicação DAE - Acesso direto à lista
    ...(user && (
      user.roles?.includes('comunicacao.dae') ||
      user.roles?.includes('admin') ||
      user.roles?.includes('admin.estado') ||
      user.roles?.includes('admin.crs')
    ) ? [{
      icon: <FileText />,
      label: "Comunicação DAE",
      onClick: () => navigate("/private/comunicacao-dae"),
      badge: comunicacaoDaeLeituraResumo.nao_lidas > 0 ? comunicacaoDaeLeituraResumo.nao_lidas : undefined,
    }] : []),
    
    // ✅ NOVO: Gerenciamento Offline - disponível para todos os usuários logados
    ...(user ? [{
      icon: <Database />,
      label: t("menu.offline_management"), // Adicionar tradução: "Dados Offline" ou "Gerenciar Offline"
      onClick: () => navigate("/private/offline-management"), // ou "/private/dados-offline"
    }] : []),
    
    // ObservaSUS.PA - portal de vigilância em saúde
    {
      icon: <LineChart />,
      label: t("observasus.menu") || "ObservaSUS.PA",
      onClick: () => {
        navigate("/observasus");
        onClose();
      },
    },

    // Campanhas de Saúde - acesso direto
    {
      icon: <HeartPulse />,
      label: t("campaigns.title") || "Campanhas de Saúde",
      onClick: () => {
        navigate("/campanhas");
        onClose();
      },
    },
    
    // Materiais Educativos - acesso direto
    {
      icon: <GraduationCap />,
      label: t("educationalMaterials.title") || "Materiais Educativos",
      onClick: () => {
        navigate("/materiais-educativos");
        onClose();
      },
    },
    
    // Gerador de QR Code - acesso público
    {
      icon: <QrCode />,
      label: "Gerador de QR Code",
      onClick: () => {
        navigate("/gerador-qrcode");
        onClose();
      },
    },
    
    // Menu de Apps Auxiliares - apenas para admin master (OCULTAR para admin.crs)
    ...(user && isAdminMaster() && !isAdminCrs() ? [{
      icon: <Building2 />,
      label: t("menu.apps"),
      submenu: true,
      onClick: () => {},
    }] : []),
    
    // ✅ NOVO: Gerenciar Formulários - apenas para admin master
    ...(user && isAdminMaster() ? [{
    icon: <Settings />,
    label: "Gerenciar Formulários",
    onClick: () => {
    navigate("/private/formularios-admin");
    onClose();
    },
    }] : []),
    
    // ✅ NOVO: Menu de Lista de Pacientes - apenas para admin master (OCULTAR para admin.crs)
    ...(user && isAdminMaster() && !isAdminCrs() ? [{
      icon: <Users />,
      label: t("menu.patients_list") || "Lista de Pacientes",
      onClick: () => {
        navigate("/private/pacientes");
        onClose();
      },
    }] : []),
    
    {
      icon: <Network />,
      label: t("menu.version"),
      onClick: () => {
        navigate("/versao");
        onClose();
      },
    },
    
    {
      icon: <AlertTriangle />,
      label: t("menu.bug"),
      onClick: () => {
        // ✅ APENAS Admin master vai para dashboard, todos os outros (incluindo admins hierárquicos) abrem o chat
        if (isAdminMaster()) {
          navigate("/admin/chat-suporte");
          onClose();
        } else {
          abrirChat();
          onClose(); // Fechar menu lateral
        }
      },
      badge: mensagensNaoLidas > 0 ? mensagensNaoLidas : undefined, // ✅ Badge com contador
    },
    
    // Menu de Gerenciar Usuários - apenas para admins logados
    ...(user && (isAdmin() || user.roles?.includes('observasus.admin')) ? [{
      icon: <UserCog />,
      label: user.roles?.includes('observasus.admin') && !isAdmin()
        ? 'ObservaSUS — Admin'
        : t("menu.manage_users"),
      onClick: () => {
        if (user.roles?.includes('observasus.admin') && !isAdmin()) {
          navigate('/admin/master/observasus');
        } else if (user.roles?.includes('admin.crs')) {
          navigate("/admin/crs");
        } else if (user.roles?.includes('admin.estado')) {
          navigate("/admin/estado");
        } else if (user.roles?.includes('admin.municipio')) {
          navigate("/admin/municipio");
        } else if (user.roles?.includes('admin.unidade')) {
          navigate("/admin/unidade");
        } else {
          navigate("/admin");
        }
      },
    }] : []),
    
    // Menu de Logout - apenas para usuários logados
    ...(user ? [{
      icon: <LogOut className="rotate-180" />,
      label: t("menu.logout"),
      onClick: () => {
        navigate("/logout");
        onClose();
      },
    }] : []),
  ];

  const handleAppNavigation = (link: string) => {
    navigate(link);
    onClose();
  };

  return (
    <>
      {/* Main Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-blue-900 transform transition-transform duration-300 ease-in-out z-[1100] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <img
              src="/images/logos/lateral completo.png"
              alt="Logo Saúde Pará"
              className="bg-white rounded p-1"
            />
          </div>
          
          {/* User Profile Header */}
          <div className="flex-shrink-0">
            <UserProfileHeader selectedLanguage={selectedLanguage} />
          </div>
          
          {/* Itens do Menu */}
          <div className="flex-grow overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-800">
            {menuItems.map((item, i) => (
              <div
                key={i}
                className="relative group"
                onMouseEnter={() => {
                  if (item.submenu) {
                    setShowAppsSubmenu(true);
                  }
                }}
                // ❌ REMOVIDO onMouseLeave do item pai - deixar o submenu controlar
              >
                <div
                  className="flex items-center gap-3 text-white py-3 px-2 hover:bg-blue-800 rounded-lg cursor-pointer relative z-10"
                  onClick={() => {
                    if (item.submenu) {
                      if (item.label === "Comunicação DAE") {
                        navigate("/private/comunicacao-dae");
                      } else {
                        navigate("/private/escolha-apps-auxiliares");
                      }
                    } else {
                      item.onClick();
                      onClose();
                    }
                  }}
                >
                  <span className="text-white">{item.icon}</span>
                  <span className="text-sm flex-1">{item.label}</span>
                  
                  {/* ✅ NOVO: Badge para notificações */}
                  {(item as any).badge && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                      {(item as any).badge}
                    </span>
                  )}
                  
                  {item.submenu && <ChevronRight className="h-4 w-4 text-white" />}
                </div>

                {/* Apps Submenu */}
                {item.submenu && showAppsSubmenu && item.label !== "Comunicação DAE" && (
                  <div
                    className="fixed top-0 left-64 w-64 h-full bg-blue-900 z-[1110] overflow-y-auto"
                    style={{ marginLeft: "-10px", paddingLeft: "10px" }}
                    onMouseEnter={() => setShowAppsSubmenu(true)}
                    onMouseLeave={() => setShowAppsSubmenu(false)}
                  >
                    {/* Ponte invisível expandida para garantir transição suave */}
                    <div className="absolute top-0 -left-16 w-16 h-full bg-transparent z-50" />
                    
                    <div className="p-4 flex items-center h-[70px] border-b border-blue-800">
                      <h2 className="text-xl font-bold text-white">
                        Aplicativos Auxiliares
                      </h2>
                    </div>
                    <div>
                      {appsMenuItems.map((appItem) => (
                        <button
                          key={appItem.link}
                          onClick={() => handleAppNavigation(appItem.link)}
                          className="flex items-center w-full gap-3 p-3 hover:bg-blue-800 transition-colors"
                        >
                          {appItem.icon}
                          <span className="text-white text-sm">
                            {appItem.nome}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>

          {/* Seletor de Idiomas */}
          <div className="mt-4 border-t border-blue-800 pt-4 flex-shrink-0">
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
            />
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[1050]" onClick={onClose} />
      )}
      
      {/* ✅ Modal de Chat de Suporte - Para todos EXCETO admin master */}
      {user && !isAdminMaster() && (
        <ChatSuporteModal 
          isOpen={isChatOpen} 
          onClose={fecharChat} 
        />
      )}
    </>
  );
};

export default SideMenu;