import React, { useState, useMemo } from 'react';
import { Local, TipoHabilitacao, TipoQualificacao } from '../types';
import { MIN_RADIUS, MAX_RADIUS } from '../utils/constants';
import { QUALIFICACOES_PREDEFINIDAS } from '../../../../data/qualificacoesPredefinidas';
import '../styles/PainelLateral.css';

interface PainelLateralProps {
  menuAberto: boolean;
  onClose: () => void;

  tiposHabilitacoes: TipoHabilitacao[];
  tiposQualificacoes: TipoQualificacao[];
  habilitacaoSelecionada: string;
  qualificacaoSelecionada: string;
  naturezaSelecionada: string;
  searchRadius: number;
  filteredPlaces: Local[];
  visibleCount: number;

  onHabilitacaoChange: (habilitacao: string) => void;
  onQualificacaoChange: (qualificacao: string) => void;
  onNaturezaChange: (natureza: string) => void;
  onRadiusChange: (radius: number) => void;
  onTracarRota: (local: Local, transportType?: string) => void;
  onLoadMore: () => void;
  onSearch: () => void;
}

export const PainelLateral: React.FC<PainelLateralProps> = ({
  menuAberto,
  onClose,
  tiposHabilitacoes,
  tiposQualificacoes,
  habilitacaoSelecionada,
  qualificacaoSelecionada,
  naturezaSelecionada,
  searchRadius,
  filteredPlaces,
  visibleCount,
  onHabilitacaoChange,
  onQualificacaoChange,
  onNaturezaChange,
  onRadiusChange,
  onTracarRota,
  onLoadMore,
  onSearch,
}) => {
  const [searchText, setSearchText] = useState('');

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const kmValue = Number(e.target.value);
    const value = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, kmValue * 1000));
    onRadiusChange(value);
  };

  // Filtrar estabelecimentos baseado no texto de pesquisa
  const searchFilteredPlaces = useMemo(() => {
    if (!searchText.trim()) {
      return filteredPlaces;
    }
    
    const searchLower = searchText.toLowerCase().trim();
    return filteredPlaces.filter(local => 
      local.nome.toLowerCase().includes(searchLower) ||
      (local.endereco && local.endereco.toLowerCase().includes(searchLower)) ||
      local.habilitacoes.some(h => h.toLowerCase().includes(searchLower)) ||
      local.qualificacoes.some(q => q.toLowerCase().includes(searchLower))
    );
  }, [filteredPlaces, searchText]);

  const displayedPlaces = searchFilteredPlaces.slice(0, visibleCount);

  return (
    <div
      className={`
        fixed md:static top-0 left-0 z-40 w-full md:w-80 h-full md:h-auto
        bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${menuAberto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:block md:shadow-none md:border-r md:border-gray-200
        overflow-y-auto md:max-h-screen
      `}
    >
      <div className="p-4 relative">
        {/* Botão de fechar no mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden p-2 text-gray-600 bg-gray-200 rounded"
        >
          Fechar
        </button>

        <h2 className="text-lg font-bold mb-4">Estabelecimentos de Saúde</h2>

        {/* Seletor de habilitação */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Habilitação
          </label>
          <select
            value={habilitacaoSelecionada}
            onChange={(e) => onHabilitacaoChange(e.target.value)}
            className="w-full p-2 border rounded-md shadow-sm bg-white"
          >
            {tiposHabilitacoes.map((habilitacao) => (
              <option key={habilitacao.id} value={habilitacao.id}>
                {habilitacao.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Campo de pesquisa por qualificação */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Qualificação
          </label>
          <select
            value={qualificacaoSelecionada}
            onChange={(e) => onQualificacaoChange(e.target.value)}
            className="w-full p-2 border rounded-md shadow-sm bg-white"
          >
            {QUALIFICACOES_PREDEFINIDAS.map((qualificacao) => (
              <option key={qualificacao.id} value={qualificacao.id === "todas" ? "todas" : qualificacao.nome}>
                {qualificacao.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Seletor de natureza */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Natureza Jurídica
          </label>
          <select
            value={naturezaSelecionada}
            onChange={(e) => onNaturezaChange(e.target.value)}
            className="w-full p-2 border rounded-md shadow-sm bg-white"
          >
            <option value="todos">Todas</option>
            <option value="PÚBLICO">Público</option>
            <option value="PRIVADO">Privado</option>
          </select>
        </div>

        {/* Raio de busca */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Raio de Busca (km)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={MIN_RADIUS / 1000}
              max={MAX_RADIUS / 1000}
              value={searchRadius / 1000}
              onChange={handleRadiusChange}
              className="w-24 p-2 border rounded-md shadow-sm"
            />
            <button
              onClick={onSearch}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md
                hover:bg-blue-600 transition-colors text-sm font-medium
                focus:outline-none focus:ring-2 focus:ring-blue-500
                focus:ring-offset-2"
            >
              Buscar
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Digite um valor entre {MIN_RADIUS / 1000} e {MAX_RADIUS / 1000} km
          </p>
        </div>

        {/* Campo de pesquisa */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pesquisar Estabelecimento
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Digite o nome, endereço ou tipo..."
              className="w-full p-2 pl-8 border rounded-md shadow-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                transition-colors"
            />
            <svg 
              className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 hover:text-gray-600"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchText && (
            <p className="text-xs text-gray-500 mt-1">
              {searchFilteredPlaces.length} resultado(s) encontrado(s)
            </p>
          )}
        </div>

        {/* Lista de estabelecimentos com altura fixa e scroll */}
        <div className="flex flex-col">
          {searchFilteredPlaces.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              {searchText 
                ? `Nenhum estabelecimento encontrado para "${searchText}"`
                : `Nenhum estabelecimento encontrado no raio de ${searchRadius / 1000} km.`
              }
            </p>
          ) : (
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2 flex items-center justify-between">
                <span>
                  {searchText 
                    ? `${searchFilteredPlaces.length} resultado(s) para "${searchText}"`
                    : `${filteredPlaces.length} estabelecimento(s) encontrado(s)`
                  }
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Mostrando {Math.min(visibleCount, searchFilteredPlaces.length)}
                </span>
              </p>
              
              {/* Container com altura fixa e scroll */}
              <div className="establishment-list-container overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 p-2 scrollbar-thin relative">
                <div className="space-y-2">
                  {displayedPlaces.map((local, index) => (
                    <div
                      key={index}
                      className="establishment-card p-3 bg-white rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 shadow-sm border border-gray-100 cursor-pointer group"
                    >
                      <div className="font-medium text-sm text-gray-900 group-hover:text-blue-900">{local.nome}</div>
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">{local.endereco}</div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${
                              local.natureza === 'PÚBLICO'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          `}
                        >
                          {local.natureza}
                        </span>
                        {local.turno && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {local.turno}
                          </span>
                        )}
                      </div>
                      
                      {/* Exibir habilitações */}
                      {local.habilitacoes.length > 0 && (
                        <div className="text-xs mt-1 text-gray-600">
                          <strong>Habilitações:</strong> {local.habilitacoes.slice(0, 2).join(', ')}
                          {local.habilitacoes.length > 2 && ` (+${local.habilitacoes.length - 2})`}
                        </div>
                      )}
                      
                      {/* Exibir qualificações */}
                      {local.qualificacoes.length > 0 && (
                        <div className="text-xs mt-1 text-gray-600">
                          <strong>Qualificações:</strong> {local.qualificacoes.slice(0, 2).join(', ')}
                          {local.qualificacoes.length > 2 && ` (+${local.qualificacoes.length - 2})`}
                        </div>
                      )}
                      
                      <button
                        onClick={() => onTracarRota(local)}
                        className="mt-2 w-full px-3 py-1.5 bg-blue-500 text-white
                          rounded-md hover:bg-blue-600 transition-colors text-xs
                          font-medium focus:outline-none focus:ring-2
                          focus:ring-blue-500 focus:ring-offset-1 group-hover:bg-blue-600"
                      >
                        📍 Traçar Rota
                      </button>
                    </div>
                  ))}
                  
                  {/* Indicador de fim da lista */}
                  {visibleCount >= searchFilteredPlaces.length && searchFilteredPlaces.length > 0 && (
                    <div className="text-center py-2 text-xs text-gray-500">
                      • Todos os estabelecimentos foram carregados •
                    </div>
                  )}
                </div>
              </div>
              
              {/* Botão carregar mais fora do container de scroll */}
              {visibleCount < searchFilteredPlaces.length && (
                <div className="mt-3">
                  {/* Barra de progresso */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${(visibleCount / searchFilteredPlaces.length) * 100}%` }}
                    ></div>
                  </div>
                  
                  <button
                    onClick={onLoadMore}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white
                      rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200
                      text-sm font-medium focus:outline-none focus:ring-2
                      focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md
                      flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Carregar mais ({searchFilteredPlaces.length - visibleCount} restantes)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PainelLateral;
