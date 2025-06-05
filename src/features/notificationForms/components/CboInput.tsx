import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import axios from "axios";
import indexedDBService from "@/services/indexedDB";

// Função para remover acentos e converter para maiúsculas
function normalizeText(text: string): string {
  if (!text) return "";
  return text.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

// Interface para opções de CBO
interface TipoCboOption {
  idtipo_cbo: number;
  codigo: string;
  descricao: string;
}

interface CboInputProps {
  value: string;                     // O ID selecionado (string de número)
  onChange: (value: string) => void; // Passa o ID (string) para o pai
  name: string;
  placeholder?: string;
  className?: string;
  label?: string;
  disabled?: boolean;
}

const CboInput: React.FC<CboInputProps> = ({
  value,
  onChange,
  name,
  placeholder = "Pesquisar profissão",
  className = "",
  label = "Profissão/Ocupação (CBO)",
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayValue, setDisplayValue] = useState<string>("");          // texto que aparece no input
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cbos, setCbos] = useState<TipoCboOption[]>([]);
  const [selectedCbo, setSelectedCbo] = useState<TipoCboOption | null>(null);
  const [isManuallyEditing, setIsManuallyEditing] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Normaliza a lista de CBOs (tudo em caixa alta, sem acento)
  const normalizeCbos = (cboOptions: TipoCboOption[]): TipoCboOption[] => {
    return cboOptions.map(cbo => ({
      ...cbo,
      descricao: normalizeText(cbo.descricao)
    }));
  };

  // ===========
  // BUSCA CBO POR ID (COM FALLBACK OFFLINE)
  // ===========
  const fetchCboById = async (id: string) => {
    if (!id || id.trim() === "" || isNaN(Number(id))) {
      return;
    }

    // 1) Primeiro: tentar buscar no cache local (IndexedDBService.getOpcoes('cbos'))
    try {
      const cachedList: any[] = (await indexedDBService.getOpcoes("cbos")) || [];
      const found = cachedList.find(item => String(item.idtipo_cbo) === id);

      if (found) {
        const normalized = {
          ...found,
          descricao: normalizeText(found.descricao)
        };
        setSelectedCbo(normalized);
        setDisplayValue(normalized.descricao);
        return;
      }
    } catch (e) {
      // se falhar ao acessar cache, apenas seguimos para a API
      console.warn("Erro ao ler CBO do cache:", e);
    }

    // 2) Se não encontrou no cache, tenta a requisição HTTP
    try {
      setIsLoading(true);
      const server = import.meta.env.VITE_API_SERVER;
      const port = import.meta.env.VITE_API_PORT;
      const response = await axios.get(`${server}:${port}/api/tipo-cbo/${id}`);

      if (response.data && response.data.idtipo_cbo) {
        const normalizedCbo = {
          ...response.data,
          descricao: normalizeText(response.data.descricao)
        };
        setSelectedCbo(normalizedCbo);
        setDisplayValue(normalizedCbo.descricao);

        // E salva no cache para uso futuro
        try {
          const existing: any[] = (await indexedDBService.getOpcoes("cbos")) || [];
          if (!existing.find((c: any) => c.idtipo_cbo === normalizedCbo.idtipo_cbo)) {
            existing.push(normalizedCbo);
            await indexedDBService.saveOpcoes("cbos", existing);
          }
        } catch {
          /* se falhar cache, ignoramos */
        }
      } else {
        // Se a API não retornou um objeto válido
        setSelectedCbo(null);
        setDisplayValue("");
      }
    } catch (error) {
      console.error("Erro ao buscar CBO por ID:", error);
      // **IMPORTANTE**: EM VEZ DE APAGAR O displayValue, apenas deixamos o que já estava.
      // Ou seja, não damos nenhum setDisplayValue("") aqui.
    } finally {
      setIsLoading(false);
    }
  };

  // ===========
  // Efeito para, sempre que "value" mudar (ID) e NÃO estivermos digitando,
  // buscar a descrição daquele ID e mostrar no input
  // ===========
  useEffect(() => {
    if (!isManuallyEditing) {
      if (value && value.trim() !== "") {
        fetchCboById(value);
      } else {
        // Se o pai limpou o ID, limpamos o input também
        setSelectedCbo(null);
        setDisplayValue("");
      }
    }
  }, [value, isManuallyEditing]);

  // ===========
  // BUSCA DE LISTA DE CBOs (ao digitar) — idem ao seu código original,
  // só que mantendo a estrutura de "fallback offline" e evitando sumir com o texto selecionado.
  // ===========
  const fetchCbos = async (searchTerm: string = "") => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const normalizedSearchTerm = normalizeText(searchTerm);

      if (normalizedSearchTerm.length < 3) {
        if (normalizedSearchTerm.length > 0) {
          setErrorMessage("Digite pelo menos 3 caracteres para pesquisar");
        } else {
          setErrorMessage("Digite pelo menos 3 caracteres para ver as profissões");
        }
        setCbos([]);
        setIsLoading(false);
        return;
      }

      let lista: TipoCboOption[] = [];

      if (!navigator.onLine) {
        // Modo offline: lê do cache
        const cached: any[] = (await indexedDBService.getOpcoes("cbos")) || [];
        const searchWords = normalizedSearchTerm.split(" ").filter(w => w.length > 0);

        lista = cached
          .map((cbo: any) => ({
            ...cbo,
            descricao: normalizeText(cbo.descricao),
            codigo: normalizeText(cbo.codigo)
          }))
          .filter((cbo: any) => {
            // verifica se o código contém exatamente o termo, OU se todas as palavras estão na descrição
            if (cbo.codigo.includes(normalizedSearchTerm)) return true;
            return searchWords.every((w: string) =>
              cbo.descricao.includes(w) || cbo.codigo.includes(w)
            );
          });

        // ordenar por relevância
        lista.sort((a: any, b: any) => {
          const aCod = a.codigo;
          const bCod = b.codigo;
          const aDesc = a.descricao;
          const bDesc = b.descricao;

          if (aCod.includes(normalizedSearchTerm) && !bCod.includes(normalizedSearchTerm)) return -1;
          if (!aCod.includes(normalizedSearchTerm) && bCod.includes(normalizedSearchTerm)) return 1;
          if (aDesc.startsWith(normalizedSearchTerm) && !bDesc.startsWith(normalizedSearchTerm)) return -1;
          if (!aDesc.startsWith(normalizedSearchTerm) && bDesc.startsWith(normalizedSearchTerm)) return 1;
          return aDesc.localeCompare(bDesc);
        });

      } else {
        // Modo online: chama a API e salva no cache
        try {
          const server = import.meta.env.VITE_API_SERVER;
          const port = import.meta.env.VITE_API_PORT;
          const endpoint = `${server}:${port}/api/tipo-cbo/search?descricao=${encodeURIComponent(searchTerm)}&limit=10000`;
          const response = await axios.get(endpoint);

          if (response.data && response.data.data && Array.isArray(response.data.data)) {
            lista = normalizeCbos(response.data.data);

            // salvar no cache (apenas termos curtos, para não inundar com cada letra digitada)
            if (searchTerm.length <= 5) {
              const existing: any[] = (await indexedDBService.getOpcoes("cbos")) || [];
              const merged = [...existing];
              lista.forEach((novo: any) => {
                if (!merged.find((c: any) => c.idtipo_cbo === novo.idtipo_cbo)) {
                  merged.push(novo);
                }
              });
              await indexedDBService.saveOpcoes("cbos", merged);
            }
          }
        } catch (apiError: any) {
          console.warn("⚠️ API de CBOs falhou, tentando cache...");
          
          const cached: any[] = (await indexedDBService.getOpcoes("cbos")) || [];
          if (cached && cached.length > 0) {
            const searchWords = normalizedSearchTerm.split(" ").filter(w => w.length > 0);
            
            lista = cached.filter((cbo: any) => {
              const descricao = normalizeText(cbo.descricao || "");
              const codigo = normalizeText(cbo.codigo || "");
              
              return searchWords.every((w: string) => 
                descricao.includes(w) || codigo.includes(w)
              );
            });
            
            console.log(`✅ Usando cache offline: ${lista.length} CBOs para "${searchTerm}"`);
          } else {
            throw apiError;
          }
        }
      }

      setCbos(lista);
    } catch (error: any) {
      console.error("Erro ao buscar CBOs:", error);
      setCbos([]);
      setErrorMessage("Erro ao buscar profissões");
    } finally {
      setIsLoading(false);
    }
  };

  // ===========
  // Quando o usuário digita algo, entramos em "modo de edição manual"
  // para que o useEffect acima não apague o displayValue automaticamente.
  // ===========
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;

    if (!isManuallyEditing) {
      setIsManuallyEditing(true);
      // se já havia um CBO selecionado, limpamos a seleção
      if (selectedCbo) {
        onChange("");
        setSelectedCbo(null);
      }
    }
    setSearchQuery(query);

    if (query.length > 0 && query.length < 3) {
      setErrorMessage("Digite pelo menos 3 caracteres para pesquisar");
      setCbos([]);
    } else if (query.length >= 3) {
      setErrorMessage(null);
    } else {
      setErrorMessage("Digite pelo menos 3 caracteres para ver as profissões");
      setCbos([]);
    }
  };

  // ===========
  // Quando o usuário clica numa opção, já colocamos imediatamente o texto no input,
  // chamamos o onChange com o ID, e saímos do "modo manual" para que o useEffect não zere nada.
  // ===========
  const handleCboSelect = (cbo: TipoCboOption) => {
    setSelectedCbo(cbo);
    setDisplayValue(cbo.descricao);
    setSearchQuery("");
    setIsManuallyEditing(false);
    onChange(cbo.idtipo_cbo.toString());
    closeDropdown();
  };

  // ===========
  // Limpando o campo
  // ===========
  const handleClear = () => {
    setDisplayValue("");
    setSearchQuery("");
    setSelectedCbo(null);
    setIsManuallyEditing(false);
    onChange("");
  };

  // ===========
  // Abrir/fechar dropdown e cliques fora
  // ===========
  const handleFocus = () => {
    if (disabled) return;
    setSearchQuery("");
    setErrorMessage("Digite pelo menos 3 caracteres para ver as profissões");
    setCbos([]);
    setIsDropdownOpen(true);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
    if (isManuallyEditing && selectedCbo) {
      setSearchQuery("");
      setIsManuallyEditing(false);
    } else if (isManuallyEditing && !selectedCbo) {
      setSearchQuery("");
      setIsManuallyEditing(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, isManuallyEditing, selectedCbo]);

  // ===========
  // Posição do dropdown (desktop vs mobile)
  // ===========
  const updateDropdownPosition = () => {
    if (!inputRef.current || !dropdownRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth <= 768;

    if (isMobile) {
      const spaceBelow = viewportHeight - rect.bottom;
      const maxH = Math.min(300, viewportHeight * 0.6);
      const leftPos = Math.max(0, rect.left);
      const totalW = Math.min(rect.width, viewportWidth - leftPos);

      if (spaceBelow < 150 && rect.top > 150) {
        dropdownRef.current.style.setProperty("bottom", `${viewportHeight - rect.top}px`);
        dropdownRef.current.style.setProperty("top", "auto");
        dropdownRef.current.style.setProperty("max-height", `${Math.min(rect.top - 10, maxH)}px`);
      } else {
        dropdownRef.current.style.setProperty("top", `${rect.bottom}px`);
        dropdownRef.current.style.setProperty("bottom", "auto");
        dropdownRef.current.style.setProperty("max-height", `${Math.min(spaceBelow - 10, maxH)}px`);
      }

      dropdownRef.current.style.setProperty("left", `${leftPos}px`);
      dropdownRef.current.style.setProperty("width", `${totalW}px`);
      dropdownRef.current.style.setProperty("position", "fixed");
      dropdownRef.current.style.setProperty("z-index", "9999");
      dropdownRef.current.style.setProperty("transition", "opacity 0.2s, transform 0.2s");
      dropdownRef.current.style.setProperty("opacity", "1");
      dropdownRef.current.style.setProperty("transform", "translateY(0)");
    } else {
      dropdownRef.current.style.setProperty("position", "absolute");
      dropdownRef.current.style.setProperty("top", `${rect.bottom + window.scrollY}px`);
      dropdownRef.current.style.setProperty("left", `${rect.left + window.scrollX}px`);
      dropdownRef.current.style.setProperty("width", `${rect.width}px`);
      dropdownRef.current.style.setProperty("max-height", "300px");
    }
  };

  useEffect(() => {
    if (isDropdownOpen) {
      updateDropdownPosition();
      if (searchQuery.length < 3) {
        setErrorMessage("Digite pelo menos 3 caracteres para ver as profissões");
        setCbos([]);
      } else {
        setErrorMessage(null);
      }
      window.addEventListener("resize", updateDropdownPosition);
      window.addEventListener("scroll", updateDropdownPosition);
      return () => {
        window.removeEventListener("resize", updateDropdownPosition);
        window.removeEventListener("scroll", updateDropdownPosition);
      };
    }
  }, [isDropdownOpen, searchQuery]);

  // Debounce da busca
  useEffect(() => {
    if (isDropdownOpen && searchQuery.length >= 3) {
      const timer = setTimeout(() => {
        fetchCbos(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, isDropdownOpen]);

  // Filtra lista para exibir
  const filteredCbos = useMemo(() => {
    if (searchQuery.length < 3) {
      return [];
    }
    return cbos;
  }, [cbos, searchQuery]);

  // Render do dropdown via portal
  const renderDropdown = () => {
    if (!isDropdownOpen) return null;
    return createPortal(
      <div
        ref={dropdownRef}
        className="fixed z-[9999] bg-white rounded-lg shadow-md border border-gray-200 flex flex-col"
        style={{
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch"
        }}
      >
        <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Filtrar profissões..."
              className="w-full p-2 pr-8 text-sm border border-gray-200 rounded-md"
              value={searchQuery}
              onChange={handleInputChange}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto py-1 flex-grow">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500 text-center">Carregando...</div>
          ) : errorMessage ? (
            <div className="px-4 py-2 text-sm text-red-500">
              {errorMessage}
              {errorMessage.includes("servidor") && (
                <button className="ml-2 text-blue-500 underline" onClick={() => searchQuery.length >= 3 && fetchCbos(searchQuery)}>
                  Tentar novamente
                </button>
              )}
            </div>
          ) : filteredCbos.length > 0 ? (
            <>
              <div className="px-4 py-1 text-xs text-gray-400">
                {filteredCbos.length} profissões encontradas
              </div>
              {filteredCbos.map(cbo => (
                <button
                  key={cbo.idtipo_cbo}
                  type="button"
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${
                    selectedCbo?.idtipo_cbo === cbo.idtipo_cbo ? "bg-blue-50 text-blue-700" : "text-gray-700"
                  }`}
                  onClick={() => handleCboSelect(cbo)}
                >
                  {cbo.descricao}
                </button>
              ))}
            </>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              {searchQuery.length >= 3
                ? "Nenhuma profissão encontrada"
                : "Digite pelo menos 3 caracteres para pesquisar..."}
            </div>
          )}
        </div>
        <div className="p-2 border-t border-gray-100 sticky bottom-0 bg-white">
          <button
            className="w-full py-2 text-sm text-center bg-gray-100 hover:bg-gray-200 rounded-md"
            onClick={closeDropdown}
          >
            Fechar
          </button>
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
          className={`w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none ${className} ${
            disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : ""
          }`}
          value={displayValue}
          readOnly={true}
          onFocus={handleFocus}
          onClick={handleFocus}
          disabled={disabled}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          ) : displayValue ? (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-red-500 focus:outline-none"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <Search className="h-4 w-4 text-gray-400 pointer-events-none" />
          )}
        </div>
      </div>

      {renderDropdown()}
    </div>
  );
};

export default CboInput;