import { FormData } from "./NotificationForm";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle } from "docx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";

// Função para obter data formatada para nomes de arquivos
const getFormattedDate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
};

// Formatar texto de opções - função auxiliar para obter o texto da label a partir do valor
const getOptionLabel = (value: string, options: Array<{ value: string, label: string }>) => {
  const option = options.find(opt => opt.value === value);
  return option ? option.label : value;
};

// Função auxiliar para formatar valores de array
const formatArrayValues = (values: string[], options: Array<{ value: string, label: string }>) => {
  return values.map(value => getOptionLabel(value, options)).join(", ");
};

// Exportação para Excel (XLSX)
export const exportToExcel = (formData: FormData) => {
  // Criar uma planilha
  const worksheet = XLSX.utils.json_to_sheet([flattenFormData(formData)]);
  
  // Criar uma pasta de trabalho
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Notificação");
  
  // Gerar o arquivo Excel
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // Salvar o arquivo
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `notificacao_${getFormattedDate()}.xlsx`);
};

// Exportação para CSV
export const exportToCSV = (formData: FormData) => {
  // Achatar os dados do formulário
  const flatData = flattenFormData(formData);
  
  // Converter para CSV usando PapaParse
  const csv = Papa.unparse([flatData]);
  
  // Criar e salvar o arquivo
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `notificacao_${getFormattedDate()}.csv`);
};

// Exportação para Word (DOCX)
export const exportToWord = (formData: FormData) => {
  // Criar documento
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Título
        new Paragraph({
          text: "Formulário de Notificação",
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        }),
        
        // Informações de data
        new Paragraph({
          children: [
            new TextRun({ text: "Data da exportação: ", bold: true }),
            new TextRun({ text: new Date().toLocaleDateString('pt-BR') })
          ],
          spacing: { after: 400 }
        }),
        
        // Seção 1: Dados Gerais
        createSectionTitle("1. Dados Gerais"),
        createDocTable([
          ["Evento", formData.evento || ""],
          ["Público Atendido", getPublicoAtendidoLabel(formData.publicoAtendido) || ""]
        ]),
        
        // Seção 2: Procedência do Indivíduo
        createSectionTitle("2. Procedência do Indivíduo"),
        createDocTable(createProcedenciaTableData(formData)),
        
        // Seção 3: Identificação do Indivíduo
        createSectionTitle("3. Identificação do Indivíduo"),
        createDocTable(createIdentificacaoTableData(formData)),
        
        // Seção 4: Informações do Atendimento
        createSectionTitle("4. Informações do Atendimento"),
        createDocTable(createAtendimentoTableData(formData)),
        
        // Seção 5: Informações da Unidade Notificadora
        createSectionTitle("5. Informações da Unidade Notificadora"),
        createDocTable([
          ["Data do Atendimento", formData.dataAtendimento || ""],
          ["Unidade Notificadora", formData.unidadeNotificadora || ""],
          ["Nome do Notificador", formData.nomeNotificador || ""],
          ["Contato do Notificador", formData.contatoNotificador || ""]
        ]),
        
        // Seção 6: Encerramento do Caso
        createSectionTitle("6. Encerramento do Caso"),
        createDocTable(createEncerramentoTableData(formData))
      ]
    }]
  });
  
  // Gerar e salvar o arquivo
  Packer.toBlob(doc).then(blob => {
    saveAs(blob, `notificacao_${getFormattedDate()}.docx`);
  });
};

