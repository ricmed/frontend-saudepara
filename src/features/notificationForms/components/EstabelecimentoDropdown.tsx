import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, Search, X } from "lucide-react";

interface Estabelecimento {
  idestabelecimento: number;
  nome: string;
  cidade?: string;
  bairro?: string;
  cnes?: string;
}

interface EstabelecimentoDropdownProps {
  isOpen: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  loading: boolean;
  estabelecimentos: Estabelecimento[];
  onSelect: (estabelecimento: Estabelecimento) => void;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLElement>;
}

const EstabelecimentoDropdown: React.FC<EstabelecimentoDropdownProps> = ({
  isOpen,
  searchTerm,
  onSearchChange,
  loading,
  estabelecimentos,
  onSelect,
  onClose,
  buttonRef
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  // Salvar a posição de scroll atual
  const scrollPositionRef = useRef({ x: 0, y: 0 });

  // Atualiza a posição do dropdown quando aberto
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 350) // Usar uma largura maior entre o botão e 350px
      });
      
      // Salvar posição atual de scroll
      scrollPositionRef.current = {
        x: window.scrollX,
        y: window.scrollY
      };
    }
  }, [isOpen, buttonRef]);

  // Restaurar a posição de scroll ao abrir o dropdown
  useEffect(() => {
    if (isOpen) {
      // Pequeno timeout para garantir que o scroll seja restaurado após qualquer mudança de DOM
      const timeoutId = setTimeout(() => {
        window.scrollTo(scrollPositionRef.current.x, scrollPositionRef.current.y);
      }, 10);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Manipulador para fechar o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Handler para evitar reset de scroll no input de busca
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
    // Garante que a página não role
    e.stopPropagation();
  };
  
  // Handler para evitar scroll no clique do input de busca
  const handleSearchInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        zIndex: 9999,
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb'
      }}
    >
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar unidade notificadora..."
            className="w-full pl-9 p-2 text-sm border border-gray-200 rounded-md"
            value={searchTerm}
            onChange={handleSearchInputChange}
            onClick={handleSearchInputClick}
          />
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          {searchTerm && (
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={() => onSearchChange("")}
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-pulse flex gap-2 items-center justify-center">
              <div className="h-4 w-4 bg-blue-400 rounded-full"></div>
              <span>Buscando...</span>
            </div>
          </div>
        ) : estabelecimentos.length > 0 ? (
          estabelecimentos.map((unidade) => (
            <button
              key={unidade.idestabelecimento}
              type="button"
              className="w-full p-4 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 text-left"
              onClick={() => onSelect(unidade)}
            >
              <div className="font-medium text-blue-700">{unidade.nome}</div>
              {unidade.cidade && (
                <div className="text-xs text-gray-500 mt-1 flex items-center">
                  <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                  {unidade.cidade}{unidade.bairro ? `, ${unidade.bairro}` : ''}
                </div>
              )}
              {unidade.cnes && (
                <div className="text-xs text-gray-500 mt-1">
                  CNES: {unidade.cnes}
                </div>
              )}
            </button>
          ))
        ) : searchTerm && searchTerm.length >= 2 ? (
          <div className="p-4 text-sm text-gray-500 text-center">
            Nenhum estabelecimento encontrado para "{searchTerm}".
            <button 
              className="ml-1 text-blue-500 hover:underline block mx-auto mt-1" 
              onClick={() => onSearchChange("")}
              type="button"
            >
              Limpar busca
            </button>
          </div>
        ) : (
          <div className="p-4 text-sm text-gray-500 text-center">
            Digite pelo menos 2 caracteres para iniciar a busca.
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default EstabelecimentoDropdown;