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

    // Salvar estado original de overflow e altura do elemento principal
    const originalOverflow = element.style.overflow;
    const originalMaxHeight = element.style.maxHeight;
    const originalHeight = element.style.height;
    
    // Remover restrições de altura e overflow temporariamente
    element.style.overflow = 'visible';
    element.style.maxHeight = 'none';
    element.style.height = 'auto';
    
    // Encontrar TODOS os elementos filhos com overflow (incluindo classes CSS)
    const allElements = element.querySelectorAll('*');
    const overflowStates: { 
      element: HTMLElement; 
      originalOverflow: string;
      originalOverflowX: string;
      originalOverflowY: string;
      originalMaxHeight: string;
      originalHeight: string;
    }[] = [];
    
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlEl);
      
      // Verificar se elemento tem overflow ou max-height definidos
      if (computedStyle.overflow !== 'visible' || 
          computedStyle.overflowY !== 'visible' || 
          computedStyle.overflowX !== 'visible' ||
          computedStyle.maxHeight !== 'none') {
        
        overflowStates.push({ 
          element: htmlEl, 
          originalOverflow: htmlEl.style.overflow,
          originalOverflowX: htmlEl.style.overflowX,
          originalOverflowY: htmlEl.style.overflowY,
          originalMaxHeight: htmlEl.style.maxHeight,
          originalHeight: htmlEl.style.height
        });
        
        // Forçar visibilidade total
        htmlEl.style.overflow = 'visible';
        htmlEl.style.overflowX = 'visible';
        htmlEl.style.overflowY = 'visible';
        htmlEl.style.maxHeight = 'none';
        htmlEl.style.height = 'auto';
      }
    });

    // Aguardar um frame para garantir que o layout seja recalculado
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Usar html2canvas para capturar o elemento com configurações otimizadas
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 3, // Alta qualidade para impressão
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      width: element.scrollWidth,
      height: element.scrollHeight
    });

    // Restaurar estado original do elemento principal
    element.style.overflow = originalOverflow;
    element.style.maxHeight = originalMaxHeight;
    element.style.height = originalHeight;
    
    // Restaurar estado original de todos os elementos filhos
    overflowStates.forEach(({ element, originalOverflow, originalOverflowX, originalOverflowY, originalMaxHeight, originalHeight }) => {
      element.style.overflow = originalOverflow;
      element.style.overflowX = originalOverflowX;
      element.style.overflowY = originalOverflowY;
      element.style.maxHeight = originalMaxHeight;
      element.style.height = originalHeight;
    });

    // Criar link para download com máxima qualidade
    const link = document.createElement('a');
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`✅ PNG exportado: ${link.download}`);
  } catch (error) {
    console.error('❌ Erro ao exportar PNG:', error);
    alert('Erro ao exportar PNG. Verifique se a biblioteca html2canvas está instalada.');
  }
};

// 📋 EXPORTAÇÃO PARA JSON (Dados Estruturados)
export const exportChartAsJSON = (data: ChartDataItem[], title: string): void => {
  try {
    // Preparar dados JSON com metadados
    const jsonData = {
      title,
      exportDate: new Date().toISOString(),
      exportDateFormatted: new Date().toLocaleString('pt-BR'),
      totalItems: data.length,
      totalValue: data.reduce((sum, item) => sum + item.value, 0),
      data: data.map(item => ({
        name: item.name,
        value: item.value,
        fill: item.fill || null,
        isAlarmante: item.isAlarmante || false
      }))
    };

    // Criar string JSON formatada
    const jsonString = JSON.stringify(jsonData, null, 2);
    
    // Criar blob e download
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    console.log(`✅ JSON exportado: ${link.download}`);
  } catch (error) {
    console.error('❌ Erro ao exportar JSON:', error);
    alert('Erro ao exportar JSON');
  }
};

