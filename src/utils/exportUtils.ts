// Utilitários de Exportação - Sistema Completo
// Suporte para PNG, PDF, Word, Excel e CSV

import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Interface para dados de gráfico
interface ChartDataItem {
  name: string;
  value: number;
  fill?: string;
  isAlarmante?: boolean;
  original?: any;
}

// Interface para dados de dashboard completo
interface DashboardData {
  title: string;
  sections: {
    name: string;
    data: ChartDataItem[];
  }[];
  metadata?: {
    totalRecords: number;
    dateGenerated: string;
    filters?: Record<string, any>;
  };
}

// 📊 EXPORTAÇÃO PARA EXCEL
export const exportChartAsExcel = (data: ChartDataItem[], title: string): void => {
  try {
    // Criar dados para a planilha
    const worksheetData = [
      ['Categoria', 'Valor', 'Cor', 'Alarmante'], // Cabeçalhos
      ...data.map(item => [
        item.name,
        item.value,
        item.fill || '',
        item.isAlarmante ? 'Sim' : 'Não'
      ])
    ];

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Configurar largura das colunas
    ws['!cols'] = [
      { wch: 30 }, // Categoria
      { wch: 10 }, // Valor
      { wch: 15 }, // Cor
      { wch: 12 }  // Alarmante
    ];

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');

    // Salvar arquivo
    const filename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    console.log(`✅ Excel exportado: ${filename}`);
  } catch (error) {
    console.error('❌ Erro ao exportar Excel:', error);
    alert('Erro ao exportar Excel. Verifique se a biblioteca XLSX está instalada.');
  }
};

// 📄 EXPORTAÇÃO PARA CSV
export const exportChartAsCSV = (data: ChartDataItem[], title: string): void => {
  try {
    // Criar cabeçalhos com BOM para UTF-8
    const BOM = '\uFEFF';
    const headers = ['Categoria', 'Valor', 'Cor', 'Alarmante'];
    
    // Criar linhas de dados
    const rows = [
      headers.join(','),
      ...data.map(item => [
        `"${item.name.replace(/"/g, '""')}"`, // Escapar aspas duplas
        item.value,
        `"${item.fill || ''}"`,
        item.isAlarmante ? 'Sim' : 'Não'
      ].join(','))
    ];
    
    // Juntar tudo com BOM para suporte a caracteres especiais
    const csvContent = BOM + rows.join('\n');
    
    // Criar blob e download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    console.log(`✅ CSV exportado: ${link.download}`);
  } catch (error) {
    console.error('❌ Erro ao exportar CSV:', error);
    alert('Erro ao exportar CSV');
  }
};

// 🖼️ EXPORTAÇÃO PARA PNG
export const exportChartAsPNG = async (chartId: string, title: string): Promise<void> => {
  try {
    const element = document.getElementById(chartId);
    if (!element) {
      alert('Elemento do gráfico não encontrado!');
      return;
    }

    // Usar html2canvas para capturar o elemento
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Melhor qualidade
      useCORS: true,
      allowTaint: true
    });

    // Criar link para download
    const link = document.createElement('a');
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`✅ PNG exportado: ${link.download}`);
  } catch (error) {
    console.error('❌ Erro ao exportar PNG:', error);
    alert('Erro ao exportar PNG. Verifique se a biblioteca html2canvas está instalada.');
  }
};

// 📄 EXPORTAÇÃO PARA PDF
export const exportChartAsPDF = async (chartId: string, title: string): Promise<void> => {
  try {
    const element = document.getElementById(chartId);
    if (!element) {
      alert('Elemento do gráfico não encontrado!');
      return;
    }

    // Capturar elemento como imagem
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    // Criar PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    
    // Calcular dimensões mantendo proporção
    const imgWidth = 190; // Largura máxima em mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Adicionar título
    pdf.setFontSize(16);
    pdf.text(title, 20, 20);
    
    // Adicionar imagem
    pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);
    
    // Adicionar rodapé com data
    pdf.setFontSize(8);
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, pdf.internal.pageSize.height - 10);
    
    // Salvar
    const filename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
    
    console.log(`✅ PDF exportado: ${filename}`);
  } catch (error) {
    console.error('❌ Erro ao exportar PDF:', error);
    alert('Erro ao exportar PDF. Verifique se as biblioturas jsPDF e html2canvas estão instaladas.');
  }
};

