import React, { useState, useRef, useEffect } from 'react';
import { FileText, FileSpreadsheet, FileMinus, FileDown, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';

// Augment jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
  }
}

// Campos a serem ignorados na exportação
const EXCLUDED_FIELDS = [
  'id',
  'tipoEstabelecimentoId',
  'tipoNaturezaId',
  'tipoTurnoId',
  'tipo_estabelecimento_idtipo_estabelecimento',
  'tipo_natureza_idtipo_natureza',
  'tipo_turno_idtipo_turno'
];

// Mapeamento de campos para nomes amigáveis
const FIELD_LABELS: Record<string, string> = {
  codigo_unidade: "Código da Unidade",
  nome: "Nome do Estabelecimento",
  cnes: "CNES",
  cnpj: "CNPJ",
  cidade: "Cidade",
  logradouro: "Logradouro",
  bairro: "Bairro",
  numero: "Número",
  latitude: "Latitude",
  longitude: "Longitude",
  ativo: "Status",
  tipo_estabelecimento_descricao: "Tipo de Estabelecimento",
  tipo_natureza_descricao: "Natureza",
  tipo_turno_descricao: "Turno de Atendimento",
  habilitacoes_selecionadas: "Habilitações",
  qualificacoes: "Qualificações"
};

interface ExportButtonsProps {
  data: any;
  fileName: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ data, fileName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formata os dados para exportação
  const formatData = () => {
    const formattedData: Record<string, any> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      // Pula campos excluídos, internos ou vazios
      if (EXCLUDED_FIELDS.includes(key) || 
          key.startsWith('_') || 
          value === null || 
          value === undefined || 
          value === '') {
        return;
      }

      // Formata o valor de acordo com o tipo
      let formattedValue = value;
      if (key === 'ativo') {
        formattedValue = value === 'S' ? 'Ativo' : 'Inativo';
      }
      // Formata arrays de habilitações/qualificações
      else if (key === 'habilitacoes_selecionadas' || key === 'qualificacoes') {
        if (Array.isArray(value)) {
          formattedValue = value.map(item => item.descricao).join(', ');
        }
      }

      // Usa o label amigável ou o nome original do campo
      const label = FIELD_LABELS[key] || key;
      formattedData[label] = formattedValue;
    });

    return formattedData;
  };

  const exportToWord = () => {
    const formattedData = formatData();
    let html = `
      <html>
        <head>
          <meta charset='utf-8'>
          <style>
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 8px; border: 1px solid #ddd; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>${data.nome || 'Estabelecimento'}</h1>
          <table>
            <tbody>
              ${Object.entries(formattedData)
                .map(([key, value]) => `
                  <tr>
                    <th>${key}</th>
                    <td>${value}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const formattedData = formatData();
    const ws = XLSX.utils.json_to_sheet([formattedData], {
      header: Object.keys(formattedData)
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estabelecimento");

    // Ajusta largura das colunas
    const colWidths = Object.keys(formattedData).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const exportToCSV = () => {
    const formattedData = formatData();
    const headers = Object.keys(formattedData);
    const values = Object.values(formattedData);
    
    const csv = [
      headers.join(';'),
      values.join(';')
    ].join('\n');

    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const formattedData = formatData();
    const doc = new jsPDF();

    // Título
    doc.setFontSize(16);
    doc.text(data.nome || 'Estabelecimento', 14, 15);
    
    // Tabela
    doc.autoTable({
      startY: 25,
      head: [['Campo', 'Valor']],
      body: Object.entries(formattedData).map(([key, value]) => [key, String(value)]),
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    doc.save(`${fileName}.pdf`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
      >
        <Download className="h-4 w-4" />
        <span>Exportar</span>
      </button>

      {/* Menu dropdown com animação */}
      <div
        className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden transition-all duration-200 ease-out ${
          isOpen 
            ? 'transform translate-y-0 opacity-100 visible'
            : 'transform -translate-y-2 opacity-0 invisible'
        }`}
      >
        <div className="py-1">
          <button
            type="button"
            onClick={() => { exportToWord(); setIsOpen(false); }}
            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Exportar para Word
          </button>
          <button
            type="button"
            onClick={() => { exportToExcel(); setIsOpen(false); }}
            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar para Excel
          </button>
          <button
            type="button"
            onClick={() => { exportToCSV(); setIsOpen(false); }}
            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 flex items-center gap-2"
          >
            <FileMinus className="h-4 w-4" />
            Exportar para CSV
          </button>
          <button
            type="button"
            onClick={() => { exportToPDF(); setIsOpen(false); }}
            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Exportar para PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportButtons;
