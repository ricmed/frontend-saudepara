// src/features/home/components/SideMenu.tsx
import { 
  Home, 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  X, 
  ChevronRight,
  ClipboardList, // Icone provável para Notificações
  Send // Icone sugerido para Comunicação DAE
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

// ...existing code...

const SideMenu = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/private/dashboard",
    },
    // MOVIDO: Comunicação DAE agora é o segundo item
    {
      label: "Comunicação DAE",
      icon: Send,
      path: "/private/comunicacao-dae",
      subItems: [
        { label: "Nova Comunicação", path: "/private/comunicacao-dae/nova" },
        { label: "Listar Comunicações", path: "/private/comunicacao-dae" }
      ]
    },
    // ...existing code...
    // Outros itens (Notificações, Pacientes, Estabelecimentos, etc.) permanecem aqui
    // ...existing code...
  ];

  return (
    <div className={`fixed inset-0 z-50 transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between h-16 px-4 bg-white border-b shadow-md">
        <div className="text-lg font-semibold">Menu</div>
        <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100">
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {menuItems.map((item, index) => (
          <div key={index} className="relative">
            {/* Item do menu principal */}
            <button
              onClick={() => {
                if (item.subItems) {
                  setActiveSubMenu(activeSubMenu === item.label ? null : item.label);
                } else {
                  navigate(item.path);
                  onClose();
                }
              }}
              className={`flex items-center w-full px-4 py-3 text-sm transition-colors duration-150
                ${location.pathname === item.path 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
              {/* Ícone de seta para submenus */}
              {item.subItems && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </button>

            {/* Renderização do Submenu com correção de UX */}
            {item.subItems && (activeSubMenu === item.label || hoveredItem === item.label) && (
              <div 
                className="absolute left-full top-0 ml-1 w-56 bg-white rounded-r-md shadow-xl border border-gray-100 py-1 z-50
                /* A correção está aqui: criando uma área invisível à esquerda para manter o hover */
                before:content-[''] before:absolute before:-left-4 before:top-0 before:h-full before:w-4 before:bg-transparent"
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {item.subItems.map((subItem, subIndex) => (
                  <button
                    key={subIndex}
                    onClick={() => {
                      navigate(subItem.path);
                      if (window.innerWidth < 1024) onClose();
                      setHoveredItem(null);
                    }}
                    className={`block w-full text-left px-4 py-3 text-sm transition-colors duration-150
                      ${location.pathname === subItem.path 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                      }`}
                  >
                    {subItem.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export { SideMenu };