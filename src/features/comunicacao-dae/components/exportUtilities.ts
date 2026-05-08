import * as XLSX from "xlsx";
import { ComunicacaoDae } from "@/services/ComunicacaoDaeService";
import {
  formatComunicacaoDaeAgravoCodigos,
  formatComunicacaoDaeAgravoNomes,
} from "@/features/comunicacao-dae/comunicacaoDaeAgravoUtils";
import { calcularSemanaEpidemiologica } from "@/utils/timezoneUtils";
import {
  exportarComunicacaoDaeDetalhadaPDF as exportarComunicacaoDaeDetalhadaPDFV2,
  exportarComunicacaoDaeDetalhadaWord as exportarComunicacaoDaeDetalhadaWordV2,
  exportarComunicacoesDaeListaPDF as exportarComunicacoesDaeListaPDFV2,
  exportarComunicacoesDaeListaWord as exportarComunicacoesDaeListaWordV2,
} from "./listDocumentExporters";

// ===================================================================
// INTERFACES E TIPOS
// ===================================================================

export interface ComunicacaoDaeExportData extends ComunicacaoDae {
  // Campos adicionais podem ser definidos aqui se necessário
}

// ===================================================================
// UTILITÁRIOS DE FORMATAÇÃO
// ===================================================================

/**
 * Formata data para exibição em DD/MM/YYYY HH:mm
 */
const formatarData = (dateString?: string | null): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      timeZone: "America/Belem",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "Data inválida";
  }
};

// ===================================================================
// EXPORTAÇÃO PARA CSV
// ===================================================================

/**
 * Exporta lista de comunicações DAE para CSV
 */
export const exportarComunicacoesDaeCSV = (
  comunicacoes: ComunicacaoDaeExportData[],
  nomeArquivo: string = "comunicacoes_dae"
): void => {
  try {
    // BOM para UTF-8 (suporta acentos)
    const BOM = '\uFEFF';
    
    // Cabeçalhos
    const headers = [
      'Nº Comunicação',
      'Data da Comunicação',
      'Semana Epidemiológica',
      'Nome do Paciente',
      'Origem',
      'Unidade Notificadora',
      'DAE',
      'Código DAE',
      'Município de Ocorrência',
      'Observação',
      'Qtd. Anexos',
      'Data de Criação',
      'Última Atualização'
    ];

    // Linhas de dados - usando ponto e vírgula como separador
    const rows = [
      headers.join(';'),
      ...comunicacoes.map(com => {
        const se = calcularSemanaEpidemiologica(com.data_comunicacao);
        const semanaStr = se ? `SE ${se.semana.toString().padStart(2, '0')}/${se.ano}` : '-';
        return [
          com.id_comunicacao,
          formatarData(com.data_comunicacao),
          semanaStr,
          `"${(com.nome_paciente || '').replace(/"/g, '""')}"`,
          com.origem_tipo,
          `"${((com.origem?.nome) || '-').replace(/"/g, '""')}"`,
          `"${formatComunicacaoDaeAgravoNomes(com).replace(/"/g, '""')}"`,
          `"${formatComunicacaoDaeAgravoCodigos(com).replace(/"/g, '""')}"`,
          `"${(com.tipo_municipio?.descricao || '-').replace(/"/g, '""')}"`,
          `"${(com.observacao_descricao || '-').replace(/"/g, '""')}"`,
          com.comunicacao_dae_anexo?.length || 0,
          formatarData(com.created_at),
          formatarData(com.updated_at)
        ].join(';');
      })
    ];
    
    // Juntar com BOM
    const csvContent = BOM + rows.join('\n');
    
    // Criar blob e fazer download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${nomeArquivo}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    console.log(`✅ CSV de Comunicações DAE exportado: ${nomeArquivo}`);
  } catch (error) {
    console.error('❌ Erro ao exportar CSV:', error);
    alert('Erro ao exportar para CSV. Verifique o console para mais detalhes.');
  }
};

// ===================================================================
// EXPORTAÇÃO PARA EXCEL
// ===================================================================

/**
 * Exporta lista de comunicações DAE para Excel (.xlsx)
 */
