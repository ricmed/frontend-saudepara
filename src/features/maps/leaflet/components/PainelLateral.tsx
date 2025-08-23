import React, { useState, useMemo } from 'react';
import { Local, TipoHabilitacao, TipoQualificacao } from '../types';
import { MIN_RADIUS, MAX_RADIUS } from '../utils/constants';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { QUALIFICACOES_PREDEFINIDAS } from '../../../../data/qualificacoesPredefinidas';
import { NavigationMenu } from './NavigationMenu';

// Importar estilos CSS customizados
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
  onLoadMore: () => void;
  onSearch: () => void;
}

export const PainelLateral: React.FC<PainelLateralProps> = ({
  menuAberto,
  onClose,
  tiposHabilitacoes,
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
  onLoadMore,
  onSearch,
}) => {
  const [searchText, setSearchText] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (localId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(localId)) {
      newExpanded.delete(localId);
    } else {
      newExpanded.add(localId);
    }
    setExpandedCards(newExpanded);
  };

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
        fixed md:static top-0 left-0 z-[800] 
        w-full sm:w-80 md:w-96 lg:w-64 xl:w-72 
        h-full md:h-screen
        bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${menuAberto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:block md:shadow-none md:border-r md:border-gray-200
        overflow-y-auto flex flex-col
        painel-lateral-mobile md:painel-lateral-desktop
        scrollbar-thin
      `}
    >
      <div className="p-3 sm:p-4 relative">
        {/* Botão de fechar no mobile/tablet */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden p-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-lg font-bold mb-4 text-gray-800">Estabelecimentos de Saúde</h2>

        {/* Campo de busca geral */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar estabelecimento
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Nome, endereço, habilitação ou tipo..."
              className="w-full pl-10 pr-10 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Seletor de habilitação */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Habilitação
          </label>
          <select
            value={habilitacaoSelecionada}
            onChange={(e) => onHabilitacaoChange(e.target.value)}
            className="w-full p-3 text-sm border border-gray-300 rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todas">Todas as Habilitações</option>
            {tiposHabilitacoes.map((habilitacao) => (
              <option key={habilitacao.id} value={habilitacao.nome}>
                {habilitacao.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Campo de pesquisa por qualificação */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Qualificação
          </label>
          <select
            value={qualificacaoSelecionada}
            onChange={(e) => onQualificacaoChange(e.target.value)}
            className="w-full p-3 text-sm border border-gray-300 rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Natureza Jurídica
          </label>
          <select
            value={naturezaSelecionada}
            onChange={(e) => onNaturezaChange(e.target.value)}
            className="w-full p-3 text-sm border border-gray-300 rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todas</option>
            <option value="PÚBLICO">Público</option>
            <option value="PRIVADO">Privado</option>
          </select>
        </div>

        {/* Raio de busca */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Raio de Busca (km)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={MIN_RADIUS / 1000}
              max={MAX_RADIUS / 1000}
              value={searchRadius / 1000}
              onChange={handleRadiusChange}
              className="w-20 p-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={onSearch}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 transition-colors text-sm font-medium
                focus:outline-none focus:ring-2 focus:ring-blue-500
                focus:ring-offset-2 shadow-sm"
            >
              Buscar
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Digite um valor entre {MIN_RADIUS / 1000} e {MAX_RADIUS / 1000} km
          </p>
        </div>

        {/* Lista de estabelecimentos */}
        <div className="border-t border-gray-200 pt-4 flex-1 overflow-hidden">
          {searchFilteredPlaces.length === 0 ? (
            <div className="text-gray-500 text-center py-8 px-4">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">
                {searchText 
                  ? `Nenhum estabelecimento encontrado para "${searchText}"`
                  : `Nenhum estabelecimento encontrado no raio de ${searchRadius / 1000} km.`
                }
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-900">
                  {searchFilteredPlaces.length} estabelecimento(s) encontrado(s)
                </p>
                <span className="text-sm text-blue-600 font-medium">
                  Mostrando {Math.min(visibleCount, searchFilteredPlaces.length)}
                </span>
              </div>
            </>
          )}

          <div className="space-y-3 establishment-list-container flex-1 overflow-y-auto">
            {displayedPlaces.map((local, index) => {
              const isExpanded = expandedCards.has(local.id);
              return (
                <div
                  key={local.id || index}
                  className="establishment-card bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="establishment-title font-semibold text-gray-900 mb-2">{local.nome}</div>
                  
                  {/* Endereço */}
                  {local.endereco && (
                    <div className="establishment-address text-gray-600 mb-2 sm:mb-3 flex items-start">
                      <svg className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-1 sm:mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="leading-4 sm:leading-5">{local.endereco}</span>
                    </div>
                  )}
                  
                  {/* Badges de natureza e turno */}
                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                    <span
                      className={`
                        badge-responsive inline-flex items-center rounded-full font-medium
                        ${
                          local.natureza?.toLowerCase().includes('público') ||
                          local.natureza?.toLowerCase().includes('publico') ||
                          local.natureza?.toLowerCase().includes('municipal') ||
                          local.natureza?.toLowerCase().includes('estadual') ||
                          local.natureza?.toLowerCase().includes('federal')
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      `}
                    >
                      {local.natureza}
                    </span>
                    
                    {local.turno && local.turno !== 'Não informado' && (
                      <span className="badge-responsive inline-flex items-center rounded-full font-medium bg-green-100 text-green-800">
                        {local.turno}
                      </span>
                    )}
                  </div>

                  {/* Botão para expandir/recolher detalhes */}
                  {(local.habilitacoes.length > 0 || local.qualificacoes.length > 0) && (
                    <button
                      onClick={() => toggleCard(local.id)}
                      className="flex items-center gap-1 text-xs sm:text-sm text-blue-600 hover:text-blue-800 mt-2 sm:mt-3 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                    </button>
                  )}

                  {/* Detalhes expandidos */}
                  {isExpanded && (
                    <div className="mt-3 space-y-3 pt-3 border-t border-gray-200">
                      {/* Habilitações */}
                      {local.habilitacoes.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-700 mb-2">
                            Habilitações ({local.habilitacoes.length})
                          </div>
                          <div className="space-y-1">
                            {local.habilitacoes.map((hab, idx) => (
                              <div key={idx} className="bg-blue-50 px-2 py-1 rounded text-xs text-blue-700 border border-blue-200">
                                • {hab}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Qualificações */}
                      {local.qualificacoes.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-700 mb-2">
                            Qualificações ({local.qualificacoes.length})
                          </div>
                          <div className="space-y-1">
                            {local.qualificacoes.map((qual, idx) => (
                              <div key={idx} className="bg-green-50 px-2 py-1 rounded text-xs text-green-700 border border-green-200">
                                • {qual}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CNES se disponível */}
                      {local.cnes && (
                        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <strong>CNES:</strong> {local.cnes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Menu de navegação - substitui o botão "Traçar Rota" */}
                  <NavigationMenu 
                    local={local}
                    className="mt-3 sm:mt-4"
                  />
                </div>
              );
            })}

          </div>

          {visibleCount < searchFilteredPlaces.length && (
            <button
              onClick={onLoadMore}
              className="w-full mt-4 px-4 py-3 bg-gray-100 text-gray-700 border border-gray-300
                rounded-lg hover:bg-gray-200 transition-colors text-sm
                font-medium focus:outline-none focus:ring-2
                focus:ring-gray-500 focus:ring-offset-2 inline-flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Mostrando {Math.min(visibleCount, searchFilteredPlaces.length)} de {searchFilteredPlaces.length}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PainelLateral;
