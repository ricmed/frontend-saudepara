import React, { useState, useEffect, useRef } from "react";

interface CustomDateInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  'data-error'?: string;
}

const CustomDateInput: React.FC<CustomDateInputProps> = ({
  name,
  value,
  onChange,
  className = "",
  placeholder = "",
  disabled = false,
  required = false,
  'data-error': dataError
}) => {
  const [manualInputValue, setManualInputValue] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar o valor manual com o valor do componente pai
  useEffect(() => {
    if (value) {
      setManualInputValue(formatDateForDisplay(value));
    } else {
      setManualInputValue("");
    }
  }, [value]);

  // Formatar a data do formato ISO para o formato de exibição DD/MM/YYYY
  const formatDateForDisplay = (isoDate: string): string => {
    if (!isoDate) return "";
    
    try {
      const [year, month, day] = isoDate.split("-");
      return `${day}/${month}/${year}`;
    } catch (error) {
      return isoDate;
    }
  };

  // Converter a data do formato DD/MM/YYYY para o formato ISO YYYY-MM-DD
  const convertToIsoDate = (displayDate: string): string => {
    if (!displayDate) return "";
    
    // Verificar se o formato é DD/MM/YYYY
    const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = displayDate.match(datePattern);
    
    if (match) {
      const [_, day, month, year] = match;
      // Garantir que dia e mês tenham dois dígitos
      const formattedDay = day.padStart(2, '0');
      const formattedMonth = month.padStart(2, '0');
      return `${year}-${formattedMonth}-${formattedDay}`;
    }
    
    return displayDate;
  };

  // Manipular alterações na entrada manual
  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setManualInputValue(inputValue);
    
    // Aplicar formatação automática enquanto digita (XX/XX/XXXX)
    const cleaned = inputValue.replace(/[^\d]/g, '');
    let formatted = '';
    
    if (cleaned.length <= 2) {
      formatted = cleaned;
    } else if (cleaned.length <= 4) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    } else if (cleaned.length <= 8) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}/${cleaned.substring(4, 8)}`;
    } else {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}/${cleaned.substring(4, 8)}`;
    }
    
    if (formatted !== inputValue) {
      setManualInputValue(formatted);
    }
    
    // Converter para formato ISO e notificar o componente pai
    if (inputValue.length === 10) {
      const isoDate = convertToIsoDate(formatted);
      // Criar um evento sintético para simular input nativo
      const syntheticEvent = {
        target: {
          name,
          value: isoDate
        },
        currentTarget: {
          name,
          value: isoDate
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
    }
  };
  
  // Função para validar a data inserida manualmente no formato DD/MM/YYYY
  const validateDate = () => {
    if (!manualInputValue) return;
    
    const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = manualInputValue.match(datePattern);
    
    if (!match) {
      // Se não estiver no formato correto, limpar o valor
      setManualInputValue("");
      return;
    }
    
    const [_, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    // Verificar se a data é válida
    const isValidDate = 
      monthNum >= 1 && 
      monthNum <= 12 && 
      dayNum >= 1 && 
      dayNum <= new Date(yearNum, monthNum, 0).getDate();
    
    if (!isValidDate) {
      // Se a data não for válida, limpar o valor
      setManualInputValue("");
      
      // Notificar o componente pai para limpar o valor
      const syntheticEvent = {
        target: {
          name,
          value: ""
        },
        currentTarget: {
          name,
          value: ""
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
    }
  };
  
  // Manipular alterações no input de data nativo
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Passar o evento diretamente para o componente pai
    onChange(e);
  };
  
  // Abrir o seletor de data nativo quando o ícone de calendário é clicado
  const openDatePicker = () => {
    if (disabled) return;
    
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <div className="relative">
      {/* Input de texto para entrada manual (visível) */}
      <div className="flex items-center">
        <input
          ref={textInputRef}
          type="text"
          value={manualInputValue}
          onChange={handleManualChange}
          onBlur={validateDate}
          className={`${className} pr-10`} // Adicionar padding à direita para o ícone
          placeholder={placeholder || "DD/MM/YYYY"}
          disabled={disabled}
          required={required}
          data-error={dataError}
          maxLength={10}
          style={{ backgroundColor: disabled ? "#f3f4f6" : "white" }}
        />
        
        {/* Ícone de calendário para abrir o seletor de data */}
        <button
          type="button"
          onClick={openDatePicker}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
          disabled={disabled}
        >
          {/* Ícone de calendário (SVG inline) */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </button>
      </div>
      
      {/* Input de data nativo (oculto) - será usado apenas para acionar o seletor de data */}
      <input
        ref={dateInputRef}
        type="date"
        name={name}
        value={value}
        onChange={handleDateChange}
        className="sr-only" // Visualmente oculto, mas ainda funcional
        disabled={disabled}
      />
    </div>
  );
};

export default CustomDateInput;