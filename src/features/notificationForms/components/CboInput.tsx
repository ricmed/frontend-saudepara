import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";

// Lista de profissões CBO
const cboOptions = [
    "Acabador de Calçados",
    "Açougueiro",
    "Administrador",
    "Advogado",
    "Agente administrativo",
    "Agente comunitário de saúde",
    "Agente de saúde pública",
    "Agente de segurança",
    "Agente de turismo",
    "Agente de viagens",
    "Agricultor",
    "Agrimensor",
    "Agrônomo",
    "Ajudante de cozinha",
    "Ajudante de obras",
    "Alfaiate",
    "Almoxarife",
    "Analista ambiental",
    "Analista de marketing",
    "Analista de recursos humanos",
    "Analista de sistemas",
    "Analista financeiro",
    "Antropólogo",
    "Apicultor",
    "Árbitro esportivo",
    "Arqueólogo",
    "Arquiteto",
    "Arquivista",
    "Arte-finalista",
    "Artesão",
    "Assistente administrativo",
    "Assistente de produção",
    "Assistente social",
    "Astrólogo",
    "Astrônomo",
    "Atendente de farmácia",
    "Atendente de telemarketing",
    "Ator",
    "Auditor",
    "Auxiliar de creche",
    "Auxiliar de enfermagem",
    "Auxiliar de escritório",
    "Auxiliar de laboratório",
    "Auxiliar de produção",
    "Auxiliar de serviços gerais",
    "Auxiliar veterinário",
    "Avaliador de imóveis",
    "Azulejista",
    "Babá",
    "Bailarino",
    "Balconista",
    "Barbeiro",
    "Barman",
    "Bibliotecário",
    "Biólogo",
    "Biomédico",
    "Bombeiro",
    "Bombeiro hidráulico",
    "Cabeleireiro",
    "Caixa",
    "Camareiro",
    "Caminhoneiro",
    "Canteiro de obras",
    "Cantor",
    "Capataz",
    "Carpinteiro",
    "Carteiro",
    "Cenógrafo",
    "Ceramista",
    "Chef de cozinha",
    "Churrasqueiro",
    "Cientista da computação",
    "Cientista político",
    "Cinegrafista",
    "Cirurgião-dentista",
    "Coach",
    "Cobrador",
    "Comissário de bordo",
    "Confeiteiro",
    "Consultor",
    "Contador",
    "Controlador de tráfego aéreo",
    "Coordenador pedagógico",
    "Copeiro",
    "Corretor de imóveis",
    "Corretor de seguros",
    "Costureiro",
    "Coveiro",
    "Cozinheiro",
    "Dançarino",
    "Decorador",
    "Dentista",
    "Depilador",
    "Desenhista",
    "Despachante",
    "Designer de interiores",
    "Designer gráfico",
    "Diretor de arte",
    "Diretor de cinema",
    "Diretor de escola",
    "Diretor de fotografia",
    "Diretor de teatro",
    "Disc jockey (DJ)",
    "Doceiro",
    "Economista",
    "Editor",
    "Editor de vídeo",
    "Educador físico",
    "Eletricista",
    "Embalador",
    "Empregado doméstico",
    "Empresário",
    "Enfermeiro",
    "Engenheiro",
    "Engenheiro agrônomo",
    "Engenheiro ambiental",
    "Engenheiro civil",
    "Engenheiro de alimentos",
    "Engenheiro de produção",
    "Engenheiro elétrico",
    "Engenheiro florestal",
    "Engenheiro mecânico",
    "Engraxate",
    "Enólogo",
    "Enrolador de motor",
    "Entregador",
    "Entrevistador",
    "Estatístico",
    "Esteticista",
    "Estofador",
    "Estoquista",
    "Farmacêutico",
    "Faxineiro",
    "Feirante",
    "Ferramenteiro",
    "Ferreiro",
    "Fisioterapeuta",
    "Florista",
    "Fonoaudiólogo",
    "Forneiro",
    "Fotógrafo",
    "Frentista",
    "Funileiro",
    "Garçom",
    "Gari",
    "Geógrafo",
    "Geólogo",
    "Gerente comercial",
    "Gerente de loja",
    "Gerente de produção",
    "Gerente financeiro",
    "Gesseiro",
    "Governanta",
    "Guia turístico",
    "Historiador",
    "Inspetor de qualidade",
    "Instalador de painéis",
    "Instrutor de autoescola",
    "Intérprete",
    "Jardineiro",
    "Joalheiro",
    "Jornalista",
    "Juiz",
    "Lavador de carros",
    "Lavrador",
    "Leiturista",
    "Lenhador",
    "Locutor",
    "Magarefe",
    "Manicure",
    "Manobrista",
    "Maquiador",
    "Marceneiro",
    "Marinheiro",
    "Massagista",
    "Matemático",
    "Mecânico",
    "Médico",
    "Médico veterinário",
    "Meteorologista",
    "Metrô-ferroviário",
    "Microempreendedor",
    "Militar",
    "Mineiro",
    "Modelista",
    "Modelo",
    "Montador",
    "Montador de móveis",
    "Motociclista",
    "Motorista",
    "Musicista",
    "Musicoterapeuta",
    "Nutricionista",
    "Oceanógrafo",
    "Operador de áudio",
    "Operador de caixa",
    "Operador de câmera",
    "Operador de empilhadeira",
    "Operador de máquinas",
    "Operador de telemarketing",
    "Padeiro",
    "Pedagogo",
    "Pediatra",
    "Pedreiro",
    "Peixeiro",
    "Peleteiro",
    "Perfumista",
    "Pescador",
    "Piloto",
    "Pintor",
    "Pizzaiolo",
    "Podólogo",
    "Policial",
    "Polidor",
    "Porteiro",
    "Produtor cultural",
    "Produtor musical",
    "Produtor rural",
    "Professor",
    "Programador",
    "Promotor de vendas",
    "Psicólogo",
    "Publicitário",
    "Químico",
    "Radialista",
    "Radiologista",
    "Recepcionista",
    "Reciclador",
    "Recreador",
    "Redator",
    "Relojoeiro",
    "Representante comercial",
    "Sapateiro",
    "Secretário",
    "Segurança",
    "Serralheiro",
    "Servente de obras",
    "Síndico",
    "Sociólogo",
    "Soldador",
    "Supervisor",
    "Tapeceiro",
    "Tatuador",
    "Taxista",
    "Técnico agrícola",
    "Técnico de enfermagem",
    "Técnico de informática",
    "Técnico de laboratório",
    "Técnico de segurança do trabalho",
    "Técnico em edificações",
    "Técnico em eletrônica",
    "Técnico em mecânica",
    "Técnico em refrigeração",
    "Técnico em telecomunicações",
    "Telefonista",
    "Terapeuta ocupacional",
    "Torneiro mecânico",
    "Tosador de animais",
    "Trabalho voluntário",
    "Tradutor",
    "Transportador",
    "Tratorista",
    "Vendedor",
    "Verdureiro",
    "Veterinário",
    "Vidraceiro",
    "Vigilante",
    "Vistoriador",
    "Zelador",
    "Zootecnista",
    "Não se aplica",
  ];

