import React, { useState, useEffect } from "react";

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
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const brazilFlag = "https://flagcdn.com/w20/br.png";
  const brazilDialCode = "+55";

  // Inicializar com valor existente, se houver
  useEffect(() => {
    if (value) {
      // Verificar se o valor já tem o código +55
      const match = value.match(/^\+55\s?(.*)$/);
      if (match) {
        // Se tem o código, pegar só o número
        setPhoneNumber(match[1]);
      } else {
        // Se não tem o código, usar o valor inteiro
        setPhoneNumber(value);
      }
    }
  }, [value]);

  // Atualiza o valor completo quando o número muda
  useEffect(() => {
    // Adicionar o código +55 ao número digitado
    const fullNumber = phoneNumber ? `${brazilDialCode} ${phoneNumber}` : "";
    onChange(fullNumber);
  }, [phoneNumber, onChange]);

  // Handler para formatar e validar o número enquanto digita
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Permitir apenas números, espaços e caracteres de formatação
    // Remover qualquer coisa que não seja número, espaço, parênteses, hífen ou ponto
    const cleanedInput = input.replace(/[^\d\s()\-\.]/g, '');
    
    setPhoneNumber(cleanedInput);
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
          <span className="font-medium text-sm">{brazilDialCode}</span>
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