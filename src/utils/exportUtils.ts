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
    
    // Criar linhas de dados - USANDO PONTO E VÍRGULA como separador
    const rows = [
      headers.join(';'),
      ...data.map(item => [
        `"${item.name.replace(/"/g, '""')}"`, // Escapar aspas duplas
        item.value,
        `"${item.fill || ''}"`,
        item.isAlarmante ? 'Sim' : 'Não'
      ].join(';'))
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
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="metadata">
            <p><strong>Total de registros:</strong> ${data.reduce((sum, item) => sum + item.value, 0)}</p>
            <p><strong>Documento gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Sistema:</strong> App Saúde Pará - Comunicação de Eventos</p>
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
  
  // Aba de resumo executivo
  const summaryData = [
    ['COMUNICAÇÃO DE EVENTOS - RESUMO EXECUTIVO'],
    [''],
    ['Total de Registros:', data.metadata?.totalRecords || 0],
    ['Data de Geração:', data.metadata?.dateGenerated || new Date().toLocaleString('pt-BR')],
    ['Total de Seções:', data.sections.length],
    [''],
    ['RESUMO POR SEÇÃO'],
    ['Seção', 'Total de Categorias', 'Total de Registros'],
    ...data.sections.map(section => [
      section.name,
      section.data.length,
      section.data.reduce((sum, item) => sum + item.value, 0)
    ])
  ];
  
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Configurar largura das colunas do resumo
  summaryWs['!cols'] = [
    { wch: 40 }, // Coluna de texto
    { wch: 20 }, // Coluna de valores
    { wch: 20 }  // Coluna adicional
  ];
  
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo Executivo');
  
  // Criar uma aba detalhada para cada seção
  data.sections.forEach(section => {
    const total = section.data.reduce((sum, item) => sum + item.value, 0);
    
    // Cabeçalho da aba
    const sectionData = [
      [section.name],
      [''],
      ['Categoria', 'Quantidade', 'Percentual', 'Participação'],
      ...section.data.map(item => {
        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(2) : '0';
        return [
          item.name,
          item.value,
          `${percentage}%`,
          percentage
        ];
      }),
      [''], // Linha em branco
      ['TOTAL', total, '100%', 100]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(sectionData);
    
    // Configurar largura das colunas
    ws['!cols'] = [
      { wch: 50 }, // Categoria
      { wch: 15 }, // Quantidade
      { wch: 15 }, // Percentual
      { wch: 15 }  // Participação
    ];
    
    // Nome da aba (limitado a 31 caracteres e sem caracteres especiais)
    const sheetName = section.name
      .replace(/[^\w\s]/gi, '')
      .substring(0, 31)
      .trim();
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Dados');
  });
  
  // Aba consolidada com todos os dados
  const consolidatedData: any[] = [
    ['DADOS CONSOLIDADOS - TODAS AS SEÇÕES'],
    [''],
    ['Seção', 'Categoria', 'Quantidade', 'Percentual da Seção']
  ];
  
  data.sections.forEach(section => {
    const total = section.data.reduce((sum, item) => sum + item.value, 0);
    
    section.data.forEach(item => {
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(2) : '0';
      consolidatedData.push([
        section.name,
        item.name,
        item.value,
        `${percentage}%`
      ]);
    });
    
    // Linha de subtotal
    consolidatedData.push([
      `SUBTOTAL - ${section.name}`,
      '',
      total,
      '100%'
    ]);
    consolidatedData.push(['', '', '', '']); // Linha em branco
  });
  
  const consolidatedWs = XLSX.utils.aoa_to_sheet(consolidatedData);
  consolidatedWs['!cols'] = [
    { wch: 40 }, // Seção
    { wch: 50 }, // Categoria
    { wch: 15 }, // Quantidade
    { wch: 15 }  // Percentual
  ];
  
  XLSX.utils.book_append_sheet(wb, consolidatedWs, 'Dados Consolidados');
  
  XLSX.writeFile(wb, `${filename}.xlsx`);
  console.log(`✅ Dashboard Excel exportado: ${filename}.xlsx`);
};

const exportDashboardAsCSV = async (data: DashboardData, filename: string): Promise<void> => {
  const BOM = '\uFEFF';
  let csvContent = BOM;
  
  // Cabeçalho do dashboard
  csvContent += `"COMUNICAÇÃO DE EVENTOS - DADOS COMPLETOS"\n`;
  csvContent += `"Total de Registros";"${data.metadata?.totalRecords || 0}"\n`;
  csvContent += `"Data de Geração";"${data.metadata?.dateGenerated || new Date().toLocaleString('pt-BR')}"\n\n`;
  
  // Dados de cada seção
  data.sections.forEach(section => {
    csvContent += `"${section.name}"\n`;
    csvContent += `"Categoria";"Valor";"Percentual"\n`;
    
    const total = section.data.reduce((sum, item) => sum + item.value, 0);
    
    section.data.forEach(item => {
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(2) : '0';
      csvContent += `"${item.name.replace(/"/g, '""')}";"${item.value}";"${percentage}%"\n`;
    });
    
    // Linha de total
    csvContent += `"TOTAL";"${total}";"100%"\n`;
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
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;
  
  // Função auxiliar para adicionar nova página se necessário
  const checkAddPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };
  
  // Cabeçalho do documento
  pdf.setFontSize(18);
  pdf.setTextColor(0, 122, 204); // Azul
  pdf.text('Comunicação de Eventos', margin, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(14);
  pdf.setTextColor(80, 80, 80);
  pdf.text('Dashboard Completo', margin, yPosition);
  yPosition += 12;
  
  // Informações do resumo
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Total de Registros: ${data.metadata?.totalRecords || 0}`, margin, yPosition);
  yPosition += 6;
  pdf.text(`Data de Geração: ${data.metadata?.dateGenerated || new Date().toLocaleString('pt-BR')}`, margin, yPosition);
  yPosition += 12;
  
  // Linha separadora
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  // 🖼️ CAPTURAR IMAGEM DO DASHBOARD (se disponível)
  const dashboardElement = document.querySelector('[data-dashboard="main"]') as HTMLElement;
  
  if (dashboardElement) {
    try {
      // 🚫 FECHAR TODOS OS DROPDOWNS E MENUS ANTES DE CAPTURAR
      // Clicar em um elemento neutro para fechar dropdowns
      const bodyElement = document.body;
      bodyElement.click();
      
      // Aguardar um momento para que os menus fechem
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Esconder temporariamente elementos que não devem aparecer na captura
      const elementsToHide = dashboardElement.querySelectorAll('[data-export-menu], .export-menu, [role="menu"]');
      const originalDisplays: string[] = [];
      
      elementsToHide.forEach((el) => {
        const htmlEl = el as HTMLElement;
        originalDisplays.push(htmlEl.style.display);
        htmlEl.style.display = 'none';
      });
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Visualização do Dashboard', margin, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      
      // Capturar a imagem do dashboard com melhor qualidade e sem cortes
      // Usar scale 1.5 para equilibrar qualidade e tamanho
      const canvas = await html2canvas(dashboardElement, {
        backgroundColor: '#ffffff',
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: dashboardElement.scrollWidth,
        height: dashboardElement.scrollHeight,
        windowWidth: dashboardElement.scrollWidth,
        windowHeight: dashboardElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0
      });
      
      // Restaurar elementos escondidos
      elementsToHide.forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.display = originalDisplays[index];
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Calcular dimensões mantendo proporção
      const imgWidth = pageWidth - (2 * margin);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Sempre adicionar em nova página para o dashboard visual
      pdf.addPage();
      yPosition = margin;
      
      // Adicionar título na página do dashboard visual
      pdf.setFontSize(14);
      pdf.setTextColor(0, 122, 204);
      pdf.text('Dashboard Visual', margin, yPosition);
      yPosition += 10;
      
      // Se a imagem couber em uma página, renderizar completa
      if (imgHeight <= pageHeight - yPosition - margin) {
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      } else {
        // Imagem muito grande - dividir em múltiplas páginas de forma correta
        let currentSourceY = 0;
        const availableHeight = pageHeight - yPosition - margin;
        
        // Calcular quantos pixels do canvas cabem na primeira página
        let canvasHeightForFirstPage = (availableHeight * canvas.width) / imgWidth;
        
        // Primeira página
        const firstPageCanvas = document.createElement('canvas');
        firstPageCanvas.width = canvas.width;
        firstPageCanvas.height = Math.min(canvasHeightForFirstPage, canvas.height);
        const firstPageCtx = firstPageCanvas.getContext('2d');
        
        if (firstPageCtx) {
          firstPageCtx.drawImage(
            canvas,
            0, 0,
            canvas.width, firstPageCanvas.height,
            0, 0,
            canvas.width, firstPageCanvas.height
          );
          const firstPageImgData = firstPageCanvas.toDataURL('image/png');
          const firstPageHeight = (firstPageCanvas.height * imgWidth) / canvas.width;
          pdf.addImage(firstPageImgData, 'PNG', margin, yPosition, imgWidth, firstPageHeight);
        }
        
        currentSourceY = firstPageCanvas.height;
        
        // Páginas subsequentes
        while (currentSourceY < canvas.height) {
          pdf.addPage();
          yPosition = margin;
          
          const remainingCanvasHeight = canvas.height - currentSourceY;
          const pageContentHeight = pageHeight - (2 * margin);
          const canvasHeightForPage = (pageContentHeight * canvas.width) / imgWidth;
          const heightToRender = Math.min(canvasHeightForPage, remainingCanvasHeight);
          
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = heightToRender;
          const pageCtx = pageCanvas.getContext('2d');
          
          if (pageCtx) {
            pageCtx.drawImage(
              canvas,
              0, currentSourceY,
              canvas.width, heightToRender,
              0, 0,
              canvas.width, heightToRender
            );
            const pageImgData = pageCanvas.toDataURL('image/png');
            const pageImgHeight = (heightToRender * imgWidth) / canvas.width;
            pdf.addImage(pageImgData, 'PNG', margin, yPosition, imgWidth, pageImgHeight);
          }
          
          currentSourceY += heightToRender;
        }
      }
      
      // 📋 SEMPRE COMEÇAR AS TABELAS EM UMA NOVA PÁGINA LIMPA
      pdf.addPage();
      yPosition = margin;
      
      // Cabeçalho da seção de dados detalhados
      pdf.setFontSize(14);
      pdf.setTextColor(0, 122, 204);
      pdf.text('Dados Detalhados por Seção', margin, yPosition);
      yPosition += 10;
      
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      
    } catch (error) {
      console.warn('⚠️ Não foi possível capturar imagem do dashboard:', error);
      // Continuar com as tabelas mesmo se a captura falhar
      // Se falhar, garantir que estamos em uma nova página limpa
      if (pdf.getCurrentPageInfo().pageNumber > 1) {
        pdf.addPage();
        yPosition = margin;
      }
    }
  } else {
    // Se não encontrou o elemento do dashboard, começar direto nas tabelas
    yPosition += 8;
  }
  
  // Processar cada seção
  data.sections.forEach((section, sectionIndex) => {
    // Verificar se precisa de nova página para a seção
    checkAddPage(40);
    
    // Título da seção
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(section.name, margin, yPosition);
    yPosition += 8;
    pdf.setFont('helvetica', 'normal');
    
    // Preparar dados da tabela
    const total = section.data.reduce((sum, item) => sum + item.value, 0);
    const tableData = section.data.map(item => {
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
      return [
        item.name,
        item.value.toString(),
        `${percentage}%`
      ];
    });
    
    // Desenhar tabela
    const colWidths = [100, 35, 35]; // Larguras das colunas
    const headers = ['Categoria', 'Valor', 'Percentual'];
    
    // Cabeçalho da tabela
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, colWidths[0] + colWidths[1] + colWidths[2], 8, 'F');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(headers[0], margin + 2, yPosition + 5.5);
    pdf.text(headers[1], margin + colWidths[0] + 2, yPosition + 5.5);
    pdf.text(headers[2], margin + colWidths[0] + colWidths[1] + 2, yPosition + 5.5);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    
    // Linhas da tabela
    tableData.forEach((row, index) => {
      checkAddPage(7);
      
      // Alternar cor de fundo
      if (index % 2 === 1) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, yPosition, colWidths[0] + colWidths[1] + colWidths[2], 7, 'F');
      }
      
      // Desenhar bordas
      pdf.setDrawColor(220, 220, 220);
      pdf.rect(margin, yPosition, colWidths[0], 7);
      pdf.rect(margin + colWidths[0], yPosition, colWidths[1], 7);
      pdf.rect(margin + colWidths[0] + colWidths[1], yPosition, colWidths[2], 7);
      
      // Texto
      pdf.setFontSize(8);
      pdf.setTextColor(60, 60, 60);
      
      // Categoria (com quebra de linha se necessário)
      const maxCategoryWidth = colWidths[0] - 4;
      const categoryLines = pdf.splitTextToSize(row[0], maxCategoryWidth);
      pdf.text(categoryLines[0], margin + 2, yPosition + 5);
      
      // Valor e Percentual
      pdf.text(row[1], margin + colWidths[0] + 2, yPosition + 5);
      pdf.text(row[2], margin + colWidths[0] + colWidths[1] + 2, yPosition + 5);
      
      yPosition += 7;
    });
    
    // Linha de total
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(230, 240, 250);
    pdf.rect(margin, yPosition, colWidths[0] + colWidths[1] + colWidths[2], 8, 'F');
    pdf.setFontSize(9);
    pdf.text('Total', margin + 2, yPosition + 5.5);
    pdf.text(total.toString(), margin + colWidths[0] + 2, yPosition + 5.5);
    pdf.text('100%', margin + colWidths[0] + colWidths[1] + 2, yPosition + 5.5);
    yPosition += 12;
    
    pdf.setFont('helvetica', 'normal');
    
    // Linha separadora entre seções (se não for a última)
    if (sectionIndex < data.sections.length - 1) {
      checkAddPage(8);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;
    }
  });
  
  // Rodapé em todas as páginas
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleString('pt-BR')}`,
      margin,
      pageHeight - 10
    );
    pdf.text(
      'App Saúde Pará',
      pageWidth - margin - 35,
      pageHeight - 10
    );
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
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `;
        }).join('')}
        
        <div style="margin-top: 40px; font-size: 12px; color: #666; text-align: center;">
          <p>Documento gerado automaticamente pelo App Saúde Pará</p>
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
