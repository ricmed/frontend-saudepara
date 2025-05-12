import React, { useState, useEffect, useRef } from "react";

interface BrazilianPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  name: string;
  placeholder?: string;
  className?: string;
  label?: string;
}

const BrazilianPhoneInput: React.FC<BrazilianPhoneInputProps> = ({
  value,
  onChange,
  name,
  placeholder = "Digite o número de telefone",
  className = "",
  label = "Contato Telefônico",
}) => {
  // Adicionar refs para controlar o ciclo
  const isInternalChangeRef = useRef(false);
  const previousValueRef = useRef(value);
  const initialLoadRef = useRef(true);
  
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const brazilFlag = "https://flagcdn.com/w20/br.png";
  const brazilDialCode = "55"; // Remover o "+" para salvar no formato esperado pelo backend

  // Função para aplicar a máscara ao número de telefone
  const applyPhoneMask = (phoneDigits: string): string => {
    // Remove todos os caracteres não numéricos
    const numbers = phoneDigits.replace(/\D/g, '');
    
    // Verifica se é um número completo de celular (11 dígitos com o 9)
    if (numbers.length === 11) {
      return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`;
    }
    // Verifica se é um número de telefone fixo (10 dígitos)
    else if (numbers.length === 10) {
      return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`;
    }
    // Retorna o que foi digitado até o momento (máscara parcial)
    else if (numbers.length > 0) {
      if (numbers.length <= 2) {
        return `(${numbers}`;
      } else if (numbers.length <= 6) {
        return `(${numbers.substring(0, 2)}) ${numbers.substring(2)}`;
      } else if (numbers.length <= 10) {
        return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`;
      } else {
        return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7, 11)}`;
      }
    }
    
    return '';
  };

  // Função para remover a máscara e obter apenas os dígitos
  const removePhoneMask = (maskedPhone: string): string => {
    return maskedPhone.replace(/\D/g, '');
  };

  // Inicializar com valor existente, se houver
  useEffect(() => {
    // Pular processamento se a mudança foi interna
    if (isInternalChangeRef.current) {
      return;
    }
    
    // Processar no carregamento inicial ou se o valor mudou
    if (initialLoadRef.current || value !== previousValueRef.current) {
      initialLoadRef.current = false;
      previousValueRef.current = value;
      
      console.log("BrazilianPhoneInput - Processando valor:", value);
      
      if (value) {
        // Padrão mais flexível para extrair número do formato internacional:
        // Aceita "+55 XXXX", "+55-XXXX", "+55XXXX", "55 XXXX", "55XXXX" ou apenas "XXXX"
        const matchWithPlus = value.match(/^\+(\d+)[\s-]?(.*)$/);
        const matchWithoutPlus = value.match(/^(\d+)[\s-]?(.*)$/);
        
        let extractedNumber = "";
        
        if (matchWithPlus) {
          // Extrai o número sem o código do país
          console.log("BrazilianPhoneInput - Com + - Código:", matchWithPlus[1], "Número:", matchWithPlus[2]);
          extractedNumber = matchWithPlus[2];
        } else if (matchWithoutPlus) {
          // Tenta detectar números sem o + no início
          console.log("BrazilianPhoneInput - Sem + - Código:", matchWithoutPlus[1], "Número:", matchWithoutPlus[2]);
          
          // Se o código é 55 (Brasil), extrai apenas o número
          if (matchWithoutPlus[1] === "55") {
            extractedNumber = matchWithoutPlus[2];
          } else {
            // Se não for um código brasileiro, usa o valor completo
            extractedNumber = value;
          }
        } else {
          // Se não tem formato internacional, usa o valor completo
          console.log("BrazilianPhoneInput - Usando valor completo:", value);
          extractedNumber = value;
        }
        
        // Remove qualquer formatação existente para obter apenas os dígitos
        const digits = removePhoneMask(extractedNumber);
        
        // Aplica a máscara ao número extraído
        const maskedNumber = applyPhoneMask(digits);
        setPhoneNumber(maskedNumber);
      } else {
        console.log("BrazilianPhoneInput - Valor vazio");
        setPhoneNumber("");
      }
    }
  }, [value]);

  // Função para notificar o componente pai de forma segura
  const notifyParent = (maskedPhoneNumber: string) => {
    // Obter apenas os dígitos para enviar ao componente pai
    const digits = removePhoneMask(maskedPhoneNumber);
    
    // Garantir que o código do Brasil sempre tenha o + no início
    const fullNumber = digits ? `+${brazilDialCode} ${digits}` : "";
    
    console.log("BrazilianPhoneInput - Notificando mudança:", fullNumber);
    
    // Marcar que esta é uma mudança interna
    isInternalChangeRef.current = true;
    previousValueRef.current = fullNumber;
    
    // Notificar o pai
    onChange(fullNumber);
    
    // Resetar a flag após um curto período
    setTimeout(() => {
      isInternalChangeRef.current = false;
    }, 50);
  };

  // Handler para formatar e validar o número enquanto digita
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Obter apenas os dígitos do input (removendo qualquer máscara)
    const digits = removePhoneMask(input);
    
    // Limitar a 11 caracteres (tamanho máximo para celular com DDD)
    const limitedDigits = digits.slice(0, 11);
    
    // Aplicar a máscara ao número limitado
    const maskedNumber = applyPhoneMask(limitedDigits);
    
    // Atualizar o estado interno
    setPhoneNumber(maskedNumber);
    
    // Notificar o componente pai
    notifyParent(maskedNumber);
  };

  return (
    <div className="w-full">
      {label && <label className="block mb-2 font-medium text-gray-700">{label}</label>}
      <div className="flex">
        {/* Bandeira e código do Brasil (fixos) */}
        <div 
          className="flex items-center h-full px-4 py-3 bg-gray-50 border border-gray-200 border-r-0 rounded-l-lg"
        >
          <img 
            src={brazilFlag} 
            alt="Bandeira do Brasil" 
            className="w-5 h-auto mr-2"
            style={{ border: '1px solid #eaeaea', borderRadius: '2px' }}
          />
          <span className="font-medium text-sm">+{brazilDialCode}</span>
        </div>

        {/* Input para o número de telefone */}
        <input
          type="tel"
          name={name}
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          className={`flex-1 p-3 border border-gray-200 rounded-r-lg text-sm ${className}`}
        />
      </div>
    </div>
  );
};

export default BrazilianPhoneInput;