// 🎨 EXPORTAÇÃO PARA SVG (Vetorial - Alta Qualidade)
export const exportChartAsSVG = async (chartId: string, title: string): Promise<void> => {
  try {
    const element = document.getElementById(chartId);
    if (!element) {
      alert('Elemento do gráfico não encontrado!');
      return;
    }

    // Procurar pelo elemento SVG dentro do container
    const svgElement = element.querySelector('svg');
    if (!svgElement) {
      alert('Gráfico SVG não encontrado! Este formato só funciona para gráficos baseados em SVG.');
      return;
    }

    // Clonar o SVG para não alterar o original
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    
    // Obter dimensões do SVG
    const bbox = svgElement.getBBox();
    const width = bbox.width || svgElement.clientWidth || 800;
    const height = bbox.height || svgElement.clientHeight || 600;
    
    // Configurar atributos do SVG clonado
    clonedSvg.setAttribute('width', width.toString());
    clonedSvg.setAttribute('height', height.toString());
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // Adicionar estilos inline ao SVG
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');
    
    // Criar elemento de estilo
    const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleElement.textContent = styles;
    clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);
    
    // Serializar o SVG
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    
    // Criar blob e download
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    console.log(`✅ SVG exportado: ${link.download}`);
  } catch (error) {
    console.error('❌ Erro ao exportar SVG:', error);
    alert('Erro ao exportar SVG. Este formato funciona apenas para gráficos baseados em SVG.');
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

    // Salvar estado original de overflow e altura do elemento principal
    const originalOverflow = element.style.overflow;
    const originalMaxHeight = element.style.maxHeight;
    const originalHeight = element.style.height;
    
    // Remover restrições de altura e overflow temporariamente
    element.style.overflow = 'visible';
    element.style.maxHeight = 'none';
    element.style.height = 'auto';
    
    // Encontrar TODOS os elementos filhos com overflow (incluindo classes CSS)
    const allElements = element.querySelectorAll('*');
    const overflowStates: { 
      element: HTMLElement; 
      originalOverflow: string;
      originalOverflowX: string;
      originalOverflowY: string;
      originalMaxHeight: string;
      originalHeight: string;
    }[] = [];
    
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlEl);
      
      // Verificar se elemento tem overflow ou max-height definidos
      if (computedStyle.overflow !== 'visible' || 
          computedStyle.overflowY !== 'visible' || 
          computedStyle.overflowX !== 'visible' ||
          computedStyle.maxHeight !== 'none') {
        
        overflowStates.push({ 
          element: htmlEl, 
          originalOverflow: htmlEl.style.overflow,
          originalOverflowX: htmlEl.style.overflowX,
          originalOverflowY: htmlEl.style.overflowY,
          originalMaxHeight: htmlEl.style.maxHeight,
          originalHeight: htmlEl.style.height
        });
        
        // Forçar visibilidade total
        htmlEl.style.overflow = 'visible';
        htmlEl.style.overflowX = 'visible';
        htmlEl.style.overflowY = 'visible';
        htmlEl.style.maxHeight = 'none';
        htmlEl.style.height = 'auto';
      }
    });

    // Aguardar um frame para garantir que o layout seja recalculado
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Capturar elemento como imagem com configurações otimizadas
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 3, // Alta qualidade para impressão
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      width: element.scrollWidth,
      height: element.scrollHeight
    });

    // Restaurar estado original do elemento principal
    element.style.overflow = originalOverflow;
    element.style.maxHeight = originalMaxHeight;
    element.style.height = originalHeight;
    
    // Restaurar estado original de todos os elementos filhos
    overflowStates.forEach(({ element, originalOverflow, originalOverflowX, originalOverflowY, originalMaxHeight, originalHeight }) => {
      element.style.overflow = originalOverflow;
      element.style.overflowX = originalOverflowX;
      element.style.overflowY = originalOverflowY;
      element.style.maxHeight = originalMaxHeight;
      element.style.height = originalHeight;
    });

    // Criar PDF com alta qualidade
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calcular dimensões mantendo proporção
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // Margem de 10mm de cada lado
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Adicionar título
    pdf.setFontSize(16);
    pdf.text(title, pdfWidth / 2, 15, { align: 'center' });
    
    // Verificar se a imagem cabe em uma página
    if (imgHeight <= pdfHeight - 40) {
      // Adicionar imagem em uma página
      pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);
    } else {
      // Dividir em múltiplas páginas se necessário
      let position = 25;
      let remainingHeight = imgHeight;
      const maxHeightPerPage = pdfHeight - 40;
      
      while (remainingHeight > 0) {
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        remainingHeight -= maxHeightPerPage;
        
        if (remainingHeight > 0) {
          pdf.addPage();
          position = 10;
        }
      }
    }
    
    // Adicionar rodapé com data
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')} | Página ${i} de ${pageCount}`, pdfWidth / 2, pdfHeight - 10, { align: 'center' });
    }
    
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

    // Salvar estado original de overflow e altura do elemento principal
    const originalOverflow = element.style.overflow;
    const originalMaxHeight = element.style.maxHeight;
    const originalHeight = element.style.height;
    
    // Remover restrições de altura e overflow temporariamente
    element.style.overflow = 'visible';
    element.style.maxHeight = 'none';
    element.style.height = 'auto';
    
    // Encontrar TODOS os elementos filhos com overflow (incluindo classes CSS)
    const allElements = element.querySelectorAll('*');
    const overflowStates: { 
      element: HTMLElement; 
      originalOverflow: string;
      originalOverflowX: string;
      originalOverflowY: string;
      originalMaxHeight: string;
      originalHeight: string;
    }[] = [];
    
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlEl);
      
      // Verificar se elemento tem overflow ou max-height definidos
      if (computedStyle.overflow !== 'visible' || 
          computedStyle.overflowY !== 'visible' || 
          computedStyle.overflowX !== 'visible' ||
          computedStyle.maxHeight !== 'none') {
        
        overflowStates.push({ 
          element: htmlEl, 
          originalOverflow: htmlEl.style.overflow,
          originalOverflowX: htmlEl.style.overflowX,
          originalOverflowY: htmlEl.style.overflowY,
          originalMaxHeight: htmlEl.style.maxHeight,
          originalHeight: htmlEl.style.height
        });
        
        // Forçar visibilidade total
        htmlEl.style.overflow = 'visible';
        htmlEl.style.overflowX = 'visible';
        htmlEl.style.overflowY = 'visible';
        htmlEl.style.maxHeight = 'none';
        htmlEl.style.height = 'auto';
      }
    });

    // Aguardar um frame para garantir que o layout seja recalculado
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Capturar gráfico como imagem com configurações otimizadas
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 3, // Alta qualidade para impressão
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      width: element.scrollWidth,
      height: element.scrollHeight
    });

    // Restaurar estado original do elemento principal
    element.style.overflow = originalOverflow;
    element.style.maxHeight = originalMaxHeight;
    element.style.height = originalHeight;
    
    // Restaurar estado original de todos os elementos filhos
    overflowStates.forEach(({ element, originalOverflow, originalOverflowX, originalOverflowY, originalMaxHeight, originalHeight }) => {
      element.style.overflow = originalOverflow;
      element.style.overflowX = originalOverflowX;
      element.style.overflowY = originalOverflowY;
      element.style.maxHeight = originalMaxHeight;
      element.style.height = originalHeight;
    });

    const imgData = canvas.toDataURL('image/png', 1.0);

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
              <w:Zoom>100</w:Zoom>
              <w:DoNotPromptForConvert/>
              <w:DoNotShowRevisions/>
              <w:DoNotPrintRevisions/>
            </w:WordDocument>
            <w:PageSetup>
              <w:PageWidth>11906</w:PageWidth>
              <w:PageHeight>16838</w:PageHeight>
              <w:MarginLeft>1134</w:MarginLeft>
              <w:MarginRight>1134</w:MarginRight>
              <w:MarginTop>1134</w:MarginTop>
              <w:MarginBottom>1134</w:MarginBottom>
            </w:PageSetup>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: A4;
              margin: 2cm;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 2cm;
              max-width: 21cm;
            }
            h1 { 
              color: #333; 
              border-bottom: 2px solid #007acc; 
              padding-bottom: 10px;
              font-size: 18pt;
              margin-bottom: 20px;
            }
            h2 {
              color: #555;
              font-size: 14pt;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin-top: 20px;
              page-break-inside: avoid;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left;
              font-size: 10pt;
            }
            th { 
              background-color: #f2f2f2; 
              font-weight: bold; 
            }
            .metadata { 
              margin-top: 30px; 
              font-size: 10pt; 
              color: #666;
              page-break-inside: avoid;
            }
            .chart-image { 
              margin: 20px 0; 
              text-align: center;
              page-break-inside: avoid;
            }
            .chart-image img {
              max-width: 100% !important;
              width: 100% !important;
              height: auto !important;
              display: block;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          
          <div class="chart-image">
            <img src="${imgData}" alt="Gráfico ${title}">
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

interface DashboardCaptureImage {
  title: string;
  panels: Array<{
    imageData: string;
    width: number;
    height: number;
  }>;
}

interface DashboardCaptureBlock {
  top: number;
  height: number;
}

const isVisibleElement = (element: HTMLElement): boolean => {
  const computedStyle = window.getComputedStyle(element);
  return (
    computedStyle.display !== 'none' &&
    computedStyle.visibility !== 'hidden' &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0
  );
};

const buildDashboardCaptureBlocks = (dashboardElement: HTMLElement): DashboardCaptureBlock[] => {
  const blocks: DashboardCaptureBlock[] = [];
  const rootChildren = Array.from(dashboardElement.children).filter(
    (node) => node instanceof HTMLElement && isVisibleElement(node as HTMLElement)
  ) as HTMLElement[];

  rootChildren.forEach((child) => {
    if (child.classList.contains('grid')) {
      const gridItems = Array.from(child.children).filter(
        (node) => node instanceof HTMLElement && isVisibleElement(node as HTMLElement)
      ) as HTMLElement[];

      if (gridItems.length === 0) {
        blocks.push({ top: child.offsetTop, height: child.offsetHeight });
        return;
      }

      const sortedItems = [...gridItems].sort((a, b) => a.offsetTop - b.offsetTop);
      const rowThreshold = 18;
      let currentRow: HTMLElement[] = [];
      let currentRowTop: number | null = null;

      const flushRow = () => {
        if (currentRow.length === 0) return;

        const rowTop = Math.min(...currentRow.map((item) => item.offsetTop));
        const rowBottom = Math.max(...currentRow.map((item) => item.offsetTop + item.offsetHeight));
        const padding = 6;

        blocks.push({
          top: Math.max(0, child.offsetTop + rowTop - padding),
          height: rowBottom - rowTop + padding * 2,
        });

        currentRow = [];
        currentRowTop = null;
      };

      sortedItems.forEach((item) => {
        if (currentRowTop === null) {
          currentRow = [item];
          currentRowTop = item.offsetTop;
          return;
        }

        if (Math.abs(item.offsetTop - currentRowTop) <= rowThreshold) {
          currentRow.push(item);
          return;
        }

        flushRow();
        currentRow = [item];
        currentRowTop = item.offsetTop;
      });

      flushRow();
      return;
    }

    blocks.push({ top: child.offsetTop, height: child.offsetHeight });
  });

  if (blocks.length === 0) {
    blocks.push({
      top: 0,
      height: Math.max(dashboardElement.scrollHeight, dashboardElement.offsetHeight, 1),
    });
  }

  const normalized = blocks
    .filter((block) => block.height > 0)
    .sort((a, b) => a.top - b.top);

  const merged: DashboardCaptureBlock[] = [];
  normalized.forEach((block) => {
    const last = merged[merged.length - 1];
    if (!last) {
      merged.push(block);
      return;
    }

    const lastBottom = last.top + last.height;
    const currentBottom = block.top + block.height;

    if (block.top <= lastBottom + 4) {
      last.height = Math.max(lastBottom, currentBottom) - last.top;
      return;
    }

    merged.push(block);
  });

  return merged;
};

const captureHtmlElement = async (
  element: HTMLElement,
  scale: number,
  forcedSize?: { width: number; height: number },
  options?: { allowTaint?: boolean }
): Promise<HTMLCanvasElement> => {
  const elementRect = element.getBoundingClientRect();
  const captureWidth = Math.max(Math.ceil(forcedSize?.width ?? elementRect.width), 1);
  const captureHeight = Math.max(Math.ceil(forcedSize?.height ?? element.scrollHeight ?? elementRect.height), 1);
  const viewportWidth = Math.max(captureWidth, 1);

  return html2canvas(element, {
    backgroundColor: '#ffffff',
    scale,
    useCORS: true,
    allowTaint: options?.allowTaint ?? false,
    logging: false,
    width: captureWidth,
    height: captureHeight,
    windowWidth: viewportWidth,
    windowHeight: captureHeight,
    scrollX: 0,
    scrollY: 0,
  });
};

/** Captura apenas o bloco do mapa (Leaflet) com allowTaint para tiles aparecerem. */
const captureMapBlockFromDashboard = async (dashboardElement: HTMLElement): Promise<string | null> => {
  const mapWrapper = dashboardElement.querySelector('.leaflet-container')?.closest('.relative') as HTMLElement | null;
  if (!mapWrapper || mapWrapper.offsetWidth < 10 || mapWrapper.offsetHeight < 10) return null;

  try {
    const w = Math.max(mapWrapper.offsetWidth, 1);
    const h = Math.max(mapWrapper.offsetHeight, 1);
    const canvas = await html2canvas(mapWrapper, {
      backgroundColor: '#ffffff',
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: w,
      height: h,
      windowWidth: w,
      windowHeight: h,
      scrollX: 0,
      scrollY: 0,
    });
    return canvas.toDataURL('image/png', 1.0);
  } catch {
    return null;
  }
};

/** No clone do dashboard, substitui o container do mapa por uma imagem estática ou placeholder. */
const replaceMapWithImageInClone = (clonedDashboard: HTMLElement, mapImageDataUrl: string | null): void => {
  const mapWrapper = clonedDashboard.querySelector('.leaflet-container')?.closest('.relative') as HTMLElement | null;
  if (!mapWrapper) return;

  mapWrapper.innerHTML = '';

  if (mapImageDataUrl) {
    const img = document.createElement('img');
    img.src = mapImageDataUrl;
    img.alt = 'Mapa de Localizações';
    img.setAttribute('style', 'width:100%;height:100%;object-fit:cover;display:block;border:0;');
    mapWrapper.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.setAttribute(
      'style',
      'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f1f5f9;color:#64748b;font-size:14px;gap:8px;'
    );
    placeholder.innerHTML =
      '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg><span>Mapa de localizações (não reproduzido no export)</span>';
    mapWrapper.appendChild(placeholder);
  }
};

const captureDashboardVisuals = async (): Promise<DashboardCaptureImage | null> => {
  const dashboardElement = document.querySelector('[data-dashboard="main"]') as HTMLElement | null;
  if (!dashboardElement) {
    return null;
  }

  document.body.click();
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    const elementRect = dashboardElement.getBoundingClientRect();
    const captureWidth = Math.max(Math.ceil(elementRect.width), 1);
    const scale = 1.8;

    const mapImageDataUrl = await captureMapBlockFromDashboard(dashboardElement);

    const offscreenWrapper = document.createElement('div');
    offscreenWrapper.style.position = 'fixed';
    offscreenWrapper.style.left = '-100000px';
    offscreenWrapper.style.top = '0';
    offscreenWrapper.style.width = `${captureWidth}px`;
    offscreenWrapper.style.background = '#ffffff';
    offscreenWrapper.style.overflow = 'hidden';
    offscreenWrapper.style.zIndex = '-1';

    const clonedDashboard = dashboardElement.cloneNode(true) as HTMLElement;
    clonedDashboard.style.width = `${captureWidth}px`;
    clonedDashboard.style.maxWidth = 'none';
    clonedDashboard.style.margin = '0';
    clonedDashboard.style.transform = 'translateY(0)';

    replaceMapWithImageInClone(clonedDashboard, mapImageDataUrl);

    const selectorsToHide =
      '[data-export-menu], .export-menu, [role="menu"], iframe, .leaflet-container, .leaflet-control-container, .leaflet-pane img, .leaflet-pane canvas';
    clonedDashboard.querySelectorAll(selectorsToHide).forEach((node) => {
      (node as HTMLElement).style.display = 'none';
    });

    offscreenWrapper.appendChild(clonedDashboard);
    document.body.appendChild(offscreenWrapper);

    const panels: Array<{ imageData: string; width: number; height: number }> = [];

    try {
      const dashboardHeight = Math.max(clonedDashboard.scrollHeight, clonedDashboard.offsetHeight, 1);
      const captureBlocks = buildDashboardCaptureBlocks(clonedDashboard);

      for (const block of captureBlocks) {
        const boundedTop = Math.max(0, Math.min(block.top, dashboardHeight - 1));
        const boundedHeight = Math.max(1, Math.min(block.height, dashboardHeight - boundedTop));

        offscreenWrapper.style.height = `${boundedHeight}px`;
        clonedDashboard.style.transform = `translateY(-${boundedTop}px)`;

        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

        const canvas = await captureHtmlElement(offscreenWrapper, scale, {
          width: captureWidth,
          height: boundedHeight,
        });

        panels.push({
          imageData: canvas.toDataURL('image/png', 1.0),
          width: canvas.width,
          height: canvas.height,
        });
      }
    } finally {
      document.body.removeChild(offscreenWrapper);
    }

    if (panels.length === 0) {
      return null;
    }

    return {
      title: 'Dashboard Visual',
      panels,
    };
  } catch (error) {
    console.warn('⚠️ Não foi possível capturar painel visual do dashboard:', error);
    return null;
  }
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

  // 🖼️ CAPTURA VISUAL DO DASHBOARD — na primeira página
  const visualCapture = await captureDashboardVisuals();

  if (visualCapture) {
    pdf.setFontSize(14);
    pdf.setTextColor(0, 122, 204);
    pdf.text('Dashboard Visual', margin, yPosition);
    yPosition += 10;

    const imgWidth = pageWidth - (2 * margin);
    visualCapture.panels.forEach((panel, index) => {
      let renderWidth = imgWidth;
      let renderHeight = (panel.height * renderWidth) / panel.width;

      if (yPosition + renderHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      const maxHeightForPanel = pageHeight - margin - yPosition;
      if (renderHeight > maxHeightForPanel) {
        renderHeight = maxHeightForPanel;
        renderWidth = (panel.width * renderHeight) / panel.height;
      }

      const xPosition = margin + (imgWidth - renderWidth) / 2;
      pdf.addImage(panel.imageData, 'PNG', xPosition, yPosition, renderWidth, renderHeight);
      yPosition += renderHeight + (index < visualCapture.panels.length - 1 ? 4 : 0);
    });

    pdf.addPage();
    yPosition = margin;
  }

  // Cabeçalho do documento (após o dashboard visual)
  pdf.setFontSize(18);
  pdf.setTextColor(0, 122, 204);
  pdf.text('Comunicação de Eventos', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(14);
  pdf.setTextColor(80, 80, 80);
  pdf.text('Dashboard Completo', margin, yPosition);
  yPosition += 12;

  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Total de Registros: ${data.metadata?.totalRecords || 0}`, margin, yPosition);
  yPosition += 6;
  pdf.text(`Data de Geração: ${data.metadata?.dateGenerated || new Date().toLocaleString('pt-BR')}`, margin, yPosition);
  yPosition += 12;

  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(14);
  pdf.setTextColor(0, 122, 204);
  pdf.text('Dados Detalhados por Seção', margin, yPosition);
  yPosition += 10;
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  pdf.setFont('helvetica', 'normal');

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
  const escapeHtml = (value: string): string =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  try {
    const visualCapture = await captureDashboardVisuals();

    const visualSectionHtml = visualCapture
      ? `
        <div class="dashboard-image">
          <h2>Painel Visual do Dashboard</h2>
          ${visualCapture.panels
            .map(
              (panel) => `
            <div class="dashboard-panel">
              <img src="${panel.imageData}" alt="Painel Visual do Dashboard">
            </div>
          `
            )
            .join('')}
        </div>
      `
      : `
          <div class="summary">
            <p><strong>Nota:</strong> Não foi possível capturar os painéis visuais do dashboard. Os dados detalhados seguem normalmente no documento.</p>
          </div>
        `;

    // HTML completo para Word
    const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
      <head>
        <meta charset="UTF-8">
        <title>${data.title}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotPromptForConvert/>
            <w:DoNotShowRevisions/>
            <w:DoNotPrintRevisions/>
          </w:WordDocument>
          <w:PageSetup>
            <w:PageWidth>11906</w:PageWidth>
            <w:PageHeight>16838</w:PageHeight>
            <w:MarginLeft>1134</w:MarginLeft>
            <w:MarginRight>1134</w:MarginRight>
            <w:MarginTop>1134</w:MarginTop>
            <w:MarginBottom>1134</w:MarginBottom>
          </w:PageSetup>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 2cm;
            max-width: 21cm;
          }
          h1 { 
            color: #333; 
            border-bottom: 3px solid #007acc; 
            padding-bottom: 15px;
            font-size: 20pt;
            margin-bottom: 20px;
            page-break-after: avoid;
          }
          h2 { 
            color: #555; 
            margin-top: 30px;
            font-size: 14pt;
            page-break-after: avoid;
          }
          .dashboard-image { 
            margin: 20px 0; 
            text-align: center;
            page-break-inside: avoid;
          }
          .dashboard-panel {
            margin-bottom: 8px;
            page-break-inside: avoid;
          }
          .dashboard-image img {
            max-width: 100% !important;
            width: 100% !important;
            height: auto !important;
            display: block;
            margin: 0 auto;
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 15px 0;
            font-size: 10pt;
            page-break-inside: avoid;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #f8f9fa; 
            font-weight: bold; 
          }
          .summary { 
            background-color: #e3f2fd; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            page-break-inside: avoid;
          }
          .summary p {
            margin: 8px 0;
            font-size: 11pt;
          }
        </style>
      </head>
      <body>
        <h1>${data.title}</h1>
        
        <div class="summary">
          <h2>Resumo Executivo</h2>
          <p><strong>Total de Registros:</strong> ${data.metadata?.totalRecords || 0}</p>
          <p><strong>Data de Geração:</strong> ${data.metadata?.dateGenerated || new Date().toLocaleString('pt-BR')}</p>
          <p><strong>Seções Incluídas:</strong> ${data.sections.length}</p>
        </div>
        
        ${visualSectionHtml}
        
        ${data.sections.map(section => {
          const total = section.data.reduce((sum, item) => sum + item.value, 0);
          return `
            <h2>${escapeHtml(section.name)}</h2>
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
                      <td>${escapeHtml(item.name)}</td>
                      <td>${item.value}</td>
                      <td>${percentage}%</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `;
        }).join('')}
        
        <div style="margin-top: 40px; font-size: 12px; color: #666; text-align: center; page-break-inside: avoid;">
          <p>Documento gerado automaticamente pelo App Saúde Pará</p>
          <p>Comunicação de Eventos - ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </body>
    </html>
  `;

    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    console.log(`✅ Dashboard Word exportado: ${filename}.doc`);
  } catch (error) {
    console.error('❌ Erro ao exportar dashboard para Word:', error);
    alert('Erro ao exportar dashboard para Word. Verifique se a biblioteca html2canvas está instalada.');
  }
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
