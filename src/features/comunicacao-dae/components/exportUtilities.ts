import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { ComunicacaoDae } from "@/services/ComunicacaoDaeService";

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

/**
 * Formata data apenas (sem hora) em DD/MM/YYYY
 */
const formatarDataSemHora = (dateString?: string | null): string => {
  if (!dateString) return "";

  try {
    const dateOnly = dateString.split("T")[0];
    const [year, month, day] = dateOnly.split("-");
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "Data inválida";
  }
};

/**
 * Retorna a cor/badge para o tipo de origem
 */
const getOrigemColor = (tipo: string): string => {
  switch (tipo) {
    case 'CRS': return '#2563eb'; // blue-600
    case 'NHE': return '#22c55e'; // green-600
    case 'CIEVS': return '#a855f7'; // purple-600
    default: return '#6b7280'; // gray-500
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
      'Nome do Paciente',
      'Origem',
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
      ...comunicacoes.map(com => [
        com.id_comunicacao,
        formatarData(com.data_comunicacao),
        `"${(com.nome_paciente || '').replace(/"/g, '""')}"`,
        com.origem_tipo,
        `"${(com.dae?.nome || '-').replace(/"/g, '""')}"`,
        com.dae?.codigo || '-',
        `"${(com.tipo_municipio?.descricao || '-').replace(/"/g, '""')}"`,
        `"${(com.observacao_descricao || '-').replace(/"/g, '""')}"`,
        com.comunicacao_dae_anexo?.length || 0,
        formatarData(com.created_at),
        formatarData(com.updated_at)
      ].join(';'))
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
        'Nome do Paciente',
        'Origem',
        'DAE',
        'Código DAE',
        'Município de Ocorrência',
        'Observação',
        'Qtd. Anexos',
        'Data de Criação',
        'Última Atualização'
      ],
      // Dados
      ...comunicacoes.map(com => [
        com.id_comunicacao,
        formatarData(com.data_comunicacao),
        com.nome_paciente,
        com.origem_tipo,
        com.dae?.nome || '-',
        com.dae?.codigo || '-',
        com.tipo_municipio?.descricao || '-',
        com.observacao_descricao || '-',
        com.comunicacao_dae_anexo?.length || 0,
        formatarData(com.created_at),
        formatarData(com.updated_at)
      ])
    ];

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Configurar largura das colunas
    ws['!cols'] = [
      { wch: 15 }, // Nº Comunicação
      { wch: 18 }, // Data da Comunicação
      { wch: 30 }, // Nome do Paciente
      { wch: 10 }, // Origem
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
export const exportarComunicacoesDaePDF = (
  comunicacoes: ComunicacaoDaeExportData[],
  nomeArquivo: string = "comunicacoes_dae"
): void => {
  try {
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape (paisagem)
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // ===== CABEÇALHO =====
    pdf.setFillColor(37, 99, 235); // blue-600
    pdf.rect(0, 0, pageWidth, 30, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMUNICAÇÃO DE DOENÇAS, AGRAVOS E EVENTOS (DAE)', pageWidth / 2, 13, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, 21);
    pdf.text(`Total de Comunicações: ${comunicacoes.length}`, pageWidth - margin - 60, 21);

    yPosition = 38;

    // ===== FUNÇÃO PARA ADICIONAR NOVA PÁGINA =====
    const checkAddPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
    };

    // ===== RENDERIZAR CADA COMUNICAÇÃO =====
    comunicacoes.forEach((com) => {
      checkAddPage(42);

      // Box da comunicação
      pdf.setDrawColor(229, 231, 235); // gray-200
      pdf.setFillColor(249, 250, 251); // gray-50
      pdf.roundedRect(margin, yPosition, pageWidth - (2 * margin), 38, 2, 2, 'FD');

      // Conteúdo
      pdf.setTextColor(0, 0, 0);
      
      // Linha 1 - Título
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`#${com.id_comunicacao} - ${com.nome_paciente}`, margin + 5, yPosition + 7);

      // Linha 2 - Informações principais
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      const col1X = margin + 5;
      const col2X = margin + 100;
      const col3X = margin + 190;
      let lineY = yPosition + 15;

      // Data
      pdf.setFont('helvetica', 'bold');
      pdf.text('Data:', col1X, lineY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(formatarData(com.data_comunicacao), col1X + 15, lineY);

      // Origem com cor
      pdf.setFont('helvetica', 'bold');
      pdf.text('Origem:', col2X, lineY);
      const origemColor = getOrigemColor(com.origem_tipo);
      const origemRGB = [
        parseInt(origemColor.slice(1, 3), 16),
        parseInt(origemColor.slice(3, 5), 16),
        parseInt(origemColor.slice(5, 7), 16)
      ];
      pdf.setTextColor(origemRGB[0], origemRGB[1], origemRGB[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(com.origem_tipo, col2X + 20, lineY);
      pdf.setTextColor(0, 0, 0);

      // Anexos
      pdf.setFont('helvetica', 'bold');
      pdf.text('Anexos:', col3X, lineY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${com.comunicacao_dae_anexo?.length || 0}`, col3X + 20, lineY);

      lineY += 7;

      // DAE
      pdf.setFont('helvetica', 'bold');
      pdf.text('DAE:', col1X, lineY);
      pdf.setFont('helvetica', 'normal');
      const daeText = pdf.splitTextToSize(com.dae?.nome || '-', 75);
      pdf.text(daeText, col1X + 15, lineY);

      // Município
      pdf.setFont('helvetica', 'bold');
      pdf.text('Município:', col2X, lineY);
      pdf.setFont('helvetica', 'normal');
      const munText = pdf.splitTextToSize(com.tipo_municipio?.descricao || '-', 75);
      pdf.text(munText, col2X + 25, lineY);

      lineY += 7;

      // Observação (se houver)
      if (com.observacao_descricao) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Obs:', col1X, lineY);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        const obsText = pdf.splitTextToSize(com.observacao_descricao, pageWidth - (2 * margin) - 25);
        pdf.text(obsText.slice(0, 2), col1X + 12, lineY); // Limitar a 2 linhas
        pdf.setFontSize(9);
      }

      yPosition += 41;
    });

    // ===== RODAPÉ EM TODAS AS PÁGINAS =====
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Página ${i} de ${pageCount}`,
        margin,
        pageHeight - 8
      );
      pdf.text(
        'App Saúde Pará - Sistema de Comunicação DAE',
        pageWidth - margin - 80,
        pageHeight - 8
      );
    }

    // Salvar PDF
    pdf.save(`${nomeArquivo}_${new Date().toISOString().slice(0, 10)}.pdf`);
    console.log(`✅ PDF de Comunicações DAE exportado: ${nomeArquivo}`);
  } catch (error) {
    console.error('❌ Erro ao exportar PDF:', error);
    alert('Erro ao exportar para PDF. Verifique o console para mais detalhes.');
  }
};

// ===================================================================
// EXPORTAÇÃO DETALHADA (PDF INDIVIDUAL)
// ===================================================================

/**
 * Exporta uma única comunicação DAE de forma detalhada em PDF
 */
export const exportarComunicacaoDaeDetalhada = (
  comunicacao: ComunicacaoDaeExportData
): void => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait (retrato)
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // ===== CABEÇALHO =====
    pdf.setFillColor(37, 99, 235); // blue-600
    pdf.rect(0, 0, pageWidth, 45, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMUNICAÇÃO DAE', pageWidth / 2, 15, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text('Doenças, Agravos e Eventos de Saúde Pública', pageWidth / 2, 25, { align: 'center' });
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Comunicação Nº ${comunicacao.id_comunicacao}`, pageWidth / 2, 35, { align: 'center' });

    yPosition = 55;

    // ===== FUNÇÃO AUXILIAR PARA ADICIONAR CAMPO =====
    const addField = (label: string, value: string, bold: boolean = false) => {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, margin, yPosition);
      
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      const textWidth = pdf.getTextWidth(label);
      const valueText = pdf.splitTextToSize(value, pageWidth - margin * 2 - textWidth - 5);
      pdf.text(valueText, margin + textWidth + 3, yPosition);
      yPosition += Math.max(7, valueText.length * 6);
    };

    const addSection = (title: string) => {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(37, 99, 235);
      pdf.text(title, margin, yPosition);
      yPosition += 8;

      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;
      
      pdf.setTextColor(0, 0, 0);
    };

    // ===== SEÇÃO: IDENTIFICAÇÃO =====
    addSection('IDENTIFICAÇÃO');
    addField('Nome do Paciente:', comunicacao.nome_paciente, true);
    addField('Data da Comunicação:', formatarData(comunicacao.data_comunicacao));
    yPosition += 3;

    // ===== SEÇÃO: ORIGEM E LOCALIZAÇÃO =====
    addSection('ORIGEM E LOCALIZAÇÃO');
    addField('Tipo de Origem:', comunicacao.origem_tipo);
    addField('Código da Origem:', comunicacao.origem_id?.toString() || '-');
    addField('DAE:', comunicacao.dae?.nome || '-');
    addField('Código DAE:', comunicacao.dae?.codigo || '-');
    addField('Município de Ocorrência:', comunicacao.tipo_municipio?.descricao || '-');
    yPosition += 3;

    // ===== SEÇÃO: OBSERVAÇÕES =====
    if (comunicacao.observacao_descricao) {
      addSection('OBSERVAÇÕES');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const obsText = pdf.splitTextToSize(comunicacao.observacao_descricao, pageWidth - (2 * margin));
      pdf.text(obsText, margin, yPosition);
      yPosition += (obsText.length * 6) + 8;
    }

    // ===== SEÇÃO: ANEXOS =====
    if (comunicacao.comunicacao_dae_anexo && comunicacao.comunicacao_dae_anexo.length > 0) {
      addSection('ANEXOS');
      comunicacao.comunicacao_dae_anexo.forEach((anexo, idx) => {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${idx + 1}.`, margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(anexo.nome_arquivo_original || 'Sem nome', margin + 7, yPosition);
        
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(8);
        pdf.text(`Tipo: ${anexo.tipo_anexo || '-'} | Tamanho: ${(anexo.tamanho_bytes / 1024).toFixed(2)} KB`, margin + 10, yPosition + 4);
        yPosition += 10;
      });
      yPosition += 3;
    }

    // ===== SEÇÃO: DADOS DE AUDITORIA =====
    addSection('DADOS DE AUDITORIA');
    addField('Data de Criação:', formatarData(comunicacao.created_at));
    addField('Última Atualização:', formatarData(comunicacao.updated_at));

    // ===== RODAPÉ =====
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Documento gerado em ${new Date().toLocaleString('pt-BR')}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Salvar PDF
    pdf.save(`comunicacao_dae_${comunicacao.id_comunicacao}_detalhada.pdf`);
    console.log(`✅ PDF detalhado da Comunicação DAE #${comunicacao.id_comunicacao} exportado`);
  } catch (error) {
    console.error('❌ Erro ao exportar PDF detalhado:', error);
    alert('Erro ao exportar PDF detalhado. Verifique o console para mais detalhes.');
  }
};

// ===================================================================
// EXPORTAÇÕES
// ===================================================================

export default {
  exportarComunicacoesDaeCSV,
  exportarComunicacoesDaeExcel,
  exportarComunicacoesDaePDF,
  exportarComunicacaoDaeDetalhada,
};
