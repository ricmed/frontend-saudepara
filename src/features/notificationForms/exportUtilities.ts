import { FormData } from './NotificationForm';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { 
  EventoOption, 
  PublicoOption,
  PaisOption,
  EstadoOption,
  MunicipioOption,
  BairroOption,
  GeneroOption,
  RacaOption,
  EscolaridadeOption,
  AtendimentoOption,
  SintomaOption,
  HipoteseDiagOption,
  TraumaOption,
  EstabelecimentoOption,
  EncerramentoOption
} from '@/services/NotificacaoService';

// Interface para passar opções carregadas dinamicamente
export interface ExportOptions {
  eventoOptions: EventoOption[];
  publicoOptions: PublicoOption[];
  paisOptions: PaisOption[];
  estadoOptions: EstadoOption[];
  municipioOptions: MunicipioOption[];
  bairroOptions: BairroOption[];
  generoOptions: GeneroOption[];
  racaOptions: RacaOption[];
  escolaridadeOptions: EscolaridadeOption[];
  atendimentoOptions: AtendimentoOption[];
  sintomaOptions: SintomaOption[];
  hipoteseDiagOptions: HipoteseDiagOption[];
  traumaOptions: TraumaOption[];
  estabelecimentoOptions: EstabelecimentoOption[];
  encerramentoOptions: EncerramentoOption[];
}

