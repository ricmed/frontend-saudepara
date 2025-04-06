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
        
        if (matchWithPlus) {
          // Extrai o número sem o código do país
          console.log("BrazilianPhoneInput - Com + - Código:", matchWithPlus[1], "Número:", matchWithPlus[2]);
          setPhoneNumber(matchWithPlus[2]);
        } else if (matchWithoutPlus) {
          // Tenta detectar números sem o + no início
          console.log("BrazilianPhoneInput - Sem + - Código:", matchWithoutPlus[1], "Número:", matchWithoutPlus[2]);
          
          // Se o código é 55 (Brasil), extrai apenas o número
          if (matchWithoutPlus[1] === "55") {
            setPhoneNumber(matchWithoutPlus[2]);
          } else {
            // Se não for um código brasileiro, usa o valor completo
            setPhoneNumber(value);
          }
        } else {
          // Se não tem formato internacional, usa o valor completo
          console.log("BrazilianPhoneInput - Usando valor completo:", value);
          setPhoneNumber(value);
        }
      } else {
        console.log("BrazilianPhoneInput - Valor vazio");
        setPhoneNumber("");
      }
    }
  }, [value]);

  // Função para notificar o componente pai de forma segura
  const notifyParent = (newPhoneNumber: string) => {
    // Garantir que o código do Brasil sempre tenha o + no início
    const fullNumber = newPhoneNumber ? `+${brazilDialCode} ${newPhoneNumber}` : "";
    
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
    
    // Permitir apenas números, espaços e caracteres de formatação
    const cleanedInput = input.replace(/[^\d\s()\-\.]/g, '');
    
    // Limitar a 11 caracteres (14 caracteres total incluindo "55 ")
    const limitedInput = cleanedInput.slice(0, 11);
    
    setPhoneNumber(limitedInput);
    
    // Notificar o componente pai
    notifyParent(limitedInput);
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