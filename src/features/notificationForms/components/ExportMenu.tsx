// CompactExportMenu.tsx - Versão compacta e eficiente
import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  FileImage,
  Table,
  FileCheck,
  Layers,
  ChevronDown
} from 'lucide-react';
import { PDFExportType } from '@/features/notificationForms/components/exportUtilities';
import type { EventoOption } from '@/features/notificationForms/types/index2';
import { splitListaEventos } from '@/features/notificationForms/utils/listaEventoSelecao';

interface CompactExportMenuProps {
  isOpen: boolean;
  onExport: (format: 'csv' | 'excel' | 'pdf', type: 'page' | 'all', pdfType?: PDFExportType, eventId?: number) => void;
  isLoading: boolean;
  eventos: EventoOption[];
}

const CompactExportMenu: React.FC<CompactExportMenuProps> = ({
  isOpen,
  onExport,
  isLoading,
  eventos
}) => {
  const [selectedPdfType, setSelectedPdfType] = useState<PDFExportType>('both');
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');

  if (!isOpen) return null;

  const eventId = Number(selectedEventId);
  const hasEvento = Number.isInteger(eventId) && eventId > 0;
  const exportDisabled = isLoading || !hasEvento;
  const { ativos: eventosAtivos, historico: eventosHistorico } = splitListaEventos(eventos);

  const handleExport = (
    format: 'csv' | 'excel' | 'pdf',
    type: 'page' | 'all',
    pdfType?: PDFExportType
  ) => {
    if (!hasEvento) return;
    onExport(format, type, pdfType, eventId);
  };

  const pdfTypes = [
    { type: 'table' as PDFExportType, name: 'Tabela', icon: Table },
    { type: 'forms' as PDFExportType, name: 'Fichas', icon: FileCheck },
    { type: 'both' as PDFExportType, name: 'Completo', icon: Layers }
  ];

  const currentPdfType = pdfTypes.find(type => type.type === selectedPdfType) || pdfTypes[2];

  return (
    <div className="absolute right-0 md:right-0 left-0 md:left-auto mt-2 w-full md:w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="px-4 py-2 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center">
          <Download className="h-4 w-4 mr-2" />
          <span className="font-medium text-sm">Exportar Dados</span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        <div>
          <label htmlFor="export-evento" className="block text-xs font-medium text-gray-700 mb-1">
            Evento
          </label>
          <select
            id="export-evento"
            data-testid="export-evento"
            value={selectedEventId}
            onChange={(event) => setSelectedEventId(event.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 text-gray-900 bg-white"
          >
            <option value="">Selecione o evento</option>
            {eventosAtivos.length > 0 && (
              <optgroup label="Eventos ativos">
                {eventosAtivos.map((evento) => (
                  <option key={evento.idtipo_evento} value={evento.idtipo_evento}>
                    {evento.descricao}
                  </option>
                ))}
              </optgroup>
            )}
            {eventosHistorico.length > 0 && (
              <optgroup label="Histórico">
                {eventosHistorico.map((evento) => (
                  <option key={evento.idtipo_evento} value={evento.idtipo_evento}>
                    {evento.descricao}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            As colunas seguem o evento (bairro ou localidade).
          </p>
        </div>

        <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
          <div className="flex items-center">
            <FileSpreadsheet className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-gray-900">Excel</span>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => handleExport('excel', 'page')}
              disabled={exportDisabled}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Página
            </button>
            <button
              onClick={() => handleExport('excel', 'all')}
              disabled={exportDisabled}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Todos
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center">
            <FileText className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-900">CSV</span>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => handleExport('csv', 'page')}
              disabled={exportDisabled}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Página
            </button>
            <button
              onClick={() => handleExport('csv', 'all')}
              disabled={exportDisabled}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Todos
            </button>
          </div>
        </div>

        <div className="bg-red-50 rounded border border-red-200">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center">
              <FileImage className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-sm font-medium text-gray-900">PDF</span>
            </div>
            <button
              onClick={() => setShowPdfOptions(!showPdfOptions)}
              className="flex items-center text-xs text-red-700 hover:text-red-800"
            >
              <currentPdfType.icon className="h-3 w-3 mr-1" />
              {currentPdfType.name}
              <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showPdfOptions ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showPdfOptions && (
            <div className="px-2 pb-2 space-y-1">
              {pdfTypes.map((type) => {
                const IconComponent = type.icon;
                const isSelected = selectedPdfType === type.type;
                
                return (
                  <button
                    key={type.type}
                    onClick={() => {
                      setSelectedPdfType(type.type);
                      setShowPdfOptions(false);
                    }}
                    className={`w-full flex items-center p-1.5 rounded text-left text-xs transition-colors ${
                      isSelected 
                        ? 'bg-red-100 text-red-900' 
                        : 'hover:bg-white text-gray-700'
                    }`}
                  >
                    <IconComponent className="h-3 w-3 mr-2" />
                    {type.name}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-end space-x-1 p-2 pt-0">
            <button
              onClick={() => handleExport('pdf', 'page', selectedPdfType)}
              disabled={exportDisabled}
              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Página
            </button>
            <button
              onClick={() => handleExport('pdf', 'all', selectedPdfType)}
              disabled={exportDisabled}
              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Todos
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-2 bg-gray-50 rounded">
            <div className="inline-flex items-center text-xs text-gray-600">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
              Exportando...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactExportMenu;
