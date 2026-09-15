import React, { useState, useEffect, useRef } from "react";
import {
  addDaysIso,
  compareIsoDateOnly,
} from "@/utils/timezoneUtils";

interface CustomDateInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  'data-error'?: string;
  error?: string;
  maxDate?: string;
  minDate?: string;
  onValidationError?: (name: string, error: string | null) => void;
}

// 🌍 Função auxiliar para obter a data atual no fuso horário de Belém (UTC-3)
const getBelemCurrentDate = (): Date => {
  const now = new Date();
  // Converter para o fuso horário de Belém (America/Belem ou America/Sao_Paulo)
  const belemTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Belem' }));
  return belemTime;
};

// 🌍 Função auxiliar para formatar data no formato ISO considerando o fuso de Belém
const formatDateToISOInBelem = (date: Date): string => {
  const belemDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Belem' }));
  const year = belemDate.getFullYear();
  const month = String(belemDate.getMonth() + 1).padStart(2, '0');
  const day = String(belemDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CustomDateInput: React.FC<CustomDateInputProps> = ({
  name,
  value,
  onChange,
  className = "",
  placeholder = "",
  disabled = false,
  required = false,
  'data-error': dataError,
  error,
  maxDate,
  minDate,
  onValidationError
}) => {
  const [manualInputValue, setManualInputValue] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [isDateValid, setIsDateValid] = useState(true);
  const [localError, setLocalError] = useState<string>("");
  
  // NOVA ADIÇÃO: Estado para controlar erros persistentes
  const [persistentError, setPersistentError] = useState<string>("");
  const [shouldClearError, setShouldClearError] = useState(false);

  // Verificar data máxima - usando a data atual no fuso de Belém por padrão (impede datas futuras)
  const today = getBelemCurrentDate();
  const formattedToday = formatDateToISOInBelem(today);
  const effectiveMaxDate = maxDate || formattedToday;

  // Sincronizar o valor manual com o valor do componente pai
  useEffect(() => {
    if (value) {
      setManualInputValue(formatDateForDisplay(value));
      setIsDateValid(true);
      
      // MODIFICAÇÃO: Só limpar erros se o usuário digitou uma data válida manualmente
      if (shouldClearError) {
        setLocalError("");
        setPersistentError("");
        setShouldClearError(false);
        
        if (onValidationError) {
          onValidationError(name, null);
        }
      }
    } else {
      setManualInputValue("");
      // MODIFICAÇÃO: Não limpar erros automaticamente quando o valor é limpo
      // Só limpar se foi uma limpeza manual (não automática por data inválida)
      if (shouldClearError) {
        setLocalError("");
        setPersistentError("");
        setShouldClearError(false);
        
        if (onValidationError) {
          onValidationError(name, null);
        }
      }
    }
  }, [value, name, onValidationError, shouldClearError]);

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
    
    const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = displayDate.match(datePattern);
    
    if (match) {
      const [_, day, month, year] = match;
      const formattedDay = day.padStart(2, '0');
      const formattedMonth = month.padStart(2, '0');
      return `${year}-${formattedMonth}-${formattedDay}`;
    }
    
    return displayDate;
  };

  // Verificar se uma data é válida e não está no futuro
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return true;
    
    const isoDate = convertToIsoDate(dateString);
    if (!isoDate) return false;
    
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return false;
    
    if (effectiveMaxDate) {
      const maxLimit = new Date(effectiveMaxDate);
      if (date > maxLimit) return false;
    }
    
    if (minDate) {
      const minLimit = new Date(minDate);
      if (date < minLimit) return false;
    }
    
    return true;
  };

  // NOVA FUNÇÃO: Limpar erros manualmente
  const clearErrorsManually = () => {
    setShouldClearError(true);
    setLocalError("");
    setPersistentError("");
    
    if (onValidationError) {
      onValidationError(name, null);
    }
  };

  // Manipular alterações na entrada manual
  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setManualInputValue(inputValue);
    
    // MODIFICAÇÃO: Quando o usuário limpa manualmente, limpar erros
    if (!inputValue || inputValue === '') {
      clearErrorsManually();
      
      const syntheticEvent = {
        target: { name, value: "" },
        currentTarget: { name, value: "" }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
      return;
    }
    
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
    
    // Converter para formato ISO e notificar o componente pai se tiver o formato completo
    if (inputValue.length === 10) {
      const isoDate = convertToIsoDate(formatted);
      const dateValid = isValidDate(formatted);
      setIsDateValid(dateValid);
      
      if (dateValid) {
        // MODIFICAÇÃO: Marcar que deve limpar erros na próxima atualização
        setShouldClearError(true);
        
        const syntheticEvent = {
          target: { name, value: isoDate },
          currentTarget: { name, value: isoDate }
        } as React.ChangeEvent<HTMLInputElement>;
        
        onChange(syntheticEvent);
      }
    }
  };
  
  // Função para validar a data inserida manualmente no formato DD/MM/YYYY
  const validateDate = () => {
    if (!manualInputValue) return;
    
    const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = manualInputValue.match(datePattern);
    
    if (!match) {
      setManualInputValue("");
      const errorMsg = "Formato de data inválido.";
      
      // MODIFICAÇÃO: Usar erro persistente
      setLocalError(errorMsg);
      setPersistentError(errorMsg);
      
      if (onValidationError) {
        onValidationError(name, errorMsg);
      }
      return;
    }
    
    const [_, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    const isDateValid = 
      monthNum >= 1 && 
      monthNum <= 12 && 
      dayNum >= 1 && 
      dayNum <= new Date(yearNum, monthNum, 0).getDate();
    
    if (!isDateValid) {
      setManualInputValue("");
      const errorMsg = "Data inválida.";
      
      // MODIFICAÇÃO: Usar erro persistente
      setLocalError(errorMsg);
      setPersistentError(errorMsg);
      
      if (onValidationError) {
        onValidationError(name, errorMsg);
      }
      
      const syntheticEvent = {
        target: { name, value: "" },
        currentTarget: { name, value: "" }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
      return;
    }
    
    // Verificar se a data está no futuro
    const isoDate = convertToIsoDate(manualInputValue);
    const inputDate = new Date(isoDate);
    const maxDate = new Date(effectiveMaxDate);
    
    if (inputDate > maxDate) {
      // MODIFICAÇÃO PRINCIPAL: Não limpar o valor imediatamente, manter erro persistente
      const errorMsg = "A data não pode ser futura.";
      setLocalError(errorMsg);
      setPersistentError(errorMsg);
      
      if (onValidationError) {
        onValidationError(name, errorMsg);
      }
      
      // MODIFICAÇÃO: Limpar o valor apenas no backend, manter visualmente para o usuário ver o erro
      const syntheticEvent = {
        target: { name, value: "" },
        currentTarget: { name, value: "" }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
      
      // NOVA ADIÇÃO: Usar setTimeout para limpar a exibição visual após um delay
      setTimeout(() => {
        setManualInputValue("");
      }, 100); // Pequeno delay para manter a mensagem visível
      
      return;
    }
    
    // Verificar data mínima, se especificada
    if (minDate) {
      const minLimit = new Date(minDate);
      if (inputDate < minLimit) {
        const errorMsg = `A data deve ser após ${formatDateForDisplay(minDate)}.`;
        
        // MODIFICAÇÃO: Usar erro persistente
        setLocalError(errorMsg);
        setPersistentError(errorMsg);
        
        if (onValidationError) {
          onValidationError(name, errorMsg);
        }
        return;
      }
    }
    
    // Se chegou aqui, a data é válida
    setShouldClearError(true);
    setIsDateValid(true);
  };
  
  // Manipular alterações no input de data nativo
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    
    if (dateValue) {
      const inputDate = new Date(dateValue);
      const maxDate = new Date(effectiveMaxDate);
      
      if (inputDate > maxDate) {
        const errorMsg = "A data não pode ser futura.";
        
        // MODIFICAÇÃO: Usar erro persistente
        setLocalError(errorMsg);
        setPersistentError(errorMsg);
        
        if (onValidationError) {
          onValidationError(name, errorMsg);
        }
        return;
      }
      
      if (minDate) {
        const minLimit = new Date(minDate);
        if (inputDate < minLimit) {
          const errorMsg = `A data deve ser após ${formatDateForDisplay(minDate)}.`;
          
          // MODIFICAÇÃO: Usar erro persistente
          setLocalError(errorMsg);
          setPersistentError(errorMsg);
          
          if (onValidationError) {
            onValidationError(name, errorMsg);
          }
          return;
        }
      }
      
      // MODIFICAÇÃO: Data válida, marcar para limpar erros
      setShouldClearError(true);
    }
    
    onChange(e);
  };
  
  // Abrir o seletor de data nativo quando o ícone de calendário é clicado
  const openDatePicker = () => {
    if (disabled) return;
    
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };
  
  // Adiantar um dia
  // IMPORTANTE: value é YYYY-MM-DD civil. NÃO usar new Date(value) (vira UTC midnight e quebra o +/-).
  // O valor emitido continua YYYY-MM-DD — o adapter/timezone do envio ao backend não muda.
  const incrementDay = () => {
    if (disabled) return;
    
    if (value) {
      const isoDate = addDaysIso(value, 1);
      if (!isoDate) return;

      if (compareIsoDateOnly(isoDate, effectiveMaxDate) > 0) {
        const errorMsg = "A data não pode ser futura.";
        
        // MODIFICAÇÃO: Usar erro persistente
        setLocalError(errorMsg);
        setPersistentError(errorMsg);
        
        if (onValidationError) {
          onValidationError(name, errorMsg);
        }
        return;
      }
      
      const syntheticEvent = {
        target: { name, value: isoDate },
        currentTarget: { name, value: isoDate }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
    } else {
      // 🌍 CORREÇÃO: Usar data atual no fuso de Belém ao invés de UTC
      const date = getBelemCurrentDate();
      const isoDate = formatDateToISOInBelem(date);
      const syntheticEvent = {
        target: { name, value: isoDate },
        currentTarget: { name, value: isoDate }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
    }
  };
  
  // Retroceder um dia
  const decrementDay = () => {
    if (disabled) return;
    
    if (value) {
      const isoDate = addDaysIso(value, -1);
      if (!isoDate) return;
      
      if (minDate && compareIsoDateOnly(isoDate, minDate) < 0) {
        const errorMsg = `A data deve ser após ${formatDateForDisplay(minDate)}.`;
        
        // MODIFICAÇÃO: Usar erro persistente  
        setLocalError(errorMsg);
        setPersistentError(errorMsg);
        
        if (onValidationError) {
          onValidationError(name, errorMsg);
        }
        return;
      }
      
      const syntheticEvent = {
        target: { name, value: isoDate },
        currentTarget: { name, value: isoDate }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
    } else {
      // 🌍 CORREÇÃO: hoje em Belém (helpers existentes) + -1 dia civil
      const todayIso = formatDateToISOInBelem(getBelemCurrentDate());
      const isoDate = addDaysIso(todayIso, -1);
      if (!isoDate) return;

      if (minDate && compareIsoDateOnly(isoDate, minDate) < 0) {
        const errorMsg = `A data deve ser após ${formatDateForDisplay(minDate)}.`;
        
        // MODIFICAÇÃO: Usar erro persistente
        setLocalError(errorMsg);
        setPersistentError(errorMsg);
        
        if (onValidationError) {
          onValidationError(name, errorMsg);
        }
        return;
      }
      
      const syntheticEvent = {
        target: { name, value: isoDate },
        currentTarget: { name, value: isoDate }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
    }
  };

  // MODIFICAÇÃO: Determinar qual mensagem de erro mostrar (priorizar erro persistente)
  const displayError = error || persistentError || localError;
  
  const inputErrorClass = (displayError || dataError === "true")
    ? "border-red-500 bg-red-50"
    : "border-gray-200";

  return (
    <div className="relative">
      <div className="flex items-center">
        <div className="relative flex-grow">
          <input
            ref={textInputRef}
            type="text"
            value={manualInputValue}
            onChange={handleManualChange}
            onBlur={validateDate}
            className={`${className} pr-10 ${inputErrorClass}`}
            placeholder={placeholder || "DD/MM/YYYY"}
            disabled={disabled}
            required={required}
            data-error={dataError || (displayError ? "true" : "false")}
            maxLength={10}
            style={{ backgroundColor: disabled ? "#f3f4f6" : "white" }}
          />
          
          <button
            type="button"
            onClick={openDatePicker}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            disabled={disabled}
          >
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
        
        <div className="flex flex-col ml-1">
          <button
            type="button"
            onClick={incrementDay}
            disabled={disabled}
            className="text-gray-500 hover:text-blue-600 focus:outline-none disabled:opacity-50 p-1"
            title="Próximo dia"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
          <button
            type="button"
            onClick={decrementDay}
            disabled={disabled}
            className="text-gray-500 hover:text-blue-600 focus:outline-none disabled:opacity-50 p-1"
            title="Dia anterior"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>
      
      {/* NOVA ADIÇÃO: Botão para limpar erro manualmente */}
      {displayError && (
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm text-red-500 flex items-center gap-1 flex-1">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {displayError}
          </p>
          <button
            type="button"
            onClick={clearErrorsManually}
            className="ml-2 text-xs text-gray-500 hover:text-gray-700 focus:outline-none"
            title="Limpar erro"
          >
            ✕
          </button>
        </div>
      )}
      
      <input
        ref={dateInputRef}
        type="date"
        name={name}
        value={value}
        max={effectiveMaxDate}
        min={minDate}
        onChange={handleDateChange}
        className="sr-only"
        disabled={disabled}
      />
    </div>
  );
};

export default CustomDateInput;