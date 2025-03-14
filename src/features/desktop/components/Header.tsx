import React from 'react';
import { Search, Menu, Bell } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  isMobile?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMobile = true }) => {
  return isMobile ? (
    <header className="p-4">
      <div className="flex justify-between">
        <Menu className="h-6 w-6 text-white cursor-pointer" onClick={onMenuToggle} />
        <Bell className="h-6 w-6 text-white" />
      </div>
      
      {/* Logos */}
      <div className="mt-2 flex justify-between items-center">
        <div className="text-white">
          <div className="text-xs">SECRETARIA DE</div>
          <div className="font-bold">SAÚDE PÚBLICA</div>
        </div>
        
        <div className="flex items-center">
          <img src="./images/logos/Logo Topo Saude Para.png" alt="Saúde Pará Logo" className="h-10 w-auto mr-2" />
          <img src="./images/logos/Logo Topo Bandeira.png" alt="Bandeira Logo" className="h-6 w-auto" />
        </div>
      </div>
      
      {/* Barra de busca */}
      <div className="mt-4 relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-white/60" />
        </div>
        <input
          type="text"
          placeholder="Buscar serviços"
          className="w-full bg-blue-500/40 border-none rounded-full py-2 pl-10 pr-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>
    </header>
  ) : (
    <header className="bg-blue-600 px-6 py-4">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <div className="flex items-center">
            <div className="text-white mr-4">
              <div className="text-sm">SECRETARIA DE</div>
              <div className="font-bold text-lg">SAÚDE PÚBLICA</div>
            </div>
            <img src="./images/logos/Logo Topo Saude Para.png" alt="Saúde Pará Logo" className="h-12 w-auto mr-2" />
            <img src="./images/logos/Logo Topo Bandeira.png" alt="Bandeira Logo" className="h-8 w-auto" />
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-white font-medium hover:text-blue-100 transition">Início</a>
            <a href="/servicos" className="text-white font-medium hover:text-blue-100 transition">Serviços</a>
            <a href="/unidades" className="text-white font-medium hover:text-blue-100 transition">Unidades</a>
            <a href="/campanhas" className="text-white font-medium hover:text-blue-100 transition">Campanhas</a>
            <a href="/contato" className="text-white font-medium hover:text-blue-100 transition">Contato</a>
          </nav>
        </div>
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-white/60" />
          </div>
          <input
            type="text"
            placeholder="Buscar serviços"
            className="w-full bg-[#4D6FFF]/40 border-none rounded-full py-2 pl-10 pr-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;