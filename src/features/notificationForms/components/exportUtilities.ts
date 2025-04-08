import { FormData } from "@/features/notificationForms/components/types";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
interface ExportData {
  [key: string]: string | number | boolean | undefined;
}

// Interface para as opções de exportação
interface ExportOptions {
  eventoOptions: any[];
  publicoOptions: any[];
  paisOptions: any[];
  estadoOptions: any[];
  municipioOptions: any[];
  bairroOptions: any[];
  generoOptions: any[];
  racaOptions: any[];
  escolaridadeOptions: any[];
  atendimentoOptions: any[];
  sintomaOptions: any[];
  hipoteseDiagOptions: any[];
  traumaOptions: any[];
  estabelecimentoOptions: any[];
  encerramentoOptions: any[];
}

// Helper function to format form data for export
const prepareDataForExport = (formData: FormData, exportOptions?: ExportOptions): ExportData => {
  // Funções para obter rótulos a partir de valores e opções
  const getLabelFromOptions = (value: string, options: any[], idField: string, descField: string = 'descricao'): string => {
    if (!value || !options || options.length === 0) return value;
    const option = options.find(opt => String(opt[idField]) === String(value));
    return option ? option[descField] : value;
  };

  // Convert enum values to their readable labels using options if provided
  const getPublicoAtendidoLabel = (value: string): string => {
    if (exportOptions?.publicoOptions) {
      return getLabelFromOptions(value, exportOptions.publicoOptions, 'idtipo_publico');
    }
    
    const map: Record<string, string> = { "1": "Visitante", "2": "Trabalhador", "3": "Autoridade" };
    return map[value] || value;
  };

  const getResidenteBelemLabel = (value: string): string => {
    const map: Record<string, string> = { "1": "SIM", "2": "NÃO", "3": "ESTRANGEIRO" };
    return map[value] || value;
  };

  const getIdentidadeGeneroLabel = (value: string): string => {
    if (exportOptions?.generoOptions) {
      return getLabelFromOptions(value, exportOptions.generoOptions, 'idtipo_genero');
    }
    
    const map: Record<string, string> = {
      "1": "Mulher cisgênero", "2": "Homem cisgênero", "3": "Mulher transgênero",
      "4": "Homem transgênero", "5": "Travesti", "6": "Não binário",
      "7": "Não se aplica", "9": "Ignorado"
    };
    return map[value] || value;
  };

  const getGestanteLabel = (value: string): string => {
    const map: Record<string, string> = { "1": "Sim", "2": "Não" };
    return map[value] || value;
  };

  const getRacaLabel = (value: string): string => {
    if (exportOptions?.racaOptions) {
      return getLabelFromOptions(value, exportOptions.racaOptions, 'idtipo_raca');
    }
    
    const map: Record<string, string> = {
      "1": "Branca", "2": "Preta", "3": "Amarela", "4": "Parda",
      "5": "Indígena", "9": "Ignorado"
    };
    return map[value] || value;
  };

  const getEscolaridadeLabel = (value: string): string => {
    if (exportOptions?.escolaridadeOptions) {
      return getLabelFromOptions(value, exportOptions.escolaridadeOptions, 'idtipo_escolaridade');
    }
    
    const map: Record<string, string> = {
      "0": "Analfabeto", "1": "Ensino fundamental incompleto", "2": "Ensino fundamental completo",
      "3": "Ensino médio incompleto", "4": "Ensino médio completo", "5": "Ensino superior incompleto",
      "8": "Ensino superior completo", "9": "Pós-graduado", "10": "Ignorado", "11": "Não se aplica"
    };
    return map[value] || value;
  };

  const getTipoAtendimentoLabel = (value: string): string => {
    if (exportOptions?.atendimentoOptions) {
      return getLabelFromOptions(value, exportOptions.atendimentoOptions, 'idtipo_atendimento');
    }
    
    const map: Record<string, string> = {
      "1": "Clínico", "2": "Trauma", "3": "Surto",
      "4": "Múltiplas vítimas", "5": "Incidente QBRN"
    };
    return map[value] || value;
  };

  const getTipoEncerramentoLabel = (value: string): string => {
    if (exportOptions?.encerramentoOptions) {
      return getLabelFromOptions(value, exportOptions.encerramentoOptions, 'idtipo_encerramento');
    }
    
    const map: Record<string, string> = {
      "1": "Atendido e liberado", "2": "Internação", "3": "Observação",
      "4": "Transferido", "5": "Óbito"
    };
    return map[value] || value;
  };

  // Get sinais e sintomas labels
  const getSintomasLabels = (values: string[]): string => {
    if (!values || values.length === 0) return "";
    
    if (exportOptions?.sintomaOptions) {
      return values.map(value => 
        getLabelFromOptions(value, exportOptions.sintomaOptions, 'idtipo_sintoma')
      ).join(", ");
    }
    
    return values.join(", ");
  };

  // Get hipótese diagnóstica labels
  const getHipoteseDiagLabels = (values: string[]): string => {
    if (!values || values.length === 0) return "";
    
    if (exportOptions?.hipoteseDiagOptions) {
      return values.map(value => 
        getLabelFromOptions(value, exportOptions.hipoteseDiagOptions, 'idtipo_hipotese_diag')
      ).join(", ");
    }
    
    return values.join(", ");
  };

  // Get trauma labels
  const getTraumaLabels = (values: string[]): string => {
    if (!values || values.length === 0) return "";
    
    if (exportOptions?.traumaOptions) {
      return values.map(value => 
        getLabelFromOptions(value, exportOptions.traumaOptions, 'idtipo_trauma')
      ).join(", ");
    }
    
    return values.join(", ");
  };

  // Get evento label
  const getEventoLabel = (value: string): string => {
    if (exportOptions?.eventoOptions) {
      return getLabelFromOptions(value, exportOptions.eventoOptions, 'idtipo_evento');
    }
    return value;
  };

  // Get pais label
  const getPaisLabel = (value: string): string => {
    if (exportOptions?.paisOptions) {
      return getLabelFromOptions(value, exportOptions.paisOptions, 'idtipo_pais');
    }
    return value;
  };

  // Get UF label
  const getUfLabel = (value: string): string => {
    if (exportOptions?.estadoOptions) {
      return getLabelFromOptions(value, exportOptions.estadoOptions, 'idtipo_estado');
    }
    return value;
  };

  // Get municipio label
  const getMunicipioLabel = (value: string): string => {
    if (exportOptions?.municipioOptions) {
      return getLabelFromOptions(value, exportOptions.municipioOptions, 'idtipo_municipio');
    }
    return value;
  };

  // Format date strings
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return dateString;
    }
  };

  // Return formatted data ready for export
  return {
    // Seção 1: Dados Gerais
    "Evento": getEventoLabel(formData.evento),
    "Público Atendido": getPublicoAtendidoLabel(formData.publicoAtendido),

    // Seção 2: Procedência do indivíduo
    "Residente em Belém": getResidenteBelemLabel(formData.residenteBelem),
    "Bairro": formData.bairro,
    "Município": getMunicipioLabel(formData.municipio),
    "UF": getUfLabel(formData.uf),
    "País de Procedência": getPaisLabel(formData.paisProcedencia),
    "Local de Hospedagem": formData.localHospedagem,
    "Contato do Local": formData.contatoLocal,

    // Seção 3: Identificação do indivíduo
    "Nome do Paciente": formData.paciente,
    "Nome da Mãe": formData.nomeMae,
    "Data de Nascimento": formatDate(formData.dataNascimento),
    "Idade": formData.idade,
    "CPF": formData.cpf,
    "Identidade de Gênero": getIdentidadeGeneroLabel(formData.identidadeGenero),
    "Gestante": formData.gestante ? getGestanteLabel(formData.gestante) : "Não aplicável",
    "Raça": getRacaLabel(formData.raca),
    "Escolaridade": getEscolaridadeLabel(formData.escolaridade),
    "Profissão": formData.profissao,
    "Contato Telefônico": formData.contatoTelefonico,

    // Seção 4: Informações do atendimento
    "Tipo de Atendimento": getTipoAtendimentoLabel(formData.tipoAtendimento),
    "Sinais e Sintomas": Array.isArray(formData.sinaisESintomas) ? getSintomasLabels(formData.sinaisESintomas) : "",
    "Data de Início dos Sintomas": formatDate(formData.dataInicioSintomas),
    "Observação dos Sintomas": formData.observacaoSintomas,
    "Hipótese Diagnóstica": Array.isArray(formData.hipoteseDiagnostica) ? getHipoteseDiagLabels(formData.hipoteseDiagnostica) : "",
    "Observação da Hipótese": formData.observacaoHipotese,
    "Tipo de Trauma": Array.isArray(formData.tipoTrauma) ? getTraumaLabels(formData.tipoTrauma) : "",
    "Data da Ocorrência": formatDate(formData.dataOcorrencia),
    "Observação do Trauma": formData.observacaoTrauma,
    "Relacionado a Surto": formData.relacionadoSurto === "1" ? "Sim" : formData.relacionadoSurto === "2" ? "Não" : "",
    "Observação do Incidente": formData.observacaoIncidente,

    // Seção 5: Informações da unidade notificadora
    "Data do Atendimento": formatDate(formData.dataAtendimento),
    "Unidade Notificadora": formData.unidadeNotificadora,
    "Nome do Notificador": formData.nomeNotificador,
    "Contato do Notificador": formData.contatoNotificador,

    // Seção 6: Encerramento do Caso
    "Data de Encerramento": formatDate(formData.dataEncerramento),
    "Tipo de Encerramento": getTipoEncerramentoLabel(formData.tipoEncerramento),
    "Local de Encaminhamento": formData.localEncaminhamento,
  };
};

