import { Search } from "lucide-react";
import { SearchParams } from "../../types/estabelecimento";
import { useState, useEffect } from "react";

interface SearchBarProps {
  searchParams: SearchParams;
  onSearchChange: (params: SearchParams) => void;
}

export const SearchBar = ({ searchParams, onSearchChange }: SearchBarProps) => {
  // Estado local para o termo de busca (permite acompanhar o que o usuário digita)
  const [localTerm, setLocalTerm] = useState(searchParams.term);
  
  // Atualiza o estado local quando o valor externo muda
  useEffect(() => {
    setLocalTerm(searchParams.term);
  }, [searchParams.term]);

  // Handler para mudança no campo de texto
  const handleTermChange = (value: string) => {
    // Sempre atualiza o valor visual do input
    setLocalTerm(value);
    
    // Verificações para decidir se dispara a busca:
    
    // 1. Se o termo estiver vazio, permitir (para limpar filtros)
    if (value === "") {
      onSearchChange({
        ...searchParams,
        term: value,
      });
      return;
    }
    
    // 2. Se o campo for "ativo", permitir busca com qualquer comprimento
    //    (porque "sim" e "não" têm menos de 3 caracteres)
    if (searchParams.field === "ativo") {
      onSearchChange({
        ...searchParams,
        term: value,
      });
      return;
    }
    
    // 3. Para todos os outros campos, exigir pelo menos 3 caracteres
    if (value.length >= 3) {
      onSearchChange({
        ...searchParams,
        term: value,
      });
    }
    // Opcionalmente, você pode adicionar feedback visual para o usuário
  };

  return (
    <div className="relative flex gap-2">
      <select
        value={searchParams.field}
        onChange={(e) => {
          // Limpar o termo de busca ao mudar o campo
          setLocalTerm(""); // Limpa o estado local também
          onSearchChange({
            field: e.target.value as SearchParams["field"],
            term: "",
          });
        }}
        className="px-2 py-2 text-blue-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="all">Todos os campos</option>
        <option value="nome">Nome</option>
        <option value="cnpj">CNPJ</option>
        <option value="cnes">CNES</option>
        <option value="cidade">Cidade</option>
        <option value="bairro">Bairro</option>
        <option value="ativo">Ativo</option>
        <option value="natureza">Natureza</option>
        <option value="habilitacoes">Habilitações</option>
        <option value="qualificacoes">Qualificações</option>
      </select>

      <div className="relative">
        <input
          type="text"
          placeholder={`Buscar por ${
            searchParams.field === "all"
              ? "todos os campos"
              : searchParams.field === "ativo"
                ? "Sim ou Não"
                : searchParams.field === "natureza"
                  ? "tipo de natureza"
                : searchParams.field === "habilitacoes"
                  ? "habilitações"
                : searchParams.field === "qualificacoes"
                  ? "qualificações"
                  : searchParams.field
          }...`}
          value={localTerm}
          onChange={(e) => handleTermChange(e.target.value)}
          className="pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
        />
        <Search className="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
        
        {/* Opcional: Feedback quando o termo é muito curto */}
        {localTerm && localTerm.length > 0 && localTerm.length < 3 && searchParams.field !== "ativo" && (
          <div className="absolute mt-1 text-xs text-red-500">
            Mínimo de 3 caracteres para busca
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;