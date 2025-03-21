// exportUtilities.ts
// Utility functions for exporting notification form data to different formats
import { FormData } from "@/features/notificationForms/components/types";

interface ExportData {
  [key: string]: string | number | boolean | undefined;
}

// Helper function to format form data for export
const prepareDataForExport = (formData: FormData): ExportData => {
  // Convert enum values to their readable labels
  const getPublicoAtendidoLabel = (value: string): string => {
    const map: Record<string, string> = { "1": "Visitante", "2": "Trabalhador", "3": "Autoridade" };
    return map[value] || value;
  };

  const getResidenteBelemLabel = (value: string): string => {
    const map: Record<string, string> = { "1": "SIM", "2": "NÃO", "3": "ESTRANGEIRO" };
    return map[value] || value;
  };

  const getIdentidadeGeneroLabel = (value: string): string => {
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
    const map: Record<string, string> = {
      "1": "Branca", "2": "Preta", "3": "Amarela", "4": "Parda",
      "5": "Indígena", "9": "Ignorado"
    };
    return map[value] || value;
  };

  const getEscolaridadeLabel = (value: string): string => {
    const map: Record<string, string> = {
      "0": "Analfabeto", "1": "Ensino fundamental incompleto", "2": "Ensino fundamental completo",
      "3": "Ensino médio incompleto", "4": "Ensino médio completo", "5": "Ensino superior incompleto",
      "8": "Ensino superior completo", "9": "Pós-graduado", "10": "Ignorado", "11": "Não se aplica"
    };
    return map[value] || value;
  };

  const getTipoAtendimentoLabel = (value: string): string => {
    const map: Record<string, string> = {
      "1": "Clínico", "2": "Trauma", "3": "Surto",
      "4": "Múltiplas vítimas", "5": "Incidente QBRN"
    };
    return map[value] || value;
  };

  const getTipoEncerramentoLabel = (value: string): string => {
    const map: Record<string, string> = {
      "1": "Atendido e liberado", "2": "Internação", "3": "Observação",
      "4": "Transferido", "5": "Óbito"
    };
    return map[value] || value;
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
    "Evento": formData.evento,
    "Público Atendido": getPublicoAtendidoLabel(formData.publicoAtendido),

    // Seção 2: Procedência do indivíduo
    "Residente em Belém": getResidenteBelemLabel(formData.residenteBelem),
    "Bairro": formData.bairro,
    "Município": formData.municipio,
    "UF": formData.uf,
    "País de Procedência": formData.paisProcedencia,
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
    "Sinais e Sintomas": Array.isArray(formData.sinaisESintomas) ? formData.sinaisESintomas.join(", ") : "",
    "Data de Início dos Sintomas": formatDate(formData.dataInicioSintomas),
    "Observação dos Sintomas": formData.observacaoSintomas,
    "Hipótese Diagnóstica": Array.isArray(formData.hipoteseDiagnostica) ? formData.hipoteseDiagnostica.join(", ") : "",
    "Observação da Hipótese": formData.observacaoHipotese,
    "Tipo de Trauma": Array.isArray(formData.tipoTrauma) ? formData.tipoTrauma.join(", ") : "",
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
export const exportToExcel = (formData: FormData): boolean => {
  try {
    const data = prepareDataForExport(formData);
    
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
export const exportToCSV = (formData: FormData): boolean => {
  try {
    const data = prepareDataForExport(formData);
    
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
export const exportToWord = (formData: FormData): boolean => {
  try {
    const data = prepareDataForExport(formData);
    
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

// Export to PDF format
export const exportToPDF = (formData: FormData): boolean => {
  try {
    const data = prepareDataForExport(formData);
    
    // Create HTML content for PDF
    let htmlContent = `
      <html>
      <head>
        <meta charset="utf-8">
        <title>Formulário de Notificação</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2563EB; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 8px; border: 1px solid #ddd; }
          th { background-color: #f2f2f2; font-weight: bold; text-align: left; }
          @media print {
            body { margin: 0.5cm; }
            h1 { font-size: 14pt; }
            table { font-size: 10pt; }
          }
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
    
    // Open a new window for printing to PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error("Could not open print window. Please check if pop-up blocker is enabled.");
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Set document title (for the PDF filename)
    printWindow.document.title = generateFilename(formData, "pdf").replace('.pdf', '');
    
    // Print after the content is loaded
    setTimeout(() => {
      printWindow.print();
      // Close the window after print dialog is closed
      setTimeout(() => printWindow.close(), 300);
    }, 500);
    
    return true;
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    throw error;
  }
};