// Generate filename with patient info and date
const generateFilename = (formData: FormData, extension: string): string => {
  const patientName = formData.paciente 
    ? formData.paciente.replace(/\s+/g, '_').substring(0, 20) 
    : 'Paciente';
  const date = new Date().toISOString().split('T')[0];
  return `Notificacao_${patientName}_${date}.${extension}`;
};

// Export to Excel format
export const exportToExcel = (formData: FormData, exportOptions?: ExportOptions): boolean => {
  try {
    const data = prepareDataForExport(formData, exportOptions);
    
    // Convert data to CSV format first (Excel can open this)
    let csvContent = "\uFEFF"; // BOM for Excel to handle UTF-8 correctly
    
    // Add each field as a row
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        csvContent += `${key};${value}\n`;
      }
    });
    
    // Create the download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = generateFilename(formData, "xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw error;
  }
};

// Export to CSV format
export const exportToCSV = (formData: FormData, exportOptions?: ExportOptions): boolean => {
  try {
    const data = prepareDataForExport(formData, exportOptions);
    
    // Create CSV content
    let csvContent = "Campo,Valor\n";
    
    // Add each field as a row
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Escape quotes in values
        const escapedValue = String(value).replace(/"/g, '""');
        csvContent += `"${key}","${escapedValue}"\n`;
      }
    });
    
    // Create the download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = generateFilename(formData, "csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    throw error;
  }
};

