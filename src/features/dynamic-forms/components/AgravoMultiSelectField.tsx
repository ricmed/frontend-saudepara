import React, { useState, useMemo } from 'react';
import { Search, Check, X } from 'lucide-react';
import {
  SyndromicAgravoOption,
  SyndromicAgravoRanking,
  fetchSyndromicSintomasByAgravo,
} from '../services/syndromicMatrixService';

function searchMatches(label: string, term: string): boolean {
  if (!term) return true;
  return label.toLowerCase().includes(term.toLowerCase());
}

interface AgravoCardProps {
  option: SyndromicAgravoOption;
  isSelected: boolean;
  disabled: boolean;
  ranking: SyndromicAgravoRanking | undefined;
  sintomasSelecionados: string[];
  onToggle: () => void;
}

const AgravoCard: React.FC<AgravoCardProps> = ({
  option,
  isSelected,
  disabled,
  ranking,
  sintomasSelecionados,
  onToggle,
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupSintomas, setPopupSintomas] = useState<import('../services/syndromicMatrixService').SyndromicSintomaDetail[] | null>(null);
  const [loadingPopup, setLoadingPopup] = useState(false);

  const handleStethoscope = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (showPopup) {
      setShowPopup(false);
      return;
    }
    setShowPopup(true);
    if (popupSintomas === null) {
      try {
        setLoadingPopup(true);
        const data = await fetchSyndromicSintomasByAgravo(option.value);
        setPopupSintomas(data);
      } catch {
        // Endpoint ainda não existe no back — usa matchedSymptoms do ranking como fallback
        setPopupSintomas([]);
      } finally {
        setLoadingPopup(false);
      }
    }
  };

  // Fallback: quando API não retornou dados, mostra os sintomas correspondentes do ranking (nomes)
  const fallbackSintomas: string[] = ranking?.matchedSymptoms ?? [];

  const borderClass = isSelected
    ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
    : ranking
      ? 'bg-amber-50/40 border-2 border-amber-300 hover:border-amber-400 hover:bg-amber-50'
      : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm';

  return (
    <div className="relative">
      <label
        className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        } ${borderClass}`}
      >
        <div className="flex items-center h-6 mt-0.5 flex-shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            disabled={disabled}
            className="w-6 h-6 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all cursor-pointer"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`text-sm font-medium leading-snug ${
                isSelected ? 'text-blue-900' : 'text-gray-900'
              }`}
            >
              {option.label}
            </span>

            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              {ranking && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    ranking.compatibility >= 50
                      ? 'bg-green-100 text-green-800'
                      : ranking.compatibility >= 20
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {ranking.compatibility}%
                </span>
              )}
              <button
                type="button"
                onClick={handleStethoscope}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors text-sm leading-none border ${
                  showPopup
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-400'
                }`}
                title="Ver sintomas relacionados"
              >
                🩺
              </button>
              {isSelected && <Check className="h-5 w-5 text-blue-600 shrink-0" />}
            </div>
          </div>

          {option.cid10Lista.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {option.cid10Lista.map((cid) => (
                <span
                  key={cid}
                  className="inline-block text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded px-1.5 py-0.5 font-mono"
                >
                  {cid}
                </span>
              ))}
            </div>
          )}

          {ranking && ranking.matchedSymptomsCount > 0 && (
            <p className="text-xs text-amber-700 mt-1">
              {ranking.matchedSymptomsCount}{' '}
              {ranking.matchedSymptomsCount === 1 ? 'sintoma compatível' : 'sintomas compatíveis'}
            </p>
          )}
        </div>
      </label>

      {showPopup && (
        <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-3 w-72 text-xs text-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900 text-sm">Sintomas relacionados</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPopup(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {loadingPopup ? (
            <div className="flex items-center gap-2 py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
              <span className="text-gray-500">Carregando...</span>
            </div>
          ) : popupSintomas !== null && popupSintomas.length > 0 ? (
            <ul className="space-y-1 max-h-52 overflow-y-auto pr-1">
              {popupSintomas.map((s) => {
                const isSelecionado = sintomasSelecionados.includes(s.value);
                return (
                  <li
                    key={s.value}
                    className={`flex items-start gap-1.5 ${isSelecionado ? 'text-green-700 font-medium' : ''}`}
                  >
                    <span className="mt-0.5 shrink-0">{isSelecionado ? '✓' : '·'}</span>
                    <span className="flex-1">
                      {s.label}
                      {isSelecionado && (
                        <span className="ml-1 text-green-500 font-normal">(selecionado)</span>
                      )}
                      {s.sinalAlarme && (
                        <span className="ml-1 text-xs bg-orange-100 text-orange-700 rounded px-1">⚠ alarme</span>
                      )}
                      {s.sinalGravidade && (
                        <span className="ml-1 text-xs bg-red-100 text-red-700 rounded px-1">🔴 gravidade</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : fallbackSintomas.length > 0 ? (
            <>
              <p className="text-xs text-amber-700 mb-1.5 font-medium">Compatíveis com seus sintomas selecionados:</p>
              <ul className="space-y-1 max-h-52 overflow-y-auto pr-1">
                {fallbackSintomas.map((nome, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-green-700 font-medium">
                    <span className="mt-0.5 shrink-0">✓</span>
                    <span>{nome}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-gray-500 italic">
              {popupSintomas === null ? 'Clique para carregar sintomas.' : 'Nenhum sintoma cadastrado para este agravo.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

interface AgravoMultiSelectFieldProps {
  label: string;
  helpText?: string;
  value: string[];
  onChange: (val: string[]) => void;
  agravoOptions: SyndromicAgravoOption[];
  agravosRanking: SyndromicAgravoRanking[];
  sintomasSelecionados: string[];
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export const AgravoMultiSelectField: React.FC<AgravoMultiSelectFieldProps> = ({
  label,
  helpText,
  value,
  onChange,
  agravoOptions,
  agravosRanking,
  sintomasSelecionados,
  disabled,
  error,
  required,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const rankingMap = useMemo(() => {
    const map = new Map<string, SyndromicAgravoRanking>();
    agravosRanking.forEach((r) => map.set(r.value, r));
    return map;
  }, [agravosRanking]);

  const sortedOptions = useMemo(() => {
    const ranked = agravoOptions
      .filter((o) => rankingMap.has(o.value))
      .sort((a, b) => rankingMap.get(b.value)!.compatibility - rankingMap.get(a.value)!.compatibility);
    const unranked = agravoOptions.filter((o) => !rankingMap.has(o.value));
    return [...ranked, ...unranked];
  }, [agravoOptions, rankingMap]);

  const filteredOptions = useMemo(
    () => sortedOptions.filter((o) => searchMatches(o.label, searchTerm)),
    [sortedOptions, searchTerm],
  );

  const handleToggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };

  const allSelected =
    agravoOptions.length > 0 && agravoOptions.every((o) => value.includes(o.value));

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {value.length > 0 && (
          <span className="text-sm text-gray-500">
            {value.length} selecionado{value.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {helpText && <p className="text-xs text-gray-500 mb-2">{helpText}</p>}

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
          placeholder="Buscar opções..."
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          disabled={disabled || agravoOptions.length === 0 || allSelected}
          onClick={() => onChange(agravoOptions.map((o) => o.value))}
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Selecionar todos
        </button>
        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={() => onChange([])}
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Limpar seleção
        </button>
        {agravosRanking.length > 0 && (
          <span className="inline-flex items-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
            Compatíveis no topo · ordenados por %
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredOptions.length === 0 ? (
          <div className="col-span-full py-4 text-center text-sm text-gray-500">
            Nenhuma opção encontrada
          </div>
        ) : (
          filteredOptions.map((option) => (
            <AgravoCard
              key={option.value}
              option={option}
              isSelected={value.includes(option.value)}
              disabled={!!disabled}
              ranking={rankingMap.get(option.value)}
              sintomasSelecionados={sintomasSelecionados}
              onToggle={() => handleToggle(option.value)}
            />
          ))
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};
