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
  error?: string;
  maxDate?: string;
  minDate?: string;
  onValidationError?: (name: string, error: string | null) => void;
}

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
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Estado para controlar se o botão de incremento deve estar desabilitado
  const [isAtMaxDate, setIsAtMaxDate] = useState(false);

  // Verificar data máxima - usando a data atual por padrão (impede datas futuras)
  const today = new Date();
  // Importante: não ajustar para o final do dia, mas usar exatamente a data atual
  const formattedToday = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const effectiveMaxDate = maxDate || formattedToday;

  // Sincronizar o valor manual com o valor do componente pai
  useEffect(() => {
    if (value) {
      try {
        const [year, month, day] = value.split("-");
        setManualInputValue(`${day}/${month}/${year}`);
        setIsDateValid(true);
        setLocalError(null);
        
        // Verificar se a data atual é a data máxima permitida (para desabilitar o botão de incremento)
        // Este é o ponto crítico - verificamos se já estamos na data atual
        const maxLimit = new Date(effectiveMaxDate);
        const currentDate = new Date(value);
        
        // Importante: sempre comparar apenas data, sem horas
        maxLimit.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);
        
        // Uso de comparação usando strings e timestamps para garantir precisão
        const isMax = 
          currentDate.getTime() >= maxLimit.getTime() || 
          currentDate.toISOString().split('T')[0] === maxLimit.toISOString().split('T')[0];
        
        console.log('Verificando datas:', {
          current: currentDate.toISOString().split('T')[0],
          max: maxLimit.toISOString().split('T')[0],
          isMax
        });
        
        setIsAtMaxDate(isMax);
        
        // Comunicar ao componente pai que não há erro
        if (onValidationError) {
          onValidationError(name, null);
        }
      } catch (error) {
        setManualInputValue("");
        setIsAtMaxDate(false);
      }
    } else {
      setManualInputValue("");
      setIsAtMaxDate(false);
    }
  }, [value, name, onValidationError, effectiveMaxDate]);

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

  // Verificar se uma data é válida e não está no futuro
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return true; // Data vazia é considerada válida
    
    const isoDate = convertToIsoDate(dateString);
    if (!isoDate) return false;
    
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return false;
    
    // Validar contra data máxima (impedir datas futuras)
    if (effectiveMaxDate) {
      const maxLimit = new Date(effectiveMaxDate);
      // Use apenas a data, sem hora, para comparação precisa
      date.setHours(0, 0, 0, 0);
      maxLimit.setHours(0, 0, 0, 0);
      
      if (date > maxLimit) return false;
    }
    
    // Validar contra data mínima se fornecida
    if (minDate) {
      const minLimit = new Date(minDate);
      minLimit.setHours(0, 0, 0, 0);
      const dateToCompare = new Date(isoDate);
      dateToCompare.setHours(0, 0, 0, 0);
      if (dateToCompare < minLimit) return false;
    }
    
    return true;
  };

  // Verificar se a data atual é a data máxima permitida
  const checkIsAtMaxDate = (dateValue: string): boolean => {
    if (!dateValue) return false;
    
    const dateToCheck = new Date(dateValue);
    const maxLimit = new Date(effectiveMaxDate);
    
    // Comparar apenas as datas (sem hora)
    dateToCheck.setHours(0, 0, 0, 0);
    maxLimit.setHours(0, 0, 0, 0);
    
    // Verificação estrita: considerar como data máxima se for igual ou posterior à data atual
    const result = dateToCheck.getTime() >= maxLimit.getTime();
    
    console.log('checkIsAtMaxDate:', {
      date: dateToCheck.toISOString().split('T')[0],
      max: maxLimit.toISOString().split('T')[0],
      result
    });
    
    return result;
  };

  // Manipular alterações na entrada manual
  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Limpar erro ao digitar
    if (localError) {
      setLocalError(null);
      
      // Comunicar ao componente pai que não há erro
      if (onValidationError) {
        onValidationError(name, null);
      }
    }

    // Verificar se o campo está vazio
    if (!inputValue || inputValue === '') {
      setManualInputValue("");
      setIsAtMaxDate(false);
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
    
    // Atualizar o valor exibido
    setManualInputValue(formatted);
    
    // Validação antecipada para detectar datas futuras durante a digitação
    if (formatted.length === 10) {
      const isoDate = convertToIsoDate(formatted);
      const dateValid = isValidDate(formatted);
      
      if (dateValid) {
        // Atualizar o estado de isAtMaxDate
        const isMax = checkIsAtMaxDate(isoDate);
        setIsAtMaxDate(isMax);
        
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
        
        setIsDateValid(true);
        onChange(syntheticEvent);
      } else {
        // Verificar qual erro específico ocorreu
        const isoDate = convertToIsoDate(formatted);
        const date = new Date(isoDate);
        
        if (!isNaN(date.getTime())) {
          const maxDate = new Date(effectiveMaxDate);
          date.setHours(0, 0, 0, 0);
          maxDate.setHours(0, 0, 0, 0);
          
          if (date > maxDate) {
            const errorMsg = "A data não pode ser futura.";
            setLocalError(errorMsg);
            setIsDateValid(false);
            setIsAtMaxDate(false);
            
            // Comunicar erro ao componente pai
            if (onValidationError) {
              onValidationError(name, errorMsg);
            }
            
            // Rejeitar o valor e manter o campo vazio
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
          } else if (minDate) {
            const minLimit = new Date(minDate);
            minLimit.setHours(0, 0, 0, 0);
            
            if (date < minLimit) {
              const errorMsg = `A data deve ser após ${formatDateForDisplay(minDate)}.`;
              setLocalError(errorMsg);
              setIsDateValid(false);
              setIsAtMaxDate(false);
              
              // Comunicar erro ao componente pai
              if (onValidationError) {
                onValidationError(name, errorMsg);
              }
              
              // Rejeitar o valor e manter o campo vazio
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
          }
        } else {
          const errorMsg = "Data inválida.";
          setLocalError(errorMsg);
          setIsDateValid(false);
          setIsAtMaxDate(false);
          
          // Comunicar erro ao componente pai
          if (onValidationError) {
            onValidationError(name, errorMsg);
          }
        }
      }
    }
  };
  
  // Função para validar a data inserida manualmente no formato DD/MM/YYYY
  const validateDate = () => {
    if (!manualInputValue) return;
    
    const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = manualInputValue.match(datePattern);
    
    if (!match) {
      // Se não estiver no formato correto, mostrar erro mas manter valor
      const errorMsg = "Formato de data inválido.";
      setLocalError(errorMsg);
      setIsDateValid(false);
      setIsAtMaxDate(false);
      
      // Comunicar erro ao componente pai
      if (onValidationError) {
        onValidationError(name, errorMsg);
      }
      
      return;
    }
    
    const [_, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    // Verificar se a data é válida
    const isDateValid = 
      monthNum >= 1 && 
      monthNum <= 12 && 
      dayNum >= 1 && 
      dayNum <= new Date(yearNum, monthNum, 0).getDate();
    
    if (!isDateValid) {
      // Se a data não for válida, mostrar erro e manter valor
      const errorMsg = "Data inválida.";
      setLocalError(errorMsg);
      setIsAtMaxDate(false);
      
      // Comunicar erro ao componente pai
      if (onValidationError) {
        onValidationError(name, errorMsg);
      }
      
      // Manter o campo com a data inválida para que o usuário possa corrigir
      // mas enviar valor vazio para o formulário
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
      
      return;
    }
    
    // Verificar se a data está no futuro
    const isoDate = convertToIsoDate(manualInputValue);
    const inputDate = new Date(isoDate);
    const maxDate = new Date(effectiveMaxDate);
    
    // Comparar apenas as datas, sem horas
    inputDate.setHours(0, 0, 0, 0);
    maxDate.setHours(0, 0, 0, 0);
    
    if (inputDate > maxDate) {
      // Mostrar erro para data futura
      const errorMsg = "A data não pode ser futura.";
      setLocalError(errorMsg);
      setIsAtMaxDate(false);
      
      // Comunicar erro ao componente pai
      if (onValidationError) {
        onValidationError(name, errorMsg);
      }
      
      // Enviar valor vazio para o formulário - mantendo o valor visual
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
      
      return;
    }
    
    // Verificar data mínima, se especificada
    if (minDate) {
      const minLimit = new Date(minDate);
      minLimit.setHours(0, 0, 0, 0);
      
      if (inputDate < minLimit) {
        const errorMsg = `A data deve ser após ${formatDateForDisplay(minDate)}.`;
        setLocalError(errorMsg);
        setIsAtMaxDate(false);
        
        // Comunicar erro ao componente pai
        if (onValidationError) {
          onValidationError(name, errorMsg);
        }
        
        // Enviar valor vazio para o formulário - mantendo o valor visual
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
        
        return;
      }
    }
    
    // Se chegou aqui, a data é válida
    setLocalError(null);
    setIsDateValid(true);
    
    // Atualizar o estado de isAtMaxDate
    setIsAtMaxDate(checkIsAtMaxDate(isoDate));
    
    // Comunicar ao componente pai que não há erro
    if (onValidationError) {
      onValidationError(name, null);
    }
    
    // Enviar valor válido para o formulário
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
  };
  
  // Manipular alterações no input de data nativo
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    
    if (!dateValue) {
      setManualInputValue("");
      setLocalError(null);
      setIsDateValid(true);
      setIsAtMaxDate(false);
      
      if (onValidationError) {
        onValidationError(name, null);
      }
      
      onChange(e);
      return;
    }
    
    // Verificar se a data não está no futuro
    const inputDate = new Date(dateValue);
    const maxDate = new Date(effectiveMaxDate);
    
    // Comparar apenas as datas, sem horas
    inputDate.setHours(0, 0, 0, 0);
    maxDate.setHours(0, 0, 0, 0);
    
    if (inputDate > maxDate) {
      const errorMsg = "A data não pode ser futura.";
      setLocalError(errorMsg);
      setIsAtMaxDate(false);
      
      // Comunicar erro ao componente pai
      if (onValidationError) {
        onValidationError(name, errorMsg);
      }
      
      // Manter o valor exibido mas enviar vazio para o formulário
      setManualInputValue(formatDateForDisplay(dateValue));
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
      
      return;
    }
    
    // Verificar data mínima, se especificada
    if (minDate) {
      const minLimit = new Date(minDate);
      minLimit.setHours(0, 0, 0, 0);
      
      if (inputDate < minLimit) {
        const errorMsg = `A data deve ser após ${formatDateForDisplay(minDate)}.`;
        setLocalError(errorMsg);
        setIsAtMaxDate(false);
        
        // Comunicar erro ao componente pai
        if (onValidationError) {
          onValidationError(name, errorMsg);
        }
        
        // Manter o valor exibido mas enviar vazio para o formulário
        setManualInputValue(formatDateForDisplay(dateValue));
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
        
        return;
      }
    }
    
    // Atualizar o valor de exibição para o formato DD/MM/YYYY
    try {
      const [year, month, day] = dateValue.split("-");
      setManualInputValue(`${day}/${month}/${year}`);
    } catch (error) {
      console.error("Erro ao formatar data:", error);
    }
    
    // Atualizar o estado de isAtMaxDate
    setIsAtMaxDate(checkIsAtMaxDate(dateValue));
    
    setLocalError(null);
    setIsDateValid(true);
    
    // Comunicar ao componente pai que não há erro
    if (onValidationError) {
      onValidationError(name, null);
    }
    
    // Passar o evento para o componente pai
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
  const incrementDay = () => {
    if (disabled || isAtMaxDate) return;
    
    if (value) {
      const date = new Date(value);
      date.setDate(date.getDate() + 1);
      
      // Verificar se não excede a data máxima
      const maxDate = new Date(effectiveMaxDate);
      
      // Comparar apenas as datas, sem horas
      date.setHours(0, 0, 0, 0);
      maxDate.setHours(0, 0, 0, 0);
      
      if (date > maxDate) {
        const errorMsg = "A data não pode ser futura.";
        setLocalError(errorMsg);
        
        // Comunicar erro ao componente pai
        if (onValidationError) {
          onValidationError(name, errorMsg);
        }
        
        return;
      }
      
      const isoDate = date.toISOString().split('T')[0];
      
      // Verificar se após o incremento estaremos na data máxima
      const willBeAtMax = checkIsAtMaxDate(isoDate);
      setIsAtMaxDate(willBeAtMax);
      
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
    } else {
      // Se não houver data, usar a data atual
      const date = new Date();
      date.setHours(0, 0, 0, 0); // Usar apenas a data, sem horas
      
      // Verificar se data atual já é a data máxima
      const maxDate = new Date(effectiveMaxDate);
      maxDate.setHours(0, 0, 0, 0);
      
      // Se a data atual já for a máxima, desabilitar o botão
      if (date.getTime() >= maxDate.getTime()) {
        setIsAtMaxDate(true);
        date.setTime(maxDate.getTime());
      } else {
        setIsAtMaxDate(false);
      }
      
      const isoDate = date.toISOString().split('T')[0];
      
      // Verificar se após o incremento estaremos na data máxima
      const willBeAtMax = checkIsAtMaxDate(isoDate);
      setIsAtMaxDate(willBeAtMax);
      
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
  
  // Retroceder um dia
  const decrementDay = () => {
    if (disabled) return;
    
    // Ao decrementar, nunca estaremos na data máxima
    setIsAtMaxDate(false);
    
    if (value) {
      const date = new Date(value);
      date.setDate(date.getDate() - 1);
      
      // Verificar data mínima, se especificada
      if (minDate) {
        const minLimit = new Date(minDate);
        minLimit.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        
        if (date < minLimit) {
          const errorMsg = `A data deve ser após ${formatDateForDisplay(minDate)}.`;
          setLocalError(errorMsg);
          
          // Comunicar erro ao componente pai
          if (onValidationError) {
            onValidationError(name, errorMsg);
          }
          
          return;
        }
      }
      
      const isoDate = date.toISOString().split('T')[0];
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
    } else {
      // Se não houver data, usar a data atual - 1
      const date = new Date();
      date.setDate(date.getDate() - 1);
      
      // Verificar data mínima, se especificada
      if (minDate) {
        const minLimit = new Date(minDate);
        minLimit.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        
        if (date < minLimit) {
          const errorMsg = `A data deve ser após ${formatDateForDisplay(minDate)}.`;
          setLocalError(errorMsg);
          
          // Comunicar erro ao componente pai
          if (onValidationError) {
            onValidationError(name, errorMsg);
          }
          
          return;
        }
      }
      
      const isoDate = date.toISOString().split('T')[0];
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

  // Determinar qual mensagem de erro mostrar (priorizar erros externos)
  const displayError = error || localError;
  
  // Determinar a classe de erro para o input
  const inputErrorClass = (displayError || dataError === "true")
    ? "border-red-500 bg-red-50"
    : "border-gray-200";

  return (
    <div className="relative">
      {/* Input de texto para entrada manual (visível) */}
      <div className="flex items-center">
        <div className="relative flex-grow">
          <input
            ref={textInputRef}
            type="text"
            value={manualInputValue}
            onChange={handleManualChange}
            onBlur={validateDate}
            className={`${className} pr-10 ${inputErrorClass}`} // Adicionar padding à direita para o ícone
            placeholder={placeholder || "DD/MM/YYYY"}
            disabled={disabled}
            required={required}
            autoComplete="off"
            data-error={dataError || (displayError ? "true" : "false")}
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
        
        {/* Botões para incrementar/decrementar a data */}
        <div className="flex flex-col ml-1">
          <button
            type="button"
            onClick={incrementDay}
            disabled={disabled || isAtMaxDate}
            className={`text-gray-500 hover:text-blue-600 focus:outline-none p-1 ${
              disabled || isAtMaxDate ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={isAtMaxDate ? "Não é possível avançar além da data atual" : "Próximo dia"}
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
      
      {/* Exibir mensagem de erro se houver - APENAS UMA MENSAGEM */}
      {displayError && (
        <p className="mt-1 text-sm text-red-500">{displayError}</p>
      )}
      
      {/* Input de data nativo (oculto) - será usado apenas para acionar o seletor de data */}
      <input
        ref={dateInputRef}
        type="date"
        name={name}
        value={value}
        max={effectiveMaxDate} // Impedir datas futuras no controle nativo também
        min={minDate} // Aplicar data mínima, se fornecida
        onChange={handleDateChange}
        className="sr-only" // Visualmente oculto, mas ainda funcional
        disabled={disabled}
      />
    </div>
  );
};

export default CustomDateInput;