// Export to Word format
export const exportToWord = (formData: FormData, exportOptions?: ExportOptions): boolean => {
  try {
    const data = prepareDataForExport(formData, exportOptions);
    
    // Create HTML content for Word
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Formulário de Notificação</title>
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { color: #2563EB; text-align: center; }
          .section { margin-top: 20px; }
          .section-title { background-color: #EFF6FF; padding: 5px; color: #1E40AF; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; border: 1px solid #ddd; }
          th { background-color: #f2f2f2; font-weight: bold; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Formulário de Notificação</h1>
        
        <table>
          <tr>
            <th style="width: 30%;">Campo</th>
            <th style="width: 70%;">Valor</th>
          </tr>
    `;
    
    // Add each field as a row
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        htmlContent += `
          <tr>
            <td>${key}</td>
            <td>${value}</td>
          </tr>
        `;
      }
    });
    
    htmlContent += `
        </table>
      </body>
      </html>
    `;
    
    // Create the download link
    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = generateFilename(formData, "doc");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Error exporting to Word:", error);
    throw error;
  }
};

// Export to PDF format (FIXED VERSION)
const advancedTextProcessor = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  
  return String(value)
    // Separação de palavras complexas
    .replace(/([a-zÀ-ú])([A-ZÀ-Ú])/g, '$1 $2')          // CamelCase para espaços
    .replace(/([A-ZÀ-Ú]{2,})([A-ZÀ-Ú][a-zà-ú])/g, '$1 $2') // Siglas + palavras
    .replace(/(\d+)([A-Za-zÀ-ú]+)/gi, '$1 $2')          // Números antes de texto
    .replace(/([A-Za-zÀ-ú]+)(\d+)/gi, '$1 $2')          // Texto antes de números
    .replace(/([:])(\S)/g, '$1 $2')                     // Espaço após dois pontos
    .replace(/(\s{2,})/g, ' ')                          // Remove espaços múltiplos
    .trim();
};

// Função de exportação atualizada
export const exportToPDF = (formData: FormData, exportOptions?: ExportOptions): boolean => {
  try {
    const rawData = prepareDataForExport(formData, exportOptions);
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let currentY = margin + 20;

    // Configurações globais
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Função para adicionar cabeçalho
    const addHeader = () => {
      doc.setFillColor(70, 130, 180); // Azul
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255);
      doc.text('FORMULÁRIO DE NOTIFICAÇÃO', pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(10);
    };

    // Função para adicionar seções
    const addSection = (title: string, fields: string[]) => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(70, 130, 180); // Azul
      doc.text(title.toUpperCase(), margin, currentY);
      currentY += 15;

      doc.setDrawColor(200);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 20;

      const data = fields
        .filter(field => rawData[field])
        .map(field => ({
          label: advancedTextProcessor(field),
          value: advancedTextProcessor(rawData[field])
        }));

      if (data.length === 0) return;

      doc.autoTable({
        startY: currentY,
        head: [['Campo', 'Valor']],
        body: data.map(item => [item.label, item.value]),
        margin: { left: margin, right: margin },
        styles: {
          font: 'helvetica',
          fontSize: 10,
          cellPadding: 6,
          overflow: 'linebreak',
          valign: 'middle'
        },
        headStyles: {
          fillColor: [245, 245, 245],
          textColor: 70,
          fontStyle: 'bold',
          lineWidth: 0.3
        },
        bodyStyles: {
          lineWidth: 0.3,
          lineColor: 200
        },
        columnStyles: {
          0: { 
            cellWidth: 120,
            fontStyle: 'bold',
            textColor: 70
          },
          1: { 
            cellWidth: 'auto',
            textColor: 40
          }
        },
        theme: 'grid',
        didDrawPage: (data) => {
          if (data.cursor) {
            currentY = data.cursor.y + 15;
          }
        }
      });
    };

    // Adiciona cabeçalho
    addHeader();

    // Adiciona conteúdo principal
    addSection('1. Dados Gerais', ['Evento', 'Público Atendido']);
    addSection('2. Procedência', [
      'Residente em Belém', 'Bairro', 'Município', 'UF', 
      'País de Procedência', 'Local de Hospedagem', 'Contato do Local'
    ]);
    addSection('3. Identificação', [
      'Nome do Paciente', 'Nome da Mãe', 'Data de Nascimento', 'Idade', 
      'CPF', 'Identidade de Gênero', 'Gestante', 'Raça', 'Escolaridade', 
      'Profissão', 'Contato Telefônico'
    ]);
    addSection('4. Atendimento', [
      'Tipo de Atendimento', 'Sinais e Sintomas', 'Data de Início dos Sintomas',
      'Observação dos Sintomas', 'Hipótese Diagnóstica', 'Observação da Hipótese',
      'Tipo de Trauma', 'Data da Ocorrência', 'Observação do Trauma', 
      'Relacionado a Surto', 'Observação do Incidente'
    ]);
    addSection('5. Unidade Notificadora', [
      'Data do Atendimento', 'Unidade Notificadora', 
      'Nome do Notificador', 'Contato do Notificador'
    ]);
    addSection('6. Encerramento', [
      'Data de Encerramento', 'Tipo de Encerramento', 'Local de Encaminhamento'
    ]);

    // Adiciona footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${i} de ${totalPages}`,
        pageWidth - margin,
        doc.internal.pageSize.getHeight() - 15,
        { align: 'right' }
      );
    }

    // Salvar PDF
    doc.save(generateFilename(formData, 'pdf'));
    return true;
  } catch (error) {
    console.error("Erro na geração do PDF:", error);
    return false;
  }
};

// Export to PNG format (FIXED VERSION)
export const exportToPNG = (formData: FormData, exportOptions?: ExportOptions): boolean => {
  try {
    const data = prepareDataForExport(formData, exportOptions);
    
    // Create a temporary container to render the content
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '800px'; // Fixed width for consistent rendering
    
    // Create HTML content for PNG with improved layout
    let htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: white;">
        <h1 style="color: #2563EB; text-align: center; margin-bottom: 20px;">Formulário de Notificação</h1>
    `;
    
    // Group fields by sections
    const sections = {
      "1. Dados Gerais": ["Evento", "Público Atendido"],
      "2. Procedência do indivíduo": ["Residente em Belém", "Bairro", "Município", "UF", "País de Procedência", "Local de Hospedagem", "Contato do Local"],
      "3. Identificação do indivíduo": ["Nome do Paciente", "Nome da Mãe", "Data de Nascimento", "Idade", "CPF", "Identidade de Gênero", "Gestante", "Raça", "Escolaridade", "Profissão", "Contato Telefônico"],
      "4. Informações do atendimento": ["Tipo de Atendimento", "Sinais e Sintomas", "Data de Início dos Sintomas", "Observação dos Sintomas", "Hipótese Diagnóstica", "Observação da Hipótese", "Tipo de Trauma", "Data da Ocorrência", "Observação do Trauma", "Relacionado a Surto", "Observação do Incidente"],
      "5. Informações da unidade notificadora": ["Data do Atendimento", "Unidade Notificadora", "Nome do Notificador", "Contato do Notificador"],
      "6. Encerramento do Caso": ["Data de Encerramento", "Tipo de Encerramento", "Local de Encaminhamento"]
    };
    
    // Add each section
    Object.entries(sections).forEach(([sectionTitle, fields]) => {
      htmlContent += `
        <div style="background-color: #4682B4; color: white; padding: 8px; margin: 15px 0 10px 0; font-weight: bold; border-radius: 4px;">
          ${sectionTitle}
        </div>
      `;
      
      // Add fields in this section
      fields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null && data[field] !== "") {
          htmlContent += `
            <div style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; overflow: hidden;">
              <div style="float: left; font-weight: bold; width: 200px; padding-right: 10px;">${field}:</div>
              <div style="float: left; margin-left: 10px;">${data[field]}</div>
              <div style="clear: both;"></div>
            </div>
          `;
        }
      });
    });
    
    htmlContent += `</div>`;
    
    container.innerHTML = htmlContent;
    document.body.appendChild(container);
    
    // Use html2canvas para converter HTML para canvas
    html2canvas(container).then(canvas => {
      // Remove the temporary container
      document.body.removeChild(container);
      
      // Converter canvas para PNG e iniciar download
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = generateFilename(formData, 'png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }).catch(error => {
      console.error("Error converting to PNG:", error);
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    });
    
    return true;
  } catch (error) {
    console.error("Error exporting to PNG:", error);
    throw error;
  }
};