interface CboInputProps {
  value: string;
  onChange: (value: string) => void;
  name: string;
  placeholder?: string;
  className?: string;
  label?: string;
}

const CboInput: React.FC<CboInputProps> = ({
  value,
  onChange,
  name,
  placeholder = "Pesquisar profissão",
  className = "",
  label = "Profissão/Ocupação (CBO)",
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Salvar a posição de scroll atual
  const scrollPositionRef = useRef({ x: 0, y: 0 });

  // Inicializar com valor existente, se houver
  useEffect(() => {
    if (value) {
      setSearchQuery(value);
    }
  }, []);

  // Manipulador para fechar o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Atualiza a posição do dropdown quando aberto
  useEffect(() => {
    if (isDropdownOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    }
  }, [isDropdownOpen]);
  
  // Restaurar a posição de scroll ao abrir o dropdown
  useEffect(() => {
    if (isDropdownOpen) {
      // Pequeno timeout para garantir que o scroll seja restaurado após qualquer mudança de DOM
      const timeoutId = setTimeout(() => {
        window.scrollTo(scrollPositionRef.current.x, scrollPositionRef.current.y);
      }, 10);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isDropdownOpen]);

  const handleFocus = () => {
    // Salvar posição atual de scroll
    scrollPositionRef.current = {
      x: window.scrollX,
      y: window.scrollY
    };
    
    // Abrir dropdown
    setIsDropdownOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleProfessionSelect = (profession: string) => {
    // Salvar posição de scroll atual
    const scrollPosition = {
      x: window.scrollX,
      y: window.scrollY
    };
    
    setSearchQuery(profession);
    onChange(profession);
    setIsDropdownOpen(false);
    
    // Pequeno timeout para garantir que o scroll seja restaurado após fechar o dropdown
    setTimeout(() => {
      window.scrollTo(scrollPosition.x, scrollPosition.y);
    }, 10);
  };

  const handleClear = () => {
    setSearchQuery("");
    onChange("");
  };

  // Filtra profissões baseado na busca
  const filteredProfessions = searchQuery
    ? cboOptions.filter(
        profession =>
          profession.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : cboOptions;

  // Renderiza o dropdown em um portal fora da hierarquia DOM
  const renderDropdown = () => {
    if (!isDropdownOpen) return null;
    
    return createPortal(
      <div 
        ref={dropdownRef}
        style={{
          position: 'absolute',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          zIndex: 9999,
          width: `${inputRef.current ? inputRef.current.offsetWidth : 290}px`,
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb'
        }}
      >
        <div className="p-2 border-b border-gray-100">
          <input
            type="text"
            placeholder="Filtrar profissões..."
            className="w-full p-2 text-sm border border-gray-200 rounded-md"
            value={searchQuery}
            onChange={handleInputChange}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div 
          className="max-h-60 overflow-y-auto py-1"
          style={{
            overflowY: 'auto',    // Garantir que o scroll vertical esteja sempre habilitado
            overflowX: 'hidden',  // Evitar scroll horizontal
            WebkitOverflowScrolling: 'touch', // Melhor desempenho em dispositivos móveis
          }}
        >
          {filteredProfessions.length > 0 ? (
            filteredProfessions.map((profession, index) => (
              <button
                key={index}
                type="button"
                className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700"
                onClick={() => handleProfessionSelect(profession)}
              >
                {profession}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              Nenhuma profissão encontrada
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="w-full">
      {label && <label className="block mb-2 font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          placeholder={placeholder}
          className={`w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${className}`}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {value && (
        <div className="mt-2 flex items-center">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
            {value}
          </span>
          <button
            type="button"
            className="ml-2 text-xs text-red-500 hover:text-red-700"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Renderiza o dropdown usando portal */}
      {renderDropdown()}
    </div>
  );
};

export default CboInput;