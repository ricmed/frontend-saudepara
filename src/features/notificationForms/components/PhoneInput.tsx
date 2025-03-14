import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

// Interface para os países com DDI
interface CountryCode {
  name: string;
  code: string;
  dial_code: string;
}

// Lista de países com DDI
const countryCodes: CountryCode[] = [
  { name: "Brasil", code: "BR", dial_code: "+55" },
  { name: "Estados Unidos", code: "US", dial_code: "+1" },
  { name: "Portugal", code: "PT", dial_code: "+351" },
  { name: "Argentina", code: "AR", dial_code: "+54" },
  { name: "Canadá", code: "CA", dial_code: "+1" },
  { name: "Alemanha", code: "DE", dial_code: "+49" },
  { name: "Reino Unido", code: "GB", dial_code: "+44" },
  { name: "França", code: "FR", dial_code: "+33" },
  { name: "Espanha", code: "ES", dial_code: "+34" },
  { name: "Itália", code: "IT", dial_code: "+39" },
  { name: "Japão", code: "JP", dial_code: "+81" },
  { name: "China", code: "CN", dial_code: "+86" },
  { name: "Austrália", code: "AU", dial_code: "+61" },
  { name: "México", code: "MX", dial_code: "+52" },
  { name: "Chile", code: "CL", dial_code: "+56" },
  { name: "Colômbia", code: "CO", dial_code: "+57" },
  { name: "Peru", code: "PE", dial_code: "+51" },
  { name: "Uruguai", code: "UY", dial_code: "+598" },
  { name: "Paraguai", code: "PY", dial_code: "+595" },
  { name: "Bolívia", code: "BO", dial_code: "+591" },
  { name: "Angola", code: "AO", dial_code: "+244" },
  { name: "Moçambique", code: "MZ", dial_code: "+258" },
  { name: "Cabo Verde", code: "CV", dial_code: "+238" },
  { name: "Guiné-Bissau", code: "GW", dial_code: "+245" },
  { name: "África do Sul", code: "ZA", dial_code: "+27" },
  { name: "Índia", code: "IN", dial_code: "+91" },
  { name: "Rússia", code: "RU", dial_code: "+7" },
  { name: "Bélgica", code: "BE", dial_code: "+32" },
  { name: "Holanda", code: "NL", dial_code: "+31" },
  { name: "Suíça", code: "CH", dial_code: "+41" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  name: string;
  placeholder?: string;
  className?: string;
  label?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  name,
  placeholder = "Digite o número de telefone",
  className = "",
  label = "Contato Telefônico",
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[0]);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Salvar a posição de scroll atual
  const scrollPositionRef = useRef({ x: 0, y: 0 });

  // Inicializar com valor existente, se houver
  useEffect(() => {
    if (value) {
      const match = value.match(/^(\+\d+)[-\s]?(.*)$/);
      if (match) {
        const dialCode = match[1];
        const number = match[2];
        const country = countryCodes.find(c => c.dial_code === dialCode);
        if (country) {
          setSelectedCountry(country);
          setPhoneNumber(number);
        } else {
          setPhoneNumber(value);
        }
      } else {
        setPhoneNumber(value);
      }
    }
  }, []);

  // Atualiza o valor completo quando o país ou número mudam
  useEffect(() => {
    const fullNumber = phoneNumber ? `${selectedCountry.dial_code} ${phoneNumber}` : "";
    onChange(fullNumber);
  }, [selectedCountry, phoneNumber]);

  // Manipulador para fechar o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node) &&
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
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
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

  const toggleDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevenir comportamento padrão
    e.preventDefault();
    e.stopPropagation();
    
    // Salvar posição atual de scroll
    scrollPositionRef.current = {
      x: window.scrollX,
      y: window.scrollY
    };
    
    // Toggle do dropdown
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleCountrySelect = (country: CountryCode, e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevenir comportamento padrão
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchQuery("");
    
    // Forçando a atualização do valor completo imediatamente
    onChange(phoneNumber ? `${country.dial_code} ${phoneNumber}` : country.dial_code);
    
    // Pequeno timeout para garantir que o scroll seja restaurado após fechar o dropdown
    setTimeout(() => {
      window.scrollTo(scrollPositionRef.current.x, scrollPositionRef.current.y);
    }, 10);
  };

  // Função para obter URL da bandeira
  const getFlagUrl = (countryCode: string) => {
    return `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
  };

  // Filtra países baseado na busca
  const filteredCountries = searchQuery
    ? countryCodes.filter(
        country =>
          country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          country.dial_code.includes(searchQuery) ||
          country.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : countryCodes;

  // Handler para evitar reset de scroll no input de busca
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Garante que a página não role
    e.stopPropagation();
  };
  
  // Handler para evitar scroll no clique do input de busca
  const handleSearchInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

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
          width: '290px',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb'
        }}
      >
        <div className="p-2 border-b border-gray-100">
          <input
            type="text"
            placeholder="Buscar país ou código"
            className="w-full p-2 text-sm border border-gray-200 rounded-md"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onClick={handleSearchInputClick}
            // Removi o autoFocus para evitar problemas de scroll
          />
        </div>
        <div className="max-h-60 overflow-y-auto py-1">
          {filteredCountries.map((country) => (
            <button
              key={country.code}
              type="button"
              className="flex items-center w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-100 focus:outline-none transition-colors"
              onClick={(e) => handleCountrySelect(country, e)}
            >
              <img 
                src={getFlagUrl(country.code)} 
                alt={`Bandeira ${country.name}`} 
                className="w-5 h-auto mr-3"
                style={{ border: '1px solid #eaeaea', borderRadius: '2px' }}
              />
              <span className="font-medium text-sm w-12">{country.code}</span>
              <span className="text-sm text-gray-700 font-semibold w-16">{country.dial_code}</span>
              <span className="text-sm">{country.name}</span>
            </button>
          ))}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="w-full">
      {label && <label className="block mb-2 font-medium text-gray-700">{label}</label>}
      <div className="flex">
        {/* Seletor de código de país */}
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleDropdown}
          className="flex items-center h-full px-4 py-3 bg-gray-50 border border-gray-200 border-r-0 rounded-l-lg hover:bg-gray-100 transition-colors"
        >
          <img 
            src={getFlagUrl(selectedCountry.code)} 
            alt={`Bandeira ${selectedCountry.name}`} 
            className="w-5 h-auto mr-2"
            style={{ border: '1px solid #eaeaea', borderRadius: '2px' }}
          />
          <span className="font-medium text-sm">{selectedCountry.dial_code}</span>
          <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
        </button>

        {/* Input para o número de telefone */}
        <input
          type="tel"
          name={name}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 p-3 border border-gray-200 rounded-r-lg text-sm ${className}`}
        />

        {/* Renderiza o dropdown usando portal */}
        {renderDropdown()}
      </div>
    </div>
  );
};

export default PhoneInput;