// 📝 EXPORTAÇÃO PARA WORD
export const exportChartAsWord = async (chartId: string, data: ChartDataItem[], title: string): Promise<void> => {
  try {
    const element = document.getElementById(chartId);
    if (!element) {
      alert('Elemento do gráfico não encontrado!');
      return;
    }

    // Capturar gráfico como imagem
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    const imgData = canvas.toDataURL('image/png');

    // Criar conteúdo HTML para Word
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>90</w:Zoom>
              <w:DoNotPromptForConvert/>
              <w:DoNotShowRevisions/>
              <w:DoNotPrintRevisions/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .metadata { margin-top: 30px; font-size: 12px; color: #666; }
            .chart-image { margin: 20px 0; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          
          <div class="chart-image">
            <img src="${imgData}" alt="Gráfico ${title}" style="max-width: 100%; height: auto;">
          </div>
          
          <h2>Dados Detalhados</h2>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Percentual</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => {
                const total = data.reduce((sum, d) => sum + d.value, 0);
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                return `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.value}</td>
                    <td>${percentage}%</td>
                    <td>${item.isAlarmante ? '⚠️ Alarmante' : '✅ Normal'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="metadata">
            <p><strong>Total de registros:</strong> ${data.reduce((sum, item) => sum + item.value, 0)}</p>
            <p><strong>Documento gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Sistema:</strong> Sistema de Saúde Pará - Comunicação de Eventos</p>
          </div>
        </body>
      </html>
    `;

    // Criar blob e download
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    console.log(`✅ Word exportado: ${link.download}`);
  } catch (error) {
    console.error('❌ Erro ao exportar Word:', error);
    alert('Erro ao exportar Word. Verifique se a biblioteca html2canvas está instalada.');
  }
};

// 📋 EXPORTAÇÃO DO DASHBOARD COMPLETO
export const exportFullDashboard = async (dashboardData: DashboardData, format: 'excel' | 'csv' | 'pdf' | 'word'): Promise<void> => {
  try {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Dashboard_Completo_${timestamp}`;
    
    switch (format) {
      case 'excel':
        await exportDashboardAsExcel(dashboardData, filename);
        break;
      case 'csv':
        await exportDashboardAsCSV(dashboardData, filename);
        break;
      case 'pdf':
        await exportDashboardAsPDF(dashboardData, filename);
        break;
      case 'word':
        await exportDashboardAsWord(dashboardData, filename);
        break;
      default:
        throw new Error('Formato não suportado');
    }
  } catch (error) {
    console.error('❌ Erro ao exportar dashboard completo:', error);
    alert(`Erro ao exportar dashboard em formato ${format.toUpperCase()}`);
  }
};

// Funções auxiliares para exportação completa do dashboard
const exportDashboardAsExcel = async (data: DashboardData, filename: string): Promise<void> => {
  const wb = XLSX.utils.book_new();
  
  // Aba de resumo
  const summaryData = [
    ['Comunicação de Eventos - Resumo Executivo'],
    [''],
    ['Total de Registros:', data.metadata?.totalRecords || 0],
    ['Data de Geração:', data.metadata?.dateGenerated || new Date().toLocaleString('pt-BR')],
    [''],
    ['Seções do Dashboard:'],
    ...data.sections.map(section => [
      section.name,
      section.data.reduce((sum, item) => sum + item.value, 0)
    ])
  ];
  
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo');
  
  // Uma aba para cada seção
  data.sections.forEach(section => {
    const sectionData = [
      ['Categoria', 'Valor', 'Percentual', 'Status'],
      ...section.data.map(item => {
        const total = section.data.reduce((sum, d) => sum + d.value, 0);
        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
        return [
          item.name,
          item.value,
          `${percentage}%`,
          item.isAlarmante ? 'Alarmante' : 'Normal'
        ];
      })
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(sectionData);
    const sheetName = section.name.replace(/[^\w\s]/gi, '').substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });
  
  XLSX.writeFile(wb, `${filename}.xlsx`);
  console.log(`✅ Dashboard Excel exportado: ${filename}.xlsx`);
};

const exportDashboardAsCSV = async (data: DashboardData, filename: string): Promise<void> => {
  const BOM = '\uFEFF';
  let csvContent = BOM;
  
  // Cabeçalho do dashboard
  csvContent += `"Comunicação de Eventos - Dados Completos"\n`;
  csvContent += `"Total de Registros:","${data.metadata?.totalRecords || 0}"\n`;
  csvContent += `"Data de Geração:","${data.metadata?.dateGenerated || new Date().toLocaleString('pt-BR')}"\n\n`;
  
  // Dados de cada seção
  data.sections.forEach(section => {
    csvContent += `"${section.name}"\n`;
    csvContent += `"Categoria","Valor","Percentual","Status"\n`;
    
    const total = section.data.reduce((sum, item) => sum + item.value, 0);
    
    section.data.forEach(item => {
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
      csvContent += `"${item.name.replace(/"/g, '""')}","${item.value}","${percentage}%","${item.isAlarmante ? 'Alarmante' : 'Normal'}"\n`;
    });
    
    csvContent += `\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  
  console.log(`✅ Dashboard CSV exportado: ${filename}.csv`);
};

const exportDashboardAsPDF = async (data: DashboardData, filename: string): Promise<void> => {
  // Esta função capturaria toda a tela do dashboard
  const dashboardElement = document.querySelector('[data-dashboard="main"]') as HTMLElement;
  
  if (!dashboardElement) {
    alert('Elemento principal do dashboard não encontrado!');
    return;
  }

  const canvas = await html2canvas(dashboardElement, {
    backgroundColor: '#ffffff',
    scale: 1.5,
    useCORS: true,
    allowTaint: true,
    width: dashboardElement.scrollWidth,
    height: dashboardElement.scrollHeight
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Calcular dimensões
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  // Se a imagem for maior que uma página, dividir
  let heightLeft = imgHeight;
  let position = 20;
  
  // Primeira página
  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight - 40;
  
  // Páginas adicionais se necessário
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight + 20;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight - 40;
  }
  
  pdf.save(`${filename}.pdf`);
  console.log(`✅ Dashboard PDF exportado: ${filename}.pdf`);
};

const exportDashboardAsWord = async (data: DashboardData, filename: string): Promise<void> => {
  // Capturar dashboard inteiro
  const dashboardElement = document.querySelector('[data-dashboard="main"]') as HTMLElement;
  
  if (!dashboardElement) {
    alert('Elemento principal do dashboard não encontrado!');
    return;
  }

  const canvas = await html2canvas(dashboardElement, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    allowTaint: true
  });

  const imgData = canvas.toDataURL('image/png');

  // HTML completo para Word
  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
      <head>
        <meta charset="UTF-8">
        <title>${data.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; border-bottom: 3px solid #007acc; padding-bottom: 15px; }
          h2 { color: #555; margin-top: 30px; }
          .dashboard-image { margin: 20px 0; text-align: center; }
          table { border-collapse: collapse; width: 100%; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; }
          .summary { background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>${data.title}</h1>
        
        <div class="summary">
          <h2>Resumo Executivo</h2>
          <p><strong>Total de Registros:</strong> ${data.metadata?.totalRecords || 0}</p>
          <p><strong>Data de Geração:</strong> ${data.metadata?.dateGenerated || new Date().toLocaleString('pt-BR')}</p>
        </div>
        
        <div class="dashboard-image">
          <img src="${imgData}" alt="Dashboard Completo" style="max-width: 100%; height: auto;">
        </div>
        
        ${data.sections.map(section => {
          const total = section.data.reduce((sum, item) => sum + item.value, 0);
          return `
            <h2>${section.name}</h2>
            <table>
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Valor</th>
                  <th>Percentual</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${section.data.map(item => {
                  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                  return `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.value}</td>
                      <td>${percentage}%</td>
                      <td>${item.isAlarmante ? '⚠️ Alarmante' : '✅ Normal'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `;
        }).join('')}
        
        <div style="margin-top: 40px; font-size: 12px; color: #666; text-align: center;">
          <p>Documento gerado automaticamente pelo Sistema de Saúde Pará</p>
          <p>Comunicação de Eventos - ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  
  console.log(`✅ Dashboard Word exportado: ${filename}.doc`);
};

// 🎯 FUNÇÃO UTILITÁRIA PARA PREPARAR DADOS DO DASHBOARD
export const prepareDashboardData = (
  paisData: ChartDataItem[],
  estadoData: ChartDataItem[],
  municipioData: ChartDataItem[],
  bairroData: ChartDataItem[],
  totalRecords: number,
  filters?: Record<string, any>
): DashboardData => {
  return {
    title: 'Dashboard de Localização Geográfica',
    sections: [
      { name: 'Países de Residência', data: paisData },
      { name: 'Estados/UF de Residência', data: estadoData },
      { name: 'Municípios de Residência', data: municipioData },
      { name: 'Bairros de Residência', data: bairroData }
    ],
    metadata: {
      totalRecords,
      dateGenerated: new Date().toLocaleString('pt-BR'),
      filters
    }
  };
};

export default {
  exportChartAsExcel,
  exportChartAsCSV,
  exportChartAsPNG,
  exportChartAsPDF,
  exportChartAsWord,
  exportFullDashboard,
  prepareDashboardData
};
