import React from 'react';
import { Local, TipoEstabelecimento } from '../types';
import { MIN_RADIUS, MAX_RADIUS } from '../utils/constants';

interface PainelLateralProps {
  menuAberto: boolean;
  onClose: () => void;

  tiposEstabelecimentos: TipoEstabelecimento[];
  tipoSelecionado: string;
  naturezaSelecionada: string;
  searchRadius: number;
  filteredPlaces: Local[];
  visibleCount: number;

  onTipoChange: (tipo: string) => void;
  onNaturezaChange: (natureza: string) => void;
  onRadiusChange: (radius: number) => void;
  onTracarRota: (local: Local) => void;
  onLoadMore: () => void;
  onSearch: () => void;
}

export const PainelLateral: React.FC<PainelLateralProps> = ({
  menuAberto,
  onClose,
  tiposEstabelecimentos,
  tipoSelecionado,
  naturezaSelecionada,
  searchRadius,
  filteredPlaces,
  visibleCount,
  onTipoChange,
  onNaturezaChange,
  onRadiusChange,
  onTracarRota,
  onLoadMore,
  onSearch,
}) => {
  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const kmValue = Number(e.target.value);
    const value = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, kmValue * 1000));
    onRadiusChange(value);
  };

  return (
    <div
      className={`
        fixed md:absolute top-0 left-0 z-40 w-full md:w-80 h-full md:h-auto
        bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${menuAberto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:static md:transform-none md:top-4 md:left-4 md:max-h-[80vh]
        overflow-y-auto
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

        {/* Seletor de tipo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Estabelecimento
          </label>
          <select
            value={tipoSelecionado}
            onChange={(e) => onTipoChange(e.target.value)}
            className="w-full p-2 border rounded-md shadow-sm bg-white"
          >
            {tiposEstabelecimentos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
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

        {/* Lista de estabelecimentos */}
        <div className="space-y-2">
          {filteredPlaces.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhum estabelecimento encontrado no raio de {searchRadius / 1000} km.
            </p>
          ) : (
            <p className="text-sm text-gray-600 mb-2">
              {filteredPlaces.length} estabelecimento(s) encontrado(s)
            </p>
          )}

          {filteredPlaces.slice(0, visibleCount).map((local, index) => (
            <div
              key={index} // Usamos o índice apenas como fallback, já que não temos local.id
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="font-medium">{local.nome}</div>
              <div className="text-sm text-gray-600 mt-1">{local.endereco}</div>
              <div className="text-sm mt-1">
                <span
                  className={`
                    px-2 py-1 rounded-full text-xs
                    ${
                      local.natureza === 'PÚBLICO'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  `}
                >
                  {local.natureza}
                </span>
              </div>
              <div className="text-sm mt-1 text-gray-600">{local.tipo}</div>
              <div className="text-sm mt-1 text-gray-500">{local.turno}</div>
              <button
                onClick={() => onTracarRota(local)}
                className="mt-2 w-full px-4 py-2 bg-blue-500 text-white
                  rounded-md hover:bg-blue-600 transition-colors text-sm
                  font-medium focus:outline-none focus:ring-2
                  focus:ring-blue-500 focus:ring-offset-2"
              >
                Traçar Rota
              </button>
            </div>
          ))}

          {visibleCount < filteredPlaces.length && (
            <button
              onClick={onLoadMore}
              className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-800
                rounded-md hover:bg-gray-300 transition-colors text-sm
                font-medium focus:outline-none focus:ring-2
                focus:ring-gray-500 focus:ring-offset-2"
            >
              Carregar mais
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PainelLateral;