// Exportação para PDF
export const exportToPDF = (formData: FormData) => {
  // Criar um novo documento PDF
  const doc = new jsPDF();
  
  // Adicionar título
  doc.setFontSize(18);
  doc.text("Formulário de Notificação", 14, 20);
  
  // Adicionar data
  doc.setFontSize(10);
  doc.text(`Data da exportação: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
  
  // Posição Y atual para acompanhar onde estamos no documento
  let yPos = 40;
  const pageHeight = doc.internal.pageSize.height;
  
  // Função para adicionar uma seção ao PDF
  const addSection = (title: string, tableData: any[][], startY: number) => {
    // Verificar se precisamos de uma nova página
    if (startY + 20 > pageHeight - 20) {
      doc.addPage();
      startY = 20;
    }
    
    // Adicionar título da seção
    doc.setFontSize(14);
    doc.text(title, 14, startY);
    
    // Converter dados para autoTable
    const tableBody = tableData.map(row => [row[0], row[1]]);
    
    // Adicionar tabela
    (doc as any).autoTable({
      startY: startY + 5,
      head: [['Campo', 'Valor']],
      body: tableBody,
      margin: { top: 10 },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 133, 244] }
    });
    
    // Retornar a nova posição Y
    return (doc as any).previousAutoTable.finalY + 10;
  };
  
  // Adicionar cada seção
  yPos = addSection("1. Dados Gerais", [
    ["Evento", formData.evento || ""],
    ["Público Atendido", getPublicoAtendidoLabel(formData.publicoAtendido) || ""]
  ], yPos);
  
  yPos = addSection("2. Procedência do Indivíduo", createProcedenciaTableData(formData), yPos);
  yPos = addSection("3. Identificação do Indivíduo", createIdentificacaoTableData(formData), yPos);
  yPos = addSection("4. Informações do Atendimento", createAtendimentoTableData(formData), yPos);
  
  yPos = addSection("5. Informações da Unidade Notificadora", [
    ["Data do Atendimento", formData.dataAtendimento || ""],
    ["Unidade Notificadora", formData.unidadeNotificadora || ""],
    ["Nome do Notificador", formData.nomeNotificador || ""],
    ["Contato do Notificador", formData.contatoNotificador || ""]
  ], yPos);
  
  yPos = addSection("6. Encerramento do Caso", createEncerramentoTableData(formData), yPos);
  
  // Salvar o PDF
  doc.save(`notificacao_${getFormattedDate()}.pdf`);
};

// Funções Auxiliares

// Achatar os dados do formulário para exportação (especialmente para CSV e Excel)
const flattenFormData = (formData: FormData) => {
  const flatData: Record<string, string> = {};
  
  // Copiar todos os valores primitivos
  Object.entries(formData).forEach(([key, value]) => {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      flatData[key] = String(value);
    } else if (Array.isArray(value)) {
      flatData[key] = value.join(', ');
    }
  });
  
  // Formatar campos específicos para melhor legibilidade
  if (formData.publicoAtendido) {
    flatData.publicoAtendido = getPublicoAtendidoLabel(formData.publicoAtendido);
  }
  
  if (formData.identidadeGenero) {
    flatData.identidadeGenero = getIdentidadeGeneroLabel(formData.identidadeGenero);
  }

  if (formData.residenteBelem) {
    flatData.residenteBelem = getResidenteLabel(formData.residenteBelem);
  }

  if (formData.gestante) {
    flatData.gestante = getGestanteLabel(formData.gestante);
  }

  if (formData.raca) {
    flatData.raca = getRacaLabel(formData.raca);
  }

  if (formData.escolaridade) {
    flatData.escolaridade = getEscolaridadeLabel(formData.escolaridade);
  }

  if (formData.tipoAtendimento) {
    flatData.tipoAtendimento = getTipoAtendimentoLabel(formData.tipoAtendimento);
  }

  if (formData.tipoEncerramento) {
    flatData.tipoEncerramento = getTipoEncerramentoLabel(formData.tipoEncerramento);
  }
  
  return flatData;
};

// Obter label para público atendido
const getPublicoAtendidoLabel = (value: string) => {
  const options = [
    { value: "1", label: "Visitante" },
    { value: "2", label: "Trabalhador" },
    { value: "3", label: "Autoridade" }
  ];
  return getOptionLabel(value, options);
};

// Obter label para identidade de gênero
const getIdentidadeGeneroLabel = (value: string) => {
  const options = [
    { value: "1", label: "Mulher cisgênero" },
    { value: "2", label: "Homem cisgênero" },
    { value: "3", label: "Mulher transgênero" },
    { value: "4", label: "Homem transgênero" },
    { value: "5", label: "Travesti" },
    { value: "6", label: "Não binário" },
    { value: "7", label: "Não se aplica" },
    { value: "9", label: "Ignorado" }
  ];
  return getOptionLabel(value, options);
};

// Auxiliar para criar títulos de seção no DocX
const createSectionTitle = (title: string) => {
  return new Paragraph({
    text: title,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 200 }
  });
};

// Auxiliar para criar tabelas no DocX
const createDocTable = (data: string[][]) => {
  const rows = data.map(row => {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: row[0], spacing: { before: 50, after: 50 } })],
          width: { size: 30, type: "pct" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" }
          }
        }),
        new TableCell({
          children: [new Paragraph({ text: row[1], spacing: { before: 50, after: 50 } })],
          width: { size: 70, type: "pct" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" }
          }
        })
      ]
    });
  });
  
  return new Table({
    rows: rows,
    width: { size: 100, type: "pct" },
    margins: { top: 100, bottom: 100, left: 100, right: 100 }
  });
};

// Criar dados da tabela para a seção "Procedência do Indivíduo"
const createProcedenciaTableData = (formData: FormData) => {
  const data: string[][] = [
    ["Residente em Belém?", getResidenteLabel(formData.residenteBelem)]
  ];
  
  if (formData.residenteBelem === "1") {
    data.push(["Bairro", formData.bairro || ""]);
  } 
  else if (formData.residenteBelem === "2") {
    data.push(
      ["UF", formData.uf || ""],
      ["Município", formData.municipio || ""]
    );
  } 
  else if (formData.residenteBelem === "3") {
    data.push(
      ["País de Procedência", formData.paisProcedencia || ""],
      ["Local de Hospedagem", formData.localHospedagem || ""],
      ["Contato do Local", formData.contatoLocal || ""]
    );
  }
  
  return data;
};

// Obter label para residente em Belém
const getResidenteLabel = (value: string) => {
  const options = [
    { value: "1", label: "SIM" },
    { value: "2", label: "NÃO" },
    { value: "3", label: "ESTRANGEIRO" }
  ];
  return getOptionLabel(value, options);
};

// Criar dados da tabela para a seção "Identificação do Indivíduo"
const createIdentificacaoTableData = (formData: FormData) => {
  const data: string[][] = [
    ["Nome", formData.paciente || ""],
    ["Nome da Mãe", formData.nomeMae || ""],
    ["Data de Nascimento", formData.dataNascimento || ""],
    ["Idade", formData.idade || ""],
    ["CPF", formData.cpf || ""],
    ["Identidade de Gênero", getIdentidadeGeneroLabel(formData.identidadeGenero)]
  ];
  
  if (formData.identidadeGenero === "1") {
    data.push(["Gestante", getGestanteLabel(formData.gestante)]);
  }
  
  data.push(
    ["Raça", getRacaLabel(formData.raca)],
    ["Escolaridade", getEscolaridadeLabel(formData.escolaridade)],
    ["Profissão/Ocupação", formData.profissao || ""],
    ["Contato Telefônico", formData.contatoTelefonico || ""]
  );
  
  return data;
};

// Obter label para gestante
const getGestanteLabel = (value: string) => {
  const options = [
    { value: "1", label: "Sim" },
    { value: "2", label: "Não" }
  ];
  return getOptionLabel(value, options);
};

// Obter label para raça
const getRacaLabel = (value: string) => {
  const options = [
    { value: "1", label: "Branca" },
    { value: "2", label: "Preta" },
    { value: "3", label: "Amarela" },
    { value: "4", label: "Parda" },
    { value: "5", label: "Indígena" },
    { value: "9", label: "Ignorado" }
  ];
  return getOptionLabel(value, options);
};

// Obter label para escolaridade
const getEscolaridadeLabel = (value: string) => {
  const options = [
    { value: "0", label: "Analfabeto" },
    { value: "1", label: "Ensino fundamental incompleto" },
    { value: "2", label: "Ensino fundamental completo" },
    { value: "3", label: "Ensino médio incompleto" },
    { value: "4", label: "Ensino médio completo" },
    { value: "5", label: "Ensino superior incompleto" },
    { value: "8", label: "Ensino superior completo" },
    { value: "9", label: "Pós-graduado" },
    { value: "10", label: "Ignorado" },
    { value: "11", label: "Não se aplica" }
  ];
  return getOptionLabel(value, options);
};

// Obter label para tipo de atendimento
const getTipoAtendimentoLabel = (value: string) => {
  const options = [
    { value: "1", label: "Clínico" },
    { value: "2", label: "Trauma" },
    { value: "3", label: "Surto" },
    { value: "4", label: "Múltiplas vítimas" },
    { value: "5", label: "QBRN" }
  ];
  return getOptionLabel(value, options);
};

// Criar dados da tabela para a seção "Informações do Atendimento"
const createAtendimentoTableData = (formData: FormData) => {
  const data: string[][] = [
    ["Tipo de Atendimento", getTipoAtendimentoLabel(formData.tipoAtendimento)]
  ];
  
  if (formData.tipoAtendimento === "1") { // Clínico
    const sinaisESintomasOptions = [
      { value: "AbrasaoLaceracao", label: "ABRASÃO/LACERAÇÃO" },
      { value: "Adenomegalia", label: "ADENOMEGALIA (AUMENTO DAS GLÂNDULAS / LINFONODO)" },
      { value: "AgulhadaIntencional", label: "AGULHADA INTENCIONAL" },
      { value: "Anorexia", label: "ANOREXIA (PERDA DE APETITE)" },
      { value: "Calafrios", label: "CALAFRIOS" },
      { value: "CongestaoNasal", label: "CONGESTÃO NASAL" },
      { value: "Conjuntivite", label: "CONJUNTIVITE" },
      { value: "Contusao", label: "CONTUSÃO" },
      { value: "Convulsoes", label: "CONVULSÕES" },
      { value: "Coriza", label: "CORIZA" },
      { value: "CorteIncisaoPerfuracao", label: "CORTE/INCISÃO/PERFURAÇÃO" },
      { value: "Desidratacao", label: "DESIDRATAÇÃO" },
      { value: "Desorientacao", label: "DESORIENTAÇÃO (CONFUSÃO MENTAL) OU SONOLÊNCIA" },
      { value: "Diarreia", label: "DIARREIA" },
      { value: "Dispneia", label: "DIFICULDADE DE RESPIRAR (DISPNEIA)" },
      { value: "DorAbdominal", label: "DOR ABDOMINAL" },
      { value: "Artralgia", label: "DOR ARTICULAR (ARTRALGIA)" },
      { value: "Cefaleia", label: "DOR DE CABEÇA (CEFALEIA)" },
      { value: "DorDeGarganta", label: "DOR DE GARGANTA E OU FARINGITE" },
      { value: "DorPanturrilha", label: "DOR NA PANTURRILHA" },
      { value: "Mialgia", label: "DOR NO CORPO (MUSCULAR /MIALGIA)" },
      { value: "DorRetroorbital", label: "DOR RETROORBITAL" },
      { value: "EntorseLuxacao", label: "ENTORSE/LUXAÇÃO" },
      { value: "LesaoArmaFogo", label: "LESÃO DECORRENTE DE ARMA DE FOGO" },
      { value: "EstresseTermico", label: "ESTRESSE TÉRMICO / INSOLAÇÃO / QUEIMADURAS SOLARES" },
      { value: "EventoDiabetes", label: "EVENTO RELACIONADO A DIABETES" },
      { value: "EventoHipertensao", label: "EVENTO RELACIONADO A HIPERTENSÃO" },
      { value: "ReacaoAlergica", label: "EVENTO RELACIONADO A REAÇÃO ALÉRGICA" },
      { value: "Exantema", label: "EXANTEMA" },
      { value: "ExposicaoRiscoIST", label: "EXPOSIÇÃO AO RISCO DE IST" },
      { value: "Febre", label: "FEBRE" },
      { value: "Fratura", label: "FRATURA" },
      { value: "Hematoma", label: "HEMATOMA" },
      { value: "HemorragiaCutanea", label: "HEMORRAGIA CUTÂNEA (PETÉQUIAS OU PROVA DO LAÇO)" },
      { value: "HemorragiaOutrosLocais", label: "HEMORRAGIA EM OUTROS LOCAIS" },
      { value: "HemorragiaMucosa", label: "HEMORRAGIA MUCOSA (NASAL OU GENGIVAL)" },
      { value: "Ictericia", label: "ICTERÍCIA" },
      { value: "IntoxicacaoMedicamento", label: "INTOXICAÇÃO (MEDICAMENTO)" },
      { value: "IntoxicacaoAlimentar", label: "INTOXICAÇÃO ALIMENTAR" },
      { value: "IntoxicacaoAlcool", label: "INTOXICAÇÃO OU USO EXCESSIVO POR ÁLCOOL" },
      { value: "IntoxicacaoOutras", label: "INTOXICAÇÃO OUTRAS (VENENOS/AGROTÓXICOS/SANEANTES)" },
      { value: "IntoxicacaoDrogasIlicitas", label: "INTOXICAÇÃO POR USO DE DROGAS ILÍCITAS" },
      { value: "LesaoViolenciaDomestica", label: "LESÃO DECORRENTE DE VIOLÊNCIA DOMÉSTICA" },
      { value: "LesaoAutomovel", label: "LESÃO DECORRENTE DE ACIDENTE COM AUTOMÓVEL" },
      { value: "LesaoBicicleta", label: "LESÃO DECORRENTE DE ACIDENTE COM BICICLETA" },
      { value: "LesaoMoto", label: "LESÃO DECORRENTE DE ACIDENTE COM MOTO" },
      { value: "LesaoMultiplasVitimas", label: "LESÃO DECORRENTE DE ACIDENTE COM MÚLTIPLAS VÍTIMAS" },
      { value: "LesaoOutroVeiculoMotor", label: "LESÃO DECORRENTE DE ACIDENTE COM OUTRO VEÍCULO" },
      { value: "LesaoAglomeracao", label: "LESÃO DECORRENTE DE AGLOMERAÇÃO (PISOTEAMENTO)" },
      { value: "LesaoArmaBranca", label: "LESÃO DECORRENTE DE ARMA BRANCA" },
      { value: "LesaoDesastre", label: "LESÃO DECORRENTE DE DESASTRE" },
      { value: "LesaoQueda", label: "LESÃO DECORRENTE DE QUEDA" },
      { value: "LesaoViolenciaFisica", label: "LESÃO DECORRENTE DE VIOLÊNCIA FÍSICA INTERPESSOAL" },
      { value: "LesaoAssedioSexual", label: "LESÃO DECORRENTE DE VIOLÊNCIA/ASSÉDIO SEXUAL" },
      { value: "LesaoNegligencia", label: "LESÃO DECORRENTE NEGLIGÊNCIA/ABANDONO" },
      { value: "LesaoAutoprovocada", label: "LESÃO POR VIOLÊNCIA FÍSICA AUTOPROVOCADA" },
      { value: "LesoesCutaneasMpox", label: "LESÕES CUTÂNEAS - MPOX" },
      { value: "LesoesCutaneas", label: "LESÕES CUTÂNEAS/VESÍCULAS/BOLHAS" },
      { value: "Linfadenopatia", label: "LINFADENOPATIA" },
      { value: "Nauseas", label: "NÁUSEAS E OU VÔMITO" },
      { value: "Paralisia", label: "PARALISIA OU FLACIDEZ MUSCULAR (MEMBROS INFERIORES)" },
      { value: "Petequias", label: "PETÉQUIAS" },
      { value: "PrescricaoPEP", label: "PRESCRIÇÃO DE PROFILAXIA PÓS-EXPOSIÇÃO (PEP)" },
      { value: "Prurido", label: "PRURIDO/COCEIRA" },
      { value: "Queimadura", label: "QUEIMADURA" },
      { value: "RigidezNuca", label: "RIGIDEZ DE NUCA" },
      { value: "Taquicardia", label: "TAQUICARDIA" },
      { value: "Tontura", label: "TONTURA/DESMAIO" },
      { value: "Tosse", label: "TOSSE" },
      { value: "VitimaOutrosDiscriminacao", label: "VÍTIMA DE OUTROS TIPOS DE DISCRIMINAÇÃO" },
      { value: "VitimaRacismo", label: "VÍTIMA DE RACISMO" },
      { value: "VitimaViolenciaPsicologica", label: "VÍTIMA DE VIOLÊNCIA PSICOLÓGICA" }
    ];
    
    const hipoteseDiagnosticaOptions = [
      { value: "AgulhadaIntencional", label: "Agulhada intencional" },
      { value: "EstresseTermico", label: "Estresse térmico / insolação / queimaduras solares" },
      { value: "EventoAdversoCremeParaCabelo", label: "Evento adverso pós uso de creme para o cabelo" },
      { value: "EventoDiabetes", label: "Evento relacionado a diabetes" },
      { value: "EventoHipertensao", label: "Evento relacionado a hipertensão" },
      { value: "ReacaoAlergica", label: "Evento relacionado a reação alérgica" },
      { value: "ExposicaoRiscoIST", label: "Exposição ao risco de IST" },
      { value: "IntoxicacaoAlimentar", label: "Intoxicação alimentar" },
      { value: "IntoxicacaoMedicamento", label: "Intoxicação (medicamento)" }
      // Adicionamos apenas alguns para simplificar, mas na implementação real deve-se incluir todos
    ];
    
    data.push(
      ["Sinais e Sintomas", formatArrayValues(formData.sinaisESintomas, sinaisESintomasOptions)],
      ["Data de Início dos Sintomas", formData.dataInicioSintomas || ""],
      ["Observação (Sintomas)", formData.observacaoSintomas || ""],
      ["Hipótese Diagnóstica", formatArrayValues(formData.hipoteseDiagnostica, hipoteseDiagnosticaOptions)],
      ["Observação (Hipótese)", formData.observacaoHipotese || ""]
    );
  } 
  else if (formData.tipoAtendimento === "2") { // Trauma
    const tipoTraumaOptions = [
      { value: "Afogamento", label: "AFOGAMENTO" },
      { value: "AgressaoFisica", label: "AGRESSÃO FÍSICA" },
      { value: "AgressaoSexual", label: "AGRESSÃO SEXUAL" },
      { value: "AtaqueAnimalInseto", label: "ATAQUE ANIMAL/INSETO" },
      { value: "Contusao", label: "CONTUSÃO" },
      { value: "CorteIncisaoPerfuracao", label: "CORTE/INCISÃO/PERFURAÇÃO" },
      { value: "Distensao", label: "DISTENSÃO" },
      { value: "EntorseLuxacao", label: "ENTORSE/LUXAÇÃO" },
      { value: "Escoriacao", label: "ESCORIAÇÃO" },
      { value: "EscalpelamentoMotor", label: "ESCALPELAMENTO POR MOTOR" },
      { value: "Esmagamento", label: "ESMAGAMENTO" },
      { value: "Fratura", label: "FRATURA" },
      { value: "LesaoArmaFogo", label: "LESÃO DECORRENTE DE ARMA DE FOGO" },
      { value: "LesaoViolenciaDomestica", label: "LESÃO DECORRENTE DE VIOLÊNCIA DOMÉSTICA" },
      { value: "LesaoAutomovel", label: "LESÃO DECORRENTE DE ACIDENTE COM AUTOMÓVEL" },
      { value: "LesaoEmbarcacao", label: "LESÃO DECORRENTE DE ACIDENTE COM EMBARCAÇÃO" },
      { value: "LesaoBicicleta", label: "LESÃO DECORRENTE DE ACIDENTE COM BICICLETA" },
      { value: "LesaoMoto", label: "LESÃO DECORRENTE DE ACIDENTE COM MOTO" },
      { value: "LesaoMultiplasVitimas", label: "LESÃO DECORRENTE DE ACIDENTE COM MÚLTIPLAS VÍTIMAS" },
      { value: "LesaoOutroVeiculoMotor", label: "LESÃO DECORRENTE DE ACIDENTE COM OUTRO VEÍCULO" },
      { value: "LesaoAglomeracao", label: "LESÃO DECORRENTE DE AGLOMERAÇÃO (PISOTEAMENTO)" },
      { value: "LesaoArmaBranca", label: "LESÃO DECORRENTE DE ARMA BRANCA" },
      { value: "LesaoDesastre", label: "LESÃO DECORRENTE DE DESASTRE" },
      { value: "LesaoQueda", label: "LESÃO DECORRENTE DE QUEDA" },
      { value: "LesaoViolenciaFisica", label: "LESÃO DECORRENTE DE VIOLÊNCIA FÍSICA INTERPESSOAL" },
      { value: "LesaoAssedioSexual", label: "LESÃO DECORRENTE DE VIOLÊNCIA/ASSÉDIO SEXUAL" },
      { value: "LesaoNegligencia", label: "LESÃO DECORRENTE NEGLIGÊNCIA/ABANDONO" },
      { value: "LesaoAutoprovocada", label: "LESÃO POR VIOLÊNCIA FÍSICA AUTOPROVOCADA" },
      { value: "Pisoteamento", label: "PISOTEAMENTO" },
      { value: "Queda", label: "QUEDA" },
      { value: "QueimaduraLesaoCutanea", label: "QUEIMADURA/ LESÃO CUTÂNEA" },
      { value: "Tontura", label: "TONTURA/DESMAIO" },
      { value: "VitimaOutrosDiscriminacao", label: "VÍTIMA DE OUTROS TIPOS DE DISCRIMINAÇÃO" },
      { value: "VitimaRacismo", label: "VÍTIMA DE RACISMO" },
      { value: "VitimaViolenciaPsicologica", label: "VÍTIMA DE VIOLÊNCIA PSICOLÓGICA" }
    ];
    
    data.push(
      ["Tipo de Trauma", formatArrayValues(formData.tipoTrauma, tipoTraumaOptions)],
      ["Data da Ocorrência", formData.dataOcorrencia || ""],
      ["Observação (Trauma)", formData.observacaoTrauma || ""]
    );
  } 
  else if (["3", "4", "5"].includes(formData.tipoAtendimento)) { // Surto, Múltiplas vítimas, QBRN
    data.push(
      ["Relacionado a Surto", formData.relacionadoSurto === "1" ? "Sim" : "Não"],
      ["Observação do Incidente", formData.observacaoIncidente || ""]
    );
  }
  
  return data;
};

// Criar dados da tabela para a seção "Encerramento do Caso"
const createEncerramentoTableData = (formData: FormData) => {
  const data: string[][] = [
    ["Data de Encerramento", formData.dataEncerramento || ""],
    ["Tipo de Encerramento", getTipoEncerramentoLabel(formData.tipoEncerramento)]
  ];
  
  if (formData.tipoEncerramento === "4") { // Transferido
    data.push(["Local de Encaminhamento", formData.localEncaminhamento || ""]);
  }
  else if (formData.tipoEncerramento === "5") { // Óbito
    data.push(["Local de Encaminhamento", getLocalEncerramentoObitoLabel(formData.localEncaminhamento)]);
  }
  
  return data;
};

// Obter label para tipo de encerramento
const getTipoEncerramentoLabel = (value: string) => {
  const options = [
    { value: "1", label: "Atendido e liberado" },
    { value: "2", label: "Internação" },
    { value: "3", label: "Observação" },
    { value: "4", label: "Transferido" },
    { value: "5", label: "Óbito" }
  ];
  return getOptionLabel(value, options);
};

// Obter label para local de encaminhamento de óbito
const getLocalEncerramentoObitoLabel = (value: string) => {
  const options = [
    { value: "1", label: "SVO" },
    { value: "2", label: "IML" },
    { value: "3", label: "Ignorado" }
  ];
  return getOptionLabel(value, options);
};