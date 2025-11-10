// Componente de seleção de período personalizado para o dashboard
// Permite ao usuário definir data/hora de início e data/hora de fim para filtrar notificações

import React, { useState } from 'react';
import { Calendar, X, Check, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';

interface DateRangeSelectorProps {
  startDate: string; // YYYY-MM-DD
  startHour: number;
  startMinute: number;
  endDate: string; // YYYY-MM-DD
  endHour: number;
  endMinute: number;
  enabled: boolean;
  selectedPublicos?: number[];
  publicoOptions?: Array<{ idtipo_publico: number; descricao: string }>;
  selectedEstabelecimentos?: number[];
  estabelecimentoOptions?: Array<{ idestabelecimento: number; nome: string }>; // ✅ CORRIGIDO: usar 'nome' ao invés de 'descricao'
  onChange: (startDate: string, startHour: number, startMinute: number, endDate: string, endHour: number, endMinute: number, enabled: boolean, selectedPublicos?: number[], selectedEstabelecimentos?: number[]) => void;
  onReset?: () => void;
  periodStart?: Date;
  periodEnd?: Date;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startDate,
  startHour,
  startMinute,
  endDate,
  endHour,
  endMinute,
  enabled,
  selectedPublicos = [],
  publicoOptions = [],
  selectedEstabelecimentos = [],
  estabelecimentoOptions = [],
  onChange,
  onReset,
  periodStart,
  periodEnd,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempStartHour, setTempStartHour] = useState(startHour);
  const [tempStartMinute, setTempStartMinute] = useState(startMinute);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [tempEndHour, setTempEndHour] = useState(endHour);
  const [tempEndMinute, setTempEndMinute] = useState(endMinute);
  const [tempSelectedPublicos, setTempSelectedPublicos] = useState<number[]>(selectedPublicos);
  const [tempSelectedEstabelecimentos, setTempSelectedEstabelecimentos] = useState<number[]>(selectedEstabelecimentos);
  
  // 🔍 Estado para busca de estabelecimentos
  const [searchEstabelecimento, setSearchEstabelecimento] = useState<string>('');

  // Inicializar com todos os públicos selecionados se não houver seleção e existirem opções
  React.useEffect(() => {
    if (publicoOptions.length > 0 && selectedPublicos.length === 0) {
      const todosPublicos = publicoOptions.map(p => p.idtipo_publico);
      setTempSelectedPublicos(todosPublicos);
    }
  }, [publicoOptions, selectedPublicos]);

  // Inicializar com todos os estabelecimentos selecionados se não houver seleção e existirem opções
  React.useEffect(() => {
    if (estabelecimentoOptions.length > 0 && selectedEstabelecimentos.length === 0) {
      const todosEstabelecimentos = estabelecimentoOptions.map(e => e.idestabelecimento);
      setTempSelectedEstabelecimentos(todosEstabelecimentos);
    }
  }, [estabelecimentoOptions, selectedEstabelecimentos]);

  // 🆕 Sincronizar estado temporário quando as props mudarem (ao carregar do localStorage)
  React.useEffect(() => {
    setTempStartDate(startDate);
    setTempStartHour(startHour);
    setTempStartMinute(startMinute);
    setTempEndDate(endDate);
    setTempEndHour(endHour);
    setTempEndMinute(endMinute);
    setTempSelectedPublicos(selectedPublicos);
    setTempSelectedEstabelecimentos(selectedEstabelecimentos);
  }, [startDate, startHour, startMinute, endDate, endHour, endMinute, selectedPublicos, selectedEstabelecimentos]);

  const handleApply = () => {
    onChange(tempStartDate, tempStartHour, tempStartMinute, tempEndDate, tempEndHour, tempEndMinute, true, tempSelectedPublicos, tempSelectedEstabelecimentos);
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempStartHour(startHour);
    setTempStartMinute(startMinute);
    setTempEndDate(endDate);
    setTempEndHour(endHour);
    setTempEndMinute(endMinute);
    setTempSelectedPublicos(selectedPublicos);
    setTempSelectedEstabelecimentos(selectedEstabelecimentos);
    setIsExpanded(false);
  };

  const handleToggle = () => {
    onChange(startDate, startHour, startMinute, endDate, endHour, endMinute, !enabled, selectedPublicos, selectedEstabelecimentos);
  };

  const handleConfigureClick = () => {
    // Se o filtro está desabilitado, ativar primeiro
    if (!enabled) {
      onChange(startDate, startHour, startMinute, endDate, endHour, endMinute, true, selectedPublicos, selectedEstabelecimentos);
    }
    // Depois expandir o painel
    setIsExpanded(!isExpanded);
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
      const todayStr = new Date().toISOString().split('T')[0];
      setTempStartDate(todayStr);
      setTempStartHour(0);
      setTempStartMinute(0);
      setTempEndDate(todayStr);
      setTempEndHour(23);
      setTempEndMinute(59);
      setTempSelectedPublicos([]);
      setTempSelectedEstabelecimentos([]);
    }
  };

  // Função para selecionar todo o conteúdo do input ao focar
  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  // Funções para incrementar/decrementar datas
  const incrementStartDate = () => {
    const date = new Date(tempStartDate + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    setTempStartDate(date.toISOString().split('T')[0]);
  };

  const decrementStartDate = () => {
    const date = new Date(tempStartDate + 'T00:00:00');
    date.setDate(date.getDate() - 1);
    setTempStartDate(date.toISOString().split('T')[0]);
  };

  const incrementEndDate = () => {
    const date = new Date(tempEndDate + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    setTempEndDate(date.toISOString().split('T')[0]);
  };

  const decrementEndDate = () => {
    const date = new Date(tempEndDate + 'T00:00:00');
    date.setDate(date.getDate() - 1);
    setTempEndDate(date.toISOString().split('T')[0]);
  };

  const formatDateTime = (date: string, h: number, m: number) => {
    const dateObj = new Date(date + 'T00:00:00');
    return `${dateObj.toLocaleDateString('pt-BR')} ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const formatPeriod = () => {
    if (!periodStart || !periodEnd) return '';
    
    const formatDate = (date: Date) => {
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return `${formatDate(periodStart)} até ${formatDate(periodEnd)}`;
  };

  // Verificar se há opções disponíveis
  const hasEstabelecimentoOptions = estabelecimentoOptions && estabelecimentoOptions.length > 0;
  const hasPublicoOptions = publicoOptions && publicoOptions.length > 0;
  
  // 🔍 Filtrar estabelecimentos pela busca
  const estabelecimentosFiltrados = React.useMemo(() => {
    if (!searchEstabelecimento.trim()) {
      return estabelecimentoOptions;
    }
    const searchLower = searchEstabelecimento.toLowerCase();
    return estabelecimentoOptions.filter(e => 
      e.nome.toLowerCase().includes(searchLower) // ✅ CORRIGIDO: usar 'nome' ao invés de 'descricao'
    );
  }, [estabelecimentoOptions, searchEstabelecimento]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Filtro de Período</h3>
            <p className="text-sm text-gray-500">
              {enabled 
                ? `De ${formatDateTime(startDate, startHour, startMinute)} até ${formatDateTime(endDate, endHour, endMinute)}`
                : 'Mostrando todas as notificações'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Toggle para ativar/desativar */}
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            title={enabled ? 'Desativar filtro de período' : 'Ativar filtro de período'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>

          {/* Botão para expandir configuração */}
          <button
            onClick={handleConfigureClick}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {isExpanded ? 'Fechar' : 'Configurar'}
          </button>

          {/* Botão de reset - sempre visível */}
          <button
            onClick={handleReset}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Resetar e limpar configuração salva"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Informação do período atual */}
      {enabled && periodStart && periodEnd && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Período ativo:</span> {formatPeriod()}
          </p>
        </div>
      )}

      {/* Painel de configuração expandido */}
      {isExpanded && enabled && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="space-y-4">
            {/* Data e Hora de Início */}
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                📅 Data e Hora de Início
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1 flex items-start gap-1">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Botões de incrementar/decrementar */}
                  <div className="flex flex-col gap-1 mt-6">
                    <button
                      type="button"
                      onClick={incrementStartDate}
                      className="text-gray-500 hover:text-blue-600 focus:outline-none p-1"
                      title="Próximo dia"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={decrementStartDate}
                      className="text-gray-500 hover:text-blue-600 focus:outline-none p-1"
                      title="Dia anterior"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Hora
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={tempStartHour}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 0 && val <= 23) {
                        setTempStartHour(val);
                      }
                    }}
                    onFocus={handleInputFocus}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Minuto
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={tempStartMinute}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 0 && val <= 59) {
                        setTempStartMinute(val);
                      }
                    }}
                    onFocus={handleInputFocus}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <span className="font-medium">Preview:</span> {formatDateTime(tempStartDate, tempStartHour, tempStartMinute)}
              </div>
            </div>

            {/* Data e Hora de Fim */}
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                🏁 Data e Hora de Fim
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1 flex items-start gap-1">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      value={tempEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Botões de incrementar/decrementar */}
                  <div className="flex flex-col gap-1 mt-6">
                    <button
                      type="button"
                      onClick={incrementEndDate}
                      className="text-gray-500 hover:text-blue-600 focus:outline-none p-1"
                      title="Próximo dia"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={decrementEndDate}
                      className="text-gray-500 hover:text-blue-600 focus:outline-none p-1"
                      title="Dia anterior"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Hora
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={tempEndHour}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 0 && val <= 23) {
                        setTempEndHour(val);
                      }
                    }}
                    onFocus={handleInputFocus}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Minuto
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={tempEndMinute}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 0 && val <= 59) {
                        setTempEndMinute(val);
                      }
                    }}
                    onFocus={handleInputFocus}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                <span className="font-medium">Preview:</span> {formatDateTime(tempEndDate, tempEndHour, tempEndMinute)}
              </div>
            </div>

            {/* Filtro de Tipo de Público */}
            {hasPublicoOptions && (
              <div className="border border-gray-300 rounded-lg p-4 bg-white">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  👥 Tipo de Público Atendido
                </label>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {publicoOptions.map((publico) => (
                    <label
                      key={publico.idtipo_publico}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:bg-white p-2 rounded cursor-pointer transition-colors"
                    >
                    <input
                      type="checkbox"
                      checked={tempSelectedPublicos.includes(publico.idtipo_publico)}
                      onChange={(e) => {
                        console.log('Checkbox clicked:', publico.descricao, 'ID:', publico.idtipo_publico, 'Checked:', e.target.checked);
                        console.log('Current tempSelectedPublicos:', tempSelectedPublicos);
                        if (e.target.checked) {
                          const newSelection = [...tempSelectedPublicos, publico.idtipo_publico];
                          console.log('Adding to selection:', newSelection);
                          setTempSelectedPublicos(newSelection);
                        } else {
                          const newSelection = tempSelectedPublicos.filter(id => id !== publico.idtipo_publico);
                          console.log('Removing from selection:', newSelection);
                          setTempSelectedPublicos(newSelection);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                      <span className="flex-1">{publico.descricao}</span>
                    </label>
                  ))}
                </div>
                
                <div className="flex items-center gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => setTempSelectedPublicos(publicoOptions.map(p => p.idtipo_publico))}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    Selecionar Todos
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={() => setTempSelectedPublicos([])}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    Limpar Seleção
                  </button>
                  <span className="text-gray-400 text-xs ml-auto">
                    {tempSelectedPublicos.length} de {publicoOptions.length} selecionado{tempSelectedPublicos.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Filtro de Unidade Notificadora / Estabelecimento */}
            {hasEstabelecimentoOptions && (
              <div className="border border-gray-300 rounded-lg p-4 bg-white">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🏥 Unidade Notificadora
                </label>
                
                {/* Campo de busca */}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Buscar unidade..."
                    value={searchEstabelecimento}
                    onChange={(e) => setSearchEstabelecimento(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchEstabelecimento && (
                    <p className="text-xs text-gray-500 mt-1">
                      Mostrando {estabelecimentosFiltrados.length} de {estabelecimentoOptions.length} unidades
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {estabelecimentosFiltrados.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhuma unidade encontrada
                    </p>
                  ) : (
                    estabelecimentosFiltrados.map((estabelecimento) => (
                      <label
                        key={estabelecimento.idestabelecimento}
                        className="flex items-center gap-2 text-sm text-gray-700 hover:bg-white p-2 rounded cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={tempSelectedEstabelecimentos.includes(estabelecimento.idestabelecimento)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempSelectedEstabelecimentos([...tempSelectedEstabelecimentos, estabelecimento.idestabelecimento]);
                            } else {
                              setTempSelectedEstabelecimentos(tempSelectedEstabelecimentos.filter(id => id !== estabelecimento.idestabelecimento));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                        />
                        <span className="flex-1 break-words">{estabelecimento.nome}</span> {/* ✅ CORRIGIDO: usar 'nome' ao invés de 'descricao' */}
                      </label>
                    ))
                  )}
                </div>
                
                <div className="flex items-center gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => setTempSelectedEstabelecimentos(estabelecimentoOptions.map(e => e.idestabelecimento))}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    Selecionar Todos
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={() => setTempSelectedEstabelecimentos([])}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    Limpar Seleção
                  </button>
                  <span className="text-gray-400 text-xs ml-auto">
                    {tempSelectedEstabelecimentos.length} de {estabelecimentoOptions.length} selecionado{tempSelectedEstabelecimentos.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex items-center gap-2 justify-end pt-2 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Aplicar
              </button>
            </div>

            {/* Exemplos de uso */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-700 mb-2">💡 Exemplos de uso:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <strong>Dia completo:</strong> 01/11/2024 00:00 até 01/11/2024 23:59</li>
                <li>• <strong>Período de 3 dias:</strong> 01/11/2024 00:00 até 03/11/2024 23:59</li>
                <li>• <strong>Turno específico:</strong> 01/11/2024 08:00 até 01/11/2024 17:00</li>
                <li>• <strong>Semana completa:</strong> 01/11/2024 00:00 até 07/11/2024 23:59</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;