// Função auxiliar para converter objetos em texto legível
const formatFormDataForExport = (
  formData: FormData, 
  options?: ExportOptions
): Record<string, string> => {
  // Se não temos opções carregadas, usamos mapeamentos básicos
  const getPublicoAtendidoText = (id: string): string => {
    if (options?.publicoOptions) {
      const option = options.publicoOptions.find(o => o.idtipo_publico.toString() === id);
      if (option) return option.descricao;
    }
    
    // Fallback para mapeamento básico
    const mapping: Record<string, string> = {
      "1": "Visitante",
      "2": "Trabalhador",
      "3": "Autoridade"
    };
    return mapping[id] || id;
  };

  const getResidenteBelemText = (id: string): string => {
    // Este é um caso especial que provavelmente não tem opção no backend
    const mapping: Record<string, string> = {
      "1": "SIM",
      "2": "NÃO",
      "3": "ESTRANGEIRO"
    };
    return mapping[id] || id;
  };

  const getTipoAtendimentoText = (id: string): string => {
    if (options?.atendimentoOptions) {
      const option = options.atendimentoOptions.find(o => o.idtipo_atendimento.toString() === id);
      if (option) return option.descricao;
    }
    
    // Fallback para mapeamento básico
    const mapping: Record<string, string> = {
      "1": "Clínico",
      "2": "Trauma",
      "3": "Surto",
      "4": "Múltiplas vítimas",
      "5": "Incidente QBRN"
    };
    return mapping[id] || id;
  };

  const getTipoEncerramentoText = (id: string): string => {
    if (options?.encerramentoOptions) {
      const option = options.encerramentoOptions.find(o => o.idtipo_encerramento.toString() === id);
      if (option) return option.descricao;
    }
    
    // Fallback para mapeamento básico
    const mapping: Record<string, string> = {
      "1": "Atendido e liberado",
      "2": "Internação",
      "3": "Observação",
      "4": "Transferido",
      "5": "Óbito"
    };
    return mapping[id] || id;
  };
  
  // Funções adicionais para mapear outros tipos de valores
  const getEventoText = (id: string): string => {
    if (options?.eventoOptions) {
      const option = options.eventoOptions.find(o => o.idtipo_evento.toString() === id);
      if (option) return option.descricao;
    }
    return id;
  };
  
  const getPaisText = (id: string): string => {
    if (options?.paisOptions) {
      const option = options.paisOptions.find(o => o.idtipo_pais.toString() === id);
      if (option) return option.descricao;
    }
    return id;
  };
  
  const getEstadoText = (id: string): string => {
    if (options?.estadoOptions) {
      const option = options.estadoOptions.find(o => o.idtipo_estado.toString() === id);
      if (option) return option.descricao;
    }
    return id;
  };
  
  const getMunicipioText = (id: string): string => {
    if (options?.municipioOptions) {
      const option = options.municipioOptions.find(o => o.idtipo_municipio.toString() === id);
      if (option) return option.descricao;
    }
    return id;
  };
  
  const getBairroText = (id: string): string => {
    if (options?.bairroOptions) {
      const option = options.bairroOptions.find(o => o.idbairro.toString() === id);
      if (option) return option.descricao;
    }
    return id;
  };
  
  const getGeneroText = (id: string): string => {
    if (options?.generoOptions) {
      const option = options.generoOptions.find(o => o.idtipo_genero.toString() === id);
      if (option) return option.descricao;
    }
    return id;
  };
  
  const getRacaText = (id: string): string => {
    if (options?.racaOptions) {
      const option = options.racaOptions.find(o => o.idtipo_raca.toString() === id);
      if (option) return option.descricao;
    }
    return id;
  };
  
  const getEscolaridadeText = (id: string): string => {
    if (options?.escolaridadeOptions) {
      const option = options.escolaridadeOptions.find(o => o.idtipo_escolaridade.toString() === id);
      if (option) return option.descricao;
    }
    return id;
  };
  
  const getEstabelecimentoText = (id: string): string => {
    if (options?.estabelecimentoOptions) {
      const option = options.estabelecimentoOptions.find(o => o.idestabelecimento.toString() === id);
      if (option) return option.descricao;
    }
    return id;
  };

  // Formatação de data DD/MM/YYYY
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateStr;
    }
  };

  // Criar objeto para exportação
  // Formatação dos sinais e sintomas
  const getSintomasText = (): string => {
    if (!formData.sinaisESintomas.length) return "";
    
    if (options?.sintomaOptions) {
      return formData.sinaisESintomas
        .map(id => {
          const sintoma = options.sintomaOptions.find(s => s.idtipo_sintoma.toString() === id);
          return sintoma ? sintoma.descricao : id;
        })
        .join(", ");
    }
    
    return formData.sinaisESintomas.join(", ");
  };
  
  // Formatação das hipóteses diagnósticas
  const getHipotesesText = (): string => {
    if (!formData.hipoteseDiagnostica.length) return "";
    
    if (options?.hipoteseDiagOptions) {
      return formData.hipoteseDiagnostica
        .map(id => {
          const hipotese = options.hipoteseDiagOptions.find(h => h.idtipo_hipotese_diag.toString() === id);
          return hipotese ? hipotese.descricao : id;
        })
        .join(", ");
    }
    
    return formData.hipoteseDiagnostica.join(", ");
  };
  
  // Formatação dos tipos de trauma
  const getTraumasText = (): string => {
    if (!formData.tipoTrauma.length) return "";
    
    if (options?.traumaOptions) {
      return formData.tipoTrauma
        .map(id => {
          const trauma = options.traumaOptions.find(t => t.idtipo_trauma.toString() === id);
          return trauma ? trauma.descricao : id;
        })
        .join(", ");
    }
    
    return formData.tipoTrauma.join(", ");
  };

  return {
    "Evento": getEventoText(formData.evento),
    "Público Atendido": getPublicoAtendidoText(formData.publicoAtendido),
    "Residente em Belém": getResidenteBelemText(formData.residenteBelem),
    "Bairro": formData.residenteBelem === "1" ? getBairroText(formData.bairro) : formData.bairro,
    "Município": formData.residenteBelem === "2" ? getMunicipioText(formData.municipio) : formData.municipio,
    "UF": formData.residenteBelem === "2" ? getEstadoText(formData.uf) : formData.uf,
    "País de Procedência": formData.residenteBelem === "3" ? getPaisText(formData.paisProcedencia) : formData.paisProcedencia,
    "Local de Hospedagem": formData.localHospedagem,
    "Contato do Local": formData.contatoLocal,
    "Paciente": formData.paciente,
    "Nome da Mãe": formData.nomeMae,
    "Data de Nascimento": formatDate(formData.dataNascimento),
    "Idade": formData.idade,
    "CPF": formData.cpf,
    "Identidade de Gênero": getGeneroText(formData.identidadeGenero),
    "Gestante": formData.gestante === "1" ? "Sim" : "Não",
    "Raça": getRacaText(formData.raca),
    "Escolaridade": getEscolaridadeText(formData.escolaridade),
    "Profissão": formData.profissao, // Ideal seria mapear pelo CBO
    "Contato Telefônico": formData.contatoTelefonico,
    "Tipo de Atendimento": getTipoAtendimentoText(formData.tipoAtendimento),
    "Sinais e Sintomas": getSintomasText(),
    "Data de Início dos Sintomas": formatDate(formData.dataInicioSintomas),
    "Observação dos Sintomas": formData.observacaoSintomas,
    "Hipótese Diagnóstica": getHipotesesText(),
    "Observação da Hipótese": formData.observacaoHipotese,
    "Tipo de Trauma": getTraumasText(),
    "Data da Ocorrência": formatDate(formData.dataOcorrencia),
    "Observação do Trauma": formData.observacaoTrauma,
    "Relacionado a Surto": formData.relacionadoSurto === "1" ? "Sim" : "Não",
    "Observação do Incidente": formData.observacaoIncidente,
    "Data do Atendimento": formatDate(formData.dataAtendimento),
    "Unidade Notificadora": getEstabelecimentoText(formData.unidadeNotificadora),
    "Nome do Notificador": formData.nomeNotificador,
    "Contato do Notificador": formData.contatoNotificador,
    "Data de Encerramento": formatDate(formData.dataEncerramento),
    "Tipo de Encerramento": getTipoEncerramentoText(formData.tipoEncerramento),
    "Local de Encaminhamento": formData.localEncaminhamento
      ? (formData.tipoEncerramento === "5" 
          ? (formData.localEncaminhamento === "1" ? "SVO" : 
             formData.localEncaminhamento === "2" ? "IML" : 
             formData.localEncaminhamento === "3" ? "Ignorado" : formData.localEncaminhamento)
          : getEstabelecimentoText(formData.localEncaminhamento))
      : ""
  };
};