export const exportarComunicacoesDaeExcel = (
  comunicacoes: ComunicacaoDaeExportData[],
  nomeArquivo: string = "comunicacoes_dae"
): void => {
  try {
    // Preparar dados para Excel
    const worksheetData = [
      // Cabeçalhos
      [
        'Nº Comunicação',
        'Data da Comunicação',
        'Semana Epidemiológica',
        'Nome do Paciente',
        'Origem',
        'Unidade Notificadora',
        'DAE',
        'Código DAE',
        'Município de Ocorrência',
        'Observação',
        'Qtd. Anexos',
        'Data de Criação',
        'Última Atualização'
      ],
      // Dados
      ...comunicacoes.map(com => {
        const se = calcularSemanaEpidemiologica(com.data_comunicacao);
        const semanaStr = se ? `SE ${se.semana.toString().padStart(2, '0')}/${se.ano}` : '-';
        return [
          com.id_comunicacao,
          formatarData(com.data_comunicacao),
          semanaStr,
          com.nome_paciente,
          com.origem_tipo,
          com.origem?.nome || '-',
          formatComunicacaoDaeAgravoNomes(com),
          formatComunicacaoDaeAgravoCodigos(com),
          com.tipo_municipio?.descricao || '-',
          com.observacao_descricao || '-',
          com.comunicacao_dae_anexo?.length || 0,
          formatarData(com.created_at),
          formatarData(com.updated_at)
        ];
      })
    ];

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Configurar largura das colunas
    ws['!cols'] = [
      { wch: 15 }, // Nº Comunicação
      { wch: 18 }, // Data da Comunicação
      { wch: 22 }, // Semana Epidemiológica
      { wch: 30 }, // Nome do Paciente
      { wch: 10 }, // Origem
      { wch: 30 }, // Unidade Notificadora
      { wch: 35 }, // DAE
      { wch: 12 }, // Código DAE
      { wch: 30 }, // Município
      { wch: 50 }, // Observação
      { wch: 12 }, // Qtd. Anexos
      { wch: 18 }, // Data de Criação
      { wch: 18 }  // Última Atualização
    ];

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Comunicações DAE');

    // Salvar arquivo
    const fullFilename = `${nomeArquivo}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fullFilename);
    
    console.log(`✅ Excel de Comunicações DAE exportado: ${fullFilename}`);
  } catch (error) {
    console.error('❌ Erro ao exportar Excel:', error);
    alert('Erro ao exportar para Excel. Verifique se a biblioteca XLSX está instalada.');
  }
};

// ===================================================================
// EXPORTAÇÃO PARA PDF (LISTA)
// ===================================================================

/**
 * Exporta lista de comunicações DAE para PDF
 */
export const exportarComunicacoesDaePDF = async (
  comunicacoes: ComunicacaoDaeExportData[],
  nomeArquivo: string = "comunicacoes_dae"
): Promise<void> => {
  try {
    await exportarComunicacoesDaeListaPDFV2(comunicacoes, nomeArquivo);
  } catch (error) {
    console.error('❌ Erro ao exportar PDF:', error);
    throw error;
  }
};

/**
 * Exporta lista de comunicações DAE para Word
 */
export const exportarComunicacoesDaeWord = async (
  comunicacoes: ComunicacaoDaeExportData[],
  nomeArquivo: string = "comunicacoes_dae"
): Promise<void> => {
  try {
    await exportarComunicacoesDaeListaWordV2(comunicacoes, nomeArquivo);
  } catch (error) {
    console.error('❌ Erro ao exportar Word:', error);
    throw error;
  }
};

// ===================================================================
// EXPORTAÇÃO DETALHADA (PDF INDIVIDUAL)
// ===================================================================

/**
 * Exporta uma única comunicação DAE de forma detalhada em PDF
 */
export const exportarComunicacaoDaeDetalhada = async (
  comunicacao: ComunicacaoDaeExportData
): Promise<void> => {
  try {
    await exportarComunicacaoDaeDetalhadaPDFV2(comunicacao);
  } catch (error) {
    console.error('❌ Erro ao exportar PDF detalhado:', error);
    throw error;
  }
};

/**
 * Exporta uma única comunicação DAE de forma detalhada em Word
 */
export const exportarComunicacaoDaeDetalhadaWord = async (
  comunicacao: ComunicacaoDaeExportData
): Promise<void> => {
  try {
    await exportarComunicacaoDaeDetalhadaWordV2(comunicacao);
  } catch (error) {
    console.error('❌ Erro ao exportar Word detalhado:', error);
    throw error;
  }
};

// ===================================================================
// EXPORTAÇÕES
// ===================================================================

export default {
  exportarComunicacoesDaeCSV,
  exportarComunicacoesDaeExcel,
  exportarComunicacoesDaePDF,
  exportarComunicacoesDaeWord,
  exportarComunicacaoDaeDetalhada,
  exportarComunicacaoDaeDetalhadaWord,
};
