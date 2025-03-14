import { Search } from "lucide-react";
import { SearchParams } from "../../types/estabelecimento";

interface SearchBarProps {
  searchParams: SearchParams;
  onSearchChange: (params: SearchParams) => void;
}

export const SearchBar = ({ searchParams, onSearchChange }: SearchBarProps) => {
  return (
    <div className="relative flex gap-2">
      <select
        value={searchParams.field}
        onChange={(e) => {
          // Limpar o termo de busca ao mudar o campo
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
          value={searchParams.term}
          onChange={(e) =>
            onSearchChange({
              ...searchParams,
              term: e.target.value,
            })
          }
          className="pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
        />
        <Search className="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
      </div>
    </div>
  );
};

export default SearchBar;