// Exportar para Excel
export const exportToExcel = (formData: FormData, options?: ExportOptions): void => {
  try {
    const formattedData = formatFormDataForExport(formData, options);
    
    // Converter em formato de planilha
    const worksheet = XLSX.utils.json_to_sheet([formattedData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Notificação");
    
    // Ajustar larguras das colunas
    const colWidths = Object.keys(formattedData).map(key => ({
      wch: Math.max(key.length, String(formattedData[key]).length, 15)
    }));
    worksheet['!cols'] = colWidths;
    
    // Gerar arquivo
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    
    // Criar nome de arquivo limpo (removendo caracteres problemáticos)
    const cleanFileName = (formData.paciente || 'Dados')
      .replace(/[\\/:*?"<>|]/g, '')
      .substring(0, 30);
    
    // Criar URL e link para download
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Notificacao_${cleanFileName}.xlsx`;
    link.click();
    
    // Limpar recursos
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      link.remove();
    }, 100);
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    alert('Erro ao exportar para Excel. Verifique o console para mais detalhes.');
  }
};

// Exportar para CSV
export const exportToCSV = (formData: FormData, options?: ExportOptions): void => {
  try {
    const formattedData = formatFormDataForExport(formData, options);
    
    // Converter objeto em linhas de CSV
    const headers = Object.keys(formattedData).join(',');
    const values = Object.values(formattedData)
      .map(value => `"${String(value).replace(/"/g, '""')}"`)
      .join(',');
    
    const csvContent = `${headers}\n${values}`;
    
    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Criar nome de arquivo limpo (removendo caracteres problemáticos)
    const cleanFileName = (formData.paciente || 'Dados')
      .replace(/[\\/:*?"<>|]/g, '')
      .substring(0, 30);
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Notificacao_${cleanFileName}.csv`;
    link.click();
    
    // Limpar recursos
    setTimeout(() => {
      URL.revokeObjectURL(url);
      link.remove();
    }, 100);
  } catch (error) {
    console.error('Erro ao exportar para CSV:', error);
    alert('Erro ao exportar para CSV. Verifique o console para mais detalhes.');
  }
};

// Exportar para Word
export const exportToWord = (formData: FormData, options?: ExportOptions): void => {
  try {
    const formattedData = formatFormDataForExport(formData, options);
    
    // Criar conteúdo HTML para Word
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Notificação - ${formData.paciente || 'Dados'}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          h1 { text-align: center; }
          .section { margin-top: 20px; }
          .section-title { background-color: #4472C4; color: white; padding: 5px; }
        </style>
      </head>
      <body>
        <h1>Formulário de Notificação</h1>
    `;

    // Dividir por seções
    const sections = {
      "1. Dados Gerais": ["Evento", "Público Atendido"],
      "2. Procedência do indivíduo": ["Residente em Belém", "Bairro", "Município", "UF", "País de Procedência", "Local de Hospedagem", "Contato do Local"],
      "3. Identificação do indivíduo": ["Paciente", "Nome da Mãe", "Data de Nascimento", "Idade", "CPF", "Identidade de Gênero", "Gestante", "Raça", "Escolaridade", "Profissão", "Contato Telefônico"],
      "4. Informações do atendimento": ["Tipo de Atendimento", "Sinais e Sintomas", "Data de Início dos Sintomas", "Observação dos Sintomas", "Hipótese Diagnóstica", "Observação da Hipótese", "Tipo de Trauma", "Data da Ocorrência", "Observação do Trauma", "Relacionado a Surto", "Observação do Incidente"],
      "5. Informações da unidade notificadora": ["Data do Atendimento", "Unidade Notificadora", "Nome do Notificador", "Contato do Notificador"],
      "6. Encerramento do Caso": ["Data de Encerramento", "Tipo de Encerramento", "Local de Encaminhamento"]
    };

    // Adicionar cada seção ao HTML
    Object.entries(sections).forEach(([title, fields]) => {
      htmlContent += `
        <div class="section">
          <h2 class="section-title">${title}</h2>
          <table>
      `;
      
      fields.forEach(field => {
        if (formattedData[field]) {
          htmlContent += `
            <tr>
              <th>${field}</th>
              <td>${formattedData[field]}</td>
            </tr>
          `;
        }
      });
      
      htmlContent += `
          </table>
        </div>
      `;
    });

    htmlContent += `
      </body>
      </html>
    `;

    // Criar blob e link para download
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Notificacao_${formData.paciente || 'Dados'}.doc`;
    link.click();
    
    // Limpar recursos
    setTimeout(() => {
      URL.revokeObjectURL(url);
      link.remove();
    }, 100);
  } catch (error) {
    console.error('Erro ao exportar para Word:', error);
    alert('Erro ao exportar para Word. Verifique o console para mais detalhes.');
  }
};

// Exportar para PDF
export const exportToPDF = (formData: FormData, options?: ExportOptions): void => {
  try {
    const formattedData = formatFormDataForExport(formData, options);
    
    // Criar documento PDF
    const doc = new jsPDF();
    
    // Configurações do documento
    doc.setFont('helvetica');
    doc.setFontSize(20);
    doc.text('Formulário de Notificação', 105, 15, { align: 'center' });
    
    // Dividir por seções
    const sections = {
      "1. Dados Gerais": ["Evento", "Público Atendido"],
      "2. Procedência do indivíduo": ["Residente em Belém", "Bairro", "Município", "UF", "País de Procedência", "Local de Hospedagem", "Contato do Local"],
      "3. Identificação do indivíduo": ["Paciente", "Nome da Mãe", "Data de Nascimento", "Idade", "CPF", "Identidade de Gênero", "Gestante", "Raça", "Escolaridade", "Profissão", "Contato Telefônico"],
      "4. Informações do atendimento": ["Tipo de Atendimento", "Sinais e Sintomas", "Data de Início dos Sintomas", "Observação dos Sintomas", "Hipótese Diagnóstica", "Observação da Hipótese", "Tipo de Trauma", "Data da Ocorrência", "Observação do Trauma", "Relacionado a Surto", "Observação do Incidente"],
      "5. Informações da unidade notificadora": ["Data do Atendimento", "Unidade Notificadora", "Nome do Notificador", "Contato do Notificador"],
      "6. Encerramento do Caso": ["Data de Encerramento", "Tipo de Encerramento", "Local de Encaminhamento"]
    };

    let yPos = 30;
    const lineHeight = 7;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - (2 * margin);
    
    // Função para verificar se precisa nova página
    const checkNewPage = (heightNeeded: number) => {
      if (yPos + heightNeeded > 280) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };

    // Adicionar cada seção ao PDF
    Object.entries(sections).forEach(([title, fields]) => {
      checkNewPage(10);
      
      // Adicionar título da seção
      doc.setFillColor(68, 114, 196);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.rect(margin, yPos, contentWidth, 8, 'F');
      doc.text(title, margin + 2, yPos + 5.5);
      yPos += 10;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      // Adicionar campos
      fields.forEach(field => {
        if (formattedData[field]) {
          checkNewPage(lineHeight);
          
          // Quebrar texto longo
          const value = formattedData[field] || '';
          const maxWidth = contentWidth - 60;
          
          if (doc.getTextWidth(value) > maxWidth) {
            // Para textos longos, usar splitTextToSize
            const fieldName = field + ': ';
            doc.setFont('helvetica', 'bold');
            doc.text(fieldName, margin, yPos);
            
            doc.setFont('helvetica', 'normal');
            const textLines = doc.splitTextToSize(value, maxWidth);
            doc.text(textLines, margin + doc.getTextWidth(fieldName), yPos);
            
            yPos += (textLines.length * lineHeight);
          } else {
            // Para textos curtos, colocar na mesma linha
            doc.setFont('helvetica', 'bold');
            doc.text(field + ': ', margin, yPos);
            
            doc.setFont('helvetica', 'normal');
            doc.text(value, margin + doc.getTextWidth(field + ': '), yPos);
            
            yPos += lineHeight;
          }
        }
      });
      
      yPos += 5; // Espaço entre seções
    });
    
    // Salvar PDF
    doc.save(`Notificacao_${formData.paciente || 'Dados'}.pdf`);
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error);
    alert('Erro ao exportar para PDF. Verifique o console para mais detalhes.');
  }
};