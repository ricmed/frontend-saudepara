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
  onChange: (startDate: string, startHour: number, startMinute: number, endDate: string, endHour: number, endMinute: number, enabled: boolean) => void;
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

  // 🆕 Sincronizar estado temporário quando as props mudarem (ao carregar do localStorage)
  React.useEffect(() => {
    setTempStartDate(startDate);
    setTempStartHour(startHour);
    setTempStartMinute(startMinute);
    setTempEndDate(endDate);
    setTempEndHour(endHour);
    setTempEndMinute(endMinute);
  }, [startDate, startHour, startMinute, endDate, endHour, endMinute]);

  const handleApply = () => {
    onChange(tempStartDate, tempStartHour, tempStartMinute, tempEndDate, tempEndHour, tempEndMinute, true);
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempStartHour(startHour);
    setTempStartMinute(startMinute);
    setTempEndDate(endDate);
    setTempEndHour(endHour);
    setTempEndMinute(endMinute);
    setIsExpanded(false);
  };

  const handleToggle = () => {
    onChange(startDate, startHour, startMinute, endDate, endHour, endMinute, !enabled);
  };

  const handleConfigureClick = () => {
    // Se o filtro está desabilitado, ativar primeiro
    if (!enabled) {
      onChange(startDate, startHour, startMinute, endDate, endHour, endMinute, true);
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
