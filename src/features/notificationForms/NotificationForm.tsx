import React, { useState, useEffect } from "react";
import PhoneInput from "@/features/notificationForms/components/PhoneInput";
import CboInput from "@/features/notificationForms/components/CboInput";
import {
  Search,
  Save,
  Plus,
  X,
  User,
  ClipboardList,
  Bell,
  PackageCheck,
  ArrowLeft,
  FileChartColumnIncreasing,
  FileSpreadsheet,
  FileText,
  Files,
  Download,
  MapPin,
  ArchiveX,
  ChevronDown,
  ChevronUp,
  FileOutput,
  Globe,
  ListChecks,
} from "lucide-react";

// Interface FormData atualizada
export interface FormData {
  // Seção 1: Dados Gerais
  evento: string;
  publicoAtendido: string;

  // Seção 2: Procedência do indivíduo
  residenteBelem: string;
  bairro: string;
  municipio: string;
  uf: string;
  paisProcedencia: string;
  localHospedagem: string;
  contatoLocal: string;

  // Seção 3: Identificação do indivíduo
  paciente: string;
  nomeMae: string;
  dataNascimento: string;
  idade: string;
  cpf: string;
  identidadeGenero: string;
  gestante: string;
  raca: string;
  escolaridade: string;
  profissao: string;
  profissaoSearch?: string;
  showProfissaoOptions?: boolean;
  contatoTelefonico: string;

  // Seção 4: Informações do atendimento
  tipoAtendimento: string;
  sinaisESintomas: string[];
  dataInicioSintomas: string;
  observacaoSintomas: string;
  hipoteseDiagnostica: string[];
  observacaoHipotese: string;
  tipoTrauma: string[];
  dataOcorrencia: string;
  observacaoTrauma: string;
  relacionadoSurto: string;
  observacaoIncidente: string;

  // Seção 5: Informações da unidade notificadora
  dataAtendimento: string;
  unidadeNotificadora: string;
  nomeNotificador: string;
  contatoNotificador: string;

  // Seção 6: Encerramento do Caso
  dataEncerramento: string;
  tipoEncerramento: string;
  localEncaminhamento: string;
}

// Opções para os dropdowns
const eventoOptions = [
  "COP30",
  "Carnaval",
  "Copa do Mundo Feminina",
  "Círio de Nazaré",
];

const publicoAtendidoOptions = [
  { value: "1", label: "Visitante" },
  { value: "2", label: "Trabalhador" },
  { value: "3", label: "Autoridade" },
  // VIP removido conforme solicitado
];

const residenteBelemOptions = [
  { value: "1", label: "SIM" },
  { value: "2", label: "NÃO" },
  { value: "3", label: "ESTRANGEIRO" },
];

const bairrosBelemOptions = [
  "Batista Campos",
  "Campina",
  "Cidade Velha",
  "Condor",
  "Cremação",
  "Guamá",
  "Jurunas",
  "Nazaré",
  "Pedreira",
  "Reduto",
  "Sacramenta",
  "São Brás",
  "Telégrafo",
  "Umarizal",
  "Marco",
  "Marambaia",
  "Terra Firme",
  "Canudos",
  "Universitário",
  "Curió-Utinga",
  "Águas Lindas",
  "Tapanã",
  "Icoaraci",
  "Outeiro",
  "Mosqueiro",
];

const estadoOptions = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const municipioParaOptions = [
  "Abaetetuba",
  "Abel Figueiredo",
  "Acará",
  "Afuá",
  "Água Azul do Norte",
  "Alenquer",
  "Almeirim",
  "Altamira",
  "Anajás",
  "Ananindeua",
  "Anapu",
  "Augusto Corrêa",
  "Aurora do Pará",
  "Aveiro",
  "Bagre",
  "Baião",
  "Bannach",
  "Barcarena",
  "Belém",
  "Belterra",
  "Benevides",
  "Bom Jesus do Tocantins",
  "Bonito",
  "Bragança",
  "Brasil Novo",
  "Brejo Grande do Araguaia",
  "Breu Branco",
  "Breves",
  "Bujaru",
  "Cachoeira do Arari",
  "Cachoeira do Piriá",
  "Cametá",
  "Canaã dos Carajás",
  // Lista reduzida para brevidade
];

const paisOptions = [
  "Afeganistão",
  "África do Sul",
  "Albânia",
  "Alemanha",
  "Andorra",
  "Angola",
  "Antígua e Barbuda",
  "Arábia Saudita",
  "Argélia",
  "Argentina",
  "Armênia",
  "Austrália",
  "Áustria",
  "Azerbaijão",
  "Bahamas",
  "Bahrein",
  "Bangladesh",
  "Barbados",
  "Bélgica",
  "Belize",
  "Benin",
  "Bielorrússia",
  "Bolívia",
  "Bósnia e Herzegovina",
  "Botsuana",
  "Brasil",
  "Brunei",
  "Bulgária",
  // Lista reduzida para brevidade
];

const identidadeGeneroOptions = [
  { value: "1", label: "Mulher cisgênero" },
  { value: "2", label: "Homem cisgênero" },
  { value: "3", label: "Mulher transgênero" },
  { value: "4", label: "Homem transgênero" },
  { value: "5", label: "Travesti" },
  { value: "6", label: "Não binário" },
  { value: "7", label: "Não se aplica" },
  { value: "9", label: "Ignorado" },
];

const gestanteOptions = [
  { value: "1", label: "Sim" },
  { value: "2", label: "Não" },
];

const racaOptions = [
  { value: "1", label: "Branca" },
  { value: "2", label: "Preta" },
  { value: "3", label: "Amarela" },
  { value: "4", label: "Parda" },
  { value: "5", label: "Indígena" },
  { value: "9", label: "Ignorado" },
];

const escolaridadeOptions = [
  { value: "0", label: "Analfabeto" },
  { value: "1", label: "Ensino fundamental incompleto" },
  { value: "2", label: "Ensino fundamental completo" },
  { value: "3", label: "Ensino médio incompleto" },
  { value: "4", label: "Ensino médio completo" },
  { value: "5", label: "Ensino superior incompleto" },
  { value: "8", label: "Ensino superior completo" },
  { value: "9", label: "Pós-graduado" },
  { value: "10", label: "Ignorado" },
  { value: "11", label: "Não se aplica" },
];

const tipoAtendimentoOptions = [
  { value: "1", label: "Clínico" },
  { value: "2", label: "Trauma" },
  { value: "3", label: "Surto" },
  { value: "4", label: "Múltiplas vítimas" },
  { value: "5", label: "Incidente QBRN" },
];

const sinaisESintomasOptions = [
  { value: "AbrasaoLaceracao", label: "ABRASAO/LACERACAO" },
  { value: "Adenomegalia", label: "ADENOMEGALIA (AUMENTO DAS GLANDULAS / LINFONODO)" },
  { value: "AgulhadaIntencional", label: "AGULHADA INTENCIONAL" },
  { value: "Anorexia", label: "ANOREXIA (PERDA DE APETITE)" },
  { value: "Calafrios", label: "CALAFRIOS" },
  { value: "CongestaoNasal", label: "CONGESTAO NASAL" },
  { value: "Conjuntivite", label: "CONJUNTIVITE" },
  { value: "Contusao", label: "CONTUSAO" },
  { value: "Convulsoes", label: "CONVULSOES" },
  { value: "Coriza", label: "CORIZA" },
  { value: "CorteIncisaoPerfuracao", label: "CORTE/INCISAO/PERFURACAO" },
  { value: "Desidratacao", label: "DESIDRATACAO" },
  { value: "Desorientacao", label: "DESORIENTACAO (CONFUSAO MENTAL) OU SONOLENCIA" },
  { value: "Diarreia", label: "DIARREIA" },
  { value: "Dispneia", label: "DIFICULDADE DE RESPIRAR (DISPNEIA)" },
  { value: "DorAbdominal", label: "DOR ABDOMINAL" },
  { value: "Artralgia", label: "DOR ARTICULAR (ARTRALGIA)" },
  { value: "Cefaleia", label: "DOR DE CABECA (CEFALEIA)" },
  { value: "DorDeGarganta", label: "DOR DE GARGANTA E OU FARINGITE" },
  { value: "DorPanturrilha", label: "DOR NA PANTURRILLHA" },
  { value: "Mialgia", label: "DOR NO CORPO (MUSCULAR /MIALGIA)" },
  { value: "DorRetroorbital", label: "DOR RETROORBITAL" },
  { value: "EntorseLuxacao", label: "ENTORSE/LUXACAO" },
  { value: "LesaoArmaFogo", label: "LESAO DECORRENTE DE ARMA DE FOGO" },
  { value: "EstresseTermico", label: "ESTRESSE TERMICO / INSOLACAO / QUEIMADURAS SOLAR" },
  { value: "EventoDiabetes", label: "EVENTO RELACIONADO A DIABETES" },
  { value: "EventoHipertensao", label: "EVENTO RELACIONADO A HIPERTENSAO" },
  { value: "ReacaoAlergica", label: "EVENTO RELACIONADO A REACAO ALERGICA" },
  { value: "Exantema", label: "EXANTEMA" },
  { value: "ExposicaoRiscoIST", label: "EXPOSICAO AO RISCO DE IST" },
  { value: "Febre", label: "FEBRE" },
  { value: "Fratura", label: "FRATURA" },
  { value: "Hematoma", label: "HEMATOMA" },
  { value: "HemorragiaCutanea", label: "HEMORRAGIA CUTANEA (PETEQUIAS OU PROVA DO LACO)" },
  { value: "HemorragiaOutrosLocais", label: "HEMORRAGIA EM OUTROS LOCAIS" },
  { value: "HemorragiaMucosa", label: "HEMORRAGIA MUCOSA (NASAL OU GENGIVAL)" },
  { value: "Ictericia", label: "ICTERICIA" },
  { value: "IntoxicacaoMedicamento", label: "INTOXICACAO (MEDICAMENTO)" },
  { value: "IntoxicacaoAlimentar", label: "INTOXICACAO ALIMENTAR" },
  { value: "IntoxicacaoAlcool", label: "INTOXICACAO OU USO EXCESSIVO POR ALCOOL" },
  { value: "IntoxicacaoOutras", label: "INTOXICACAO OUTRAS (VENENOS/AGROTOXICOS/SANEANTES)" },
  { value: "IntoxicacaoDrogasIlicitas", label: "INTOXICACAO POR USO DE DROGAS ILICITAS" },
  { value: "LesaoViolenciaDomestica", label: "LESAO DECORRENTE DE VIOLENCIA DOMESTICA" },
  { value: "LesaoAutomovel", label: "LESAO DECORRENTE DE ACIDENTE COM AUTOMOVEL" },
  { value: "LesaoBicicleta", label: "LESAO DECORRENTE DE ACIDENTE COM BICICLETA" },
  { value: "LesaoMoto", label: "LESAO DECORRENTE DE ACIDENTE COM MOTO" },
  { value: "LesaoMultiplasVitimas", label: "LESAO DECORRENTE DE ACIDENTE COM MULTIPLAS VITIMAS" },
  { value: "LesaoOutroVeiculoMotor", label: "LESAO DECORRENTE DE ACIDENTE COM OUTRO VEICULO" },
  { value: "LesaoAglomeracao", label: "LESAO DECORRENTE DE AGLOMERACAO (PISOTEAMENTO)" },
  { value: "LesaoArmaBranca", label: "LESAO DECORRENTE DE ARMA BRANCA" },
  { value: "LesaoDesastre", label: "LESAO DECORRENTE DE DESASTRE" },
  { value: "LesaoQueda", label: "LESAO DECORRENTE DE QUEDA" },
  { value: "LesaoViolenciaFisica", label: "LESAO DECORRENTE DE VIOLENCIA FISICA INTERPESSOAL" },
  { value: "LesaoAssedioSexual", label: "LESAO DECORRENTE DE VIOLENCIA/ASSEDIO SEXUAL" },
  { value: "LesaoNegligencia", label: "LESAO DECORRENTE NEGLIGENCIA/ABANDONO" },
  { value: "LesaoAutoprovocada", label: "LESAO POR VIOLENCIA FISICA AUTOPROVOCADA" },
  { value: "LesoesCutaneasMpox", label: "LESOES CUTANEAS - MPOX" },
  { value: "LesoesCutaneas", label: "LESOES CUTANEAS/VESICULAS/BOLHAS" },
  { value: "Linfadenopatia", label: "LINFADENOPATIA" },
  { value: "Nauseas", label: "NAUSEAS E OU VOMITO" },
  { value: "Paralisia", label: "PARALISIA OU FLACIDEZ MUSCULAR (MEMBROS INFERIORES)" },
  { value: "Petequias", label: "PETÉQUIAS" },
  { value: "PrescricaoPEP", label: "PRESCRICAO DE PROFILAXIA POS-EXPOSICAO (PEP)" },
  { value: "Prurido", label: "PRURIDO/COCEIRA" },
  { value: "Queimadura", label: "QUEIMADURA" },
  { value: "RigidezNuca", label: "RIGIDEZ DE NUCA" },
  { value: "Taquicardia", label: "TAQUICARDIA" },
  { value: "Tontura", label: "TONTURA/DESMAIO" },
  { value: "Tosse", label: "TOSSE" },
  { value: "VitimaOutrosDiscriminacao", label: "VITIMA DE OUTROS TIPOS DE DISCRIMINACAO" },
  { value: "VitimaRacismo", label: "VITIMA DE RACISMO" },
  { value: "VitimaViolenciaPsicologica", label: "VITIMA DE VIOLENCIA PSICOLOGICA" },
];

const hipoteseDiagnosticaOptions = [
  { value: "AgulhadaIntencional", label: "Agulhada intencional" },
  {
    value: "EstresseTermico",
    label: "Estresse térmico / insolação / queimaduras solares",
  },
  {
    value: "EventoAdversoCremeParaCabelo",
    label: "Evento adverso pós uso de creme para o cabelo",
  },
  { value: "EventoDiabetes", label: "Evento relacionado a diabetes" },
  { value: "EventoHipertensao", label: "Evento relacionado a hipertensão" },
  { value: "ReacaoAlergica", label: "Evento relacionado a reação alérgica" },
  { value: "ExposicaoRiscoIST", label: "Exposição ao risco de IST" },
  { value: "IntoxicacaoAlimentar", label: "Intoxicação alimentar" },
  { value: "IntoxicacaoMedicamento", label: "Intoxicação (medicamento)" },
  // Lista reduzida para brevidade
];

const tipoTraumaOptions = [
  { value: "Afogamento", label: "AFOGAMENTO" },
  { value: "AgressaoFisica", label: "AGRESSÃO FÍSICA" },
  { value: "AgressaoSexual", label: "AGRESSÃO SEXUAL" },
  { value: "AtaqueAnimalInseto", label: "ATAQUE ANIMAL/INSETO" },
  { value: "Contusao", label: "CONTUSAO" },
  { value: "CorteIncisaoPerfuracao", label: "CORTE/INCISAO/PERFURACAO" },
  { value: "Distensao", label: "DISTENSÃO" },
  { value: "EntorseLuxacao", label: "ENTORSE/LUXACAO" },
  { value: "Escoriacao", label: "ESCORIAÇÃO" },
  { value: "EscalpelamentoMotor", label: "ESCALPELAMENTO POR MOTOR" },
  { value: "Esmagamento", label: "ESMAGAMENTO" },
  { value: "Fratura", label: "FRATURA" },
  { value: "LesaoArmaFogo", label: "LESAO DECORRENTE DE ARMA DE FOGO" },
  { value: "LesaoViolenciaDomestica", label: "LESAO DECORRENTE DE VIOLENCIA DOMESTICA" },
  { value: "LesaoAutomovel", label: "LESAO DECORRENTE DE ACIDENTE COM AUTOMOVEL" },
  { value: "LesaoEmbarcacao", label: "LESAO DECORRENTE DE ACIDENTE COM EMBARCAÇÃO" },
  { value: "LesaoBicicleta", label: "LESAO DECORRENTE DE ACIDENTE COM BICICLETA" },
  { value: "LesaoMoto", label: "LESAO DECORRENTE DE ACIDENTE COM MOTO" },
  { value: "LesaoMultiplasVitimas", label: "LESAO DECORRENTE DE ACIDENTE COM MULTIPLAS VITIMAS" },
  { value: "LesaoOutroVeiculoMotor", label: "LESAO DECORRENTE DE ACIDENTE COM OUTRO VEICULO" },
  { value: "LesaoAglomeracao", label: "LESAO DECORRENTE DE AGLOMERACAO (PISOTEAMENTO)" },
  { value: "LesaoArmaBranca", label: "LESAO DECORRENTE DE ARMA BRANCA" },
  { value: "LesaoDesastre", label: "LESAO DECORRENTE DE DESASTRE" },
  { value: "LesaoQueda", label: "LESAO DECORRENTE DE QUEDA" },
  { value: "LesaoViolenciaFisica", label: "LESAO DECORRENTE DE VIOLENCIA FISICA INTERPESSOAL" },
  { value: "LesaoAssedioSexual", label: "LESAO DECORRENTE DE VIOLENCIA/ASSEDIO SEXUAL" },
  { value: "LesaoNegligencia", label: "LESAO DECORRENTE NEGLIGENCIA/ABANDONO" },
  { value: "LesaoAutoprovocada", label: "LESAO POR VIOLENCIA FISICA AUTOPROVOCADA" },
  { value: "Pisoteamento", label: "PISOTEAMENTO" },
  { value: "Queda", label: "QUEDA" },
  { value: "QueimaduraLesaoCutanea", label: "QUEIMADURA/ LESÃO CUTÂNEA" },
  { value: "Tontura", label: "TONTURA/DESMAIO" },
  { value: "VitimaOutrosDiscriminacao", label: "VITIMA DE OUTROS TIPOS DE DISCRIMINACAO" },
  { value: "VitimaRacismo", label: "VITIMA DE RACISMO" },
  { value: "VitimaViolenciaPsicologica", label: "VITIMA DE VIOLENCIA PSICOLOGICA" },
];

const tipoEncerramentoOptions = [
  { value: "1", label: "Atendido e liberado" },
  { value: "2", label: "Internação" },
  { value: "3", label: "Observação" },
  { value: "4", label: "Transferido" },
  { value: "5", label: "Óbito" },
];

const hospitalBelemOptions = [
  "Hospital Metropolitano de Urgência e Emergência",
  "Hospital de Pronto Socorro Municipal Mário Pinotti",
  "Hospital Universitário João de Barros Barreto",
  "Hospital Regional Dr. Abelardo Santos",
  "Hospital Geral de Belém",
  "Hospital Porto Dias",
  "Hospital Ophir Loyola",
  "Hospital de Clínicas Gaspar Vianna",
  "Hospital da Santa Casa de Misericórdia do Pará",
  "Hospital Galileu",
];

const localEncaminhamentoObitoOptions = [
  { value: "1", label: "SVO" },
  { value: "2", label: "IML" },
  { value: "3", label: "Ignorado" },
];

const NotificationForm = () => {
  const initialFormData: FormData = {
    // Seção 1: Dados Gerais
    evento: "",
    publicoAtendido: "",

    // Seção 2: Procedência do indivíduo
    residenteBelem: "",
    bairro: "",
    municipio: "",
    uf: "",
    paisProcedencia: "",
    localHospedagem: "",
    contatoLocal: "",

    // Seção 3: Identificação do indivíduo
    paciente: "",
    nomeMae: "",
    dataNascimento: "",
    idade: "",
    cpf: "",
    identidadeGenero: "",
    gestante: "",
    raca: "",
    escolaridade: "",
    profissao: "",
    profissaoSearch: "",
    showProfissaoOptions: false,
    contatoTelefonico: "",

    // Seção 4: Informações do atendimento
    tipoAtendimento: "",
    sinaisESintomas: [],
    dataInicioSintomas: "",
    observacaoSintomas: "",
    hipoteseDiagnostica: [],
    observacaoHipotese: "",
    tipoTrauma: [],
    dataOcorrencia: "",
    observacaoTrauma: "",
    relacionadoSurto: "",
    observacaoIncidente: "",

    // Seção 5: Informações da unidade notificadora
    dataAtendimento: "",
    unidadeNotificadora: "",
    nomeNotificador: "",
    contatoNotificador: "",

    // Seção 6: Encerramento do Caso
    dataEncerramento: "",
    tipoEncerramento: "",
    localEncaminhamento: "",
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  // Estado para controlar seções expandidas
  const [expandedSections, setExpandedSections] = useState({
    dadosGerais: true,
    procedencia: true,
    identificacao: true,
    atendimento: true,
    unidadeNotificadora: true,
    encerramento: true,
  });

  // Função para alternar a expansão de uma seção
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Componente para o cabeçalho da seção
  const SectionHeader = ({
    icon,
    title,
    isExpanded,
    onToggle,
  }: {
    icon: React.ReactNode;
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      {isExpanded ? (
        <ChevronUp className="h-5 w-5 text-gray-500" />
      ) : (
        <ChevronDown className="h-5 w-5 text-gray-500" />
      )}
    </button>
  );

  // Handler genérico para mudanças nos campos
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler para clicar fora do dropdown de profissão
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formData.showProfissaoOptions) {
        setFormData((prev) => ({ ...prev, showProfissaoOptions: false }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [formData.showProfissaoOptions]);

  // Handler para checkboxes (múltipla seleção)
  const handleCheckboxChange = (field: keyof FormData, value: string) => {
    if (!value) return;

    setFormData((prev) => {
      const currentValues = prev[field] as string[];
      return {
        ...prev,
        [field]: currentValues.includes(value)
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value],
      };
    });
  };

  // Handlers para ações do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Formulário enviado:", formData);
  };

  const handleReset = () => {
    setFormData(initialFormData);
  };

  const handleExport = (format: string) => {
    alert(`Exportar para ${format} (funcionalidade não implementada)`);
    setIsExportDropdownOpen(false);
  };

  const toggleExportDropdown = () => {
    setIsExportDropdownOpen(!isExportDropdownOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 shadow-lg sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-white">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Voltar"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <ClipboardList className="h-8 w-8" />
            <h1 className="text-2xl font-semibold">
              Formulário de Notificação
            </h1>
          </div>

          <div className="relative flex items-center gap-3">
            {/* Botão Exportar com Dropdown */}
            <div className="relative">
              <button
                onClick={toggleExportDropdown}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>

              {/* Dropdown de Exportação */}
              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => handleExport("Word")}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
                      role="menuitem"
                    >
                      <FileChartColumnIncreasing className="h-4 w-4" /> Word
                    </button>
                    <button
                      onClick={() => handleExport("Excel")}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
                      role="menuitem"
                    >
                      <FileSpreadsheet className="h-4 w-4" /> Excel
                    </button>
                    <button
                      onClick={() => handleExport("CSV")}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
                      role="menuitem"
                    >
                      <FileText className="h-4 w-4" /> CSV
                    </button>
                    <button
                      onClick={() => handleExport("PDF")}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center gap-2"
                      role="menuitem"
                    >
                      <Files className="h-4 w-4" /> PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="h-6 w-px bg-white/20 mx-2" /> {/* Separador */}
            {/* Botões de Ação (CABEÇALHO) */}
            <button
              type="submit"
              form="notification-form"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              Salvar
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Novo Registro
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        <form
          id="notification-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Seção 1: Dados Gerais */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<FileOutput className="h-5 w-5 text-blue-500" />}
              title="1. Dados Gerais"
              isExpanded={expandedSections.dadosGerais}
              onToggle={() => toggleSection("dadosGerais")}
            />
            {expandedSections.dadosGerais && (
              <div className="p-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Evento */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Evento
                    </label>
                    <select
                      name="evento"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.evento}
                      onChange={handleChange}
                    >
                      <option value="">Selecione</option>
                      {eventoOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Público Atendido */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Público Atendido
                    </label>
                    <select
                      name="publicoAtendido"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.publicoAtendido}
                      onChange={handleChange}
                    >
                      <option value="">Selecione</option>
                      {publicoAtendidoOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção 2: Procedência do indivíduo */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<Globe className="h-5 w-5 text-green-500" />}
              title="2. Procedência do indivíduo"
              isExpanded={expandedSections.procedencia}
              onToggle={() => toggleSection("procedencia")}
            />
            {expandedSections.procedencia && (
              <div className="p-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Residente em Belém? */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Residente em Belém?
                    </label>
                    <select
                      name="residenteBelem"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.residenteBelem}
                      onChange={handleChange}
                    >
                      <option value="">Selecione</option>
                      {residenteBelemOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Campos condicionais baseados na residência */}
                  {formData.residenteBelem === "1" && (
                    <div>
                      <label className="block mb-2 font-medium text-gray-700">
                        Bairro
                      </label>
                      <select
                        name="bairro"
                        className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        value={formData.bairro}
                        onChange={handleChange}
                      >
                        <option value="">Selecione</option>
                        {bairrosBelemOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.residenteBelem === "2" && (
                    <>
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Município
                        </label>
                        <select
                          name="municipio"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.municipio}
                          onChange={handleChange}
                        >
                          <option value="">Selecione</option>
                          {municipioParaOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          UF
                        </label>
                        <select
                          name="uf"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.uf}
                          onChange={handleChange}
                        >
                          <option value="">Selecione</option>
                          {estadoOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {formData.residenteBelem === "3" && (
                    <>
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          País de Procedência
                        </label>
                        <select
                          name="paisProcedencia"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.paisProcedencia}
                          onChange={handleChange}
                        >
                          <option value="">Selecione</option>
                          {paisOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Local de Hospedagem
                        </label>
                        <input
                          type="text"
                          name="localHospedagem"
                          placeholder="Informe o local de hospedagem"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.localHospedagem}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Contato do Local
                        </label>
                        <input
                          type="text"
                          name="contatoLocal"
                          placeholder="DDD XXXXX-XXXX"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.contatoLocal}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Seção 3: Identificação do indivíduo */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<User className="h-5 w-5 text-purple-500" />}
              title="3. Identificação do indivíduo"
              isExpanded={expandedSections.identificacao}
              onToggle={() => toggleSection("identificacao")}
            />
            {expandedSections.identificacao && (
              <div className="p-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome do Paciente */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Nome
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="paciente"
                        placeholder="Nome do paciente"
                        className="flex-1 p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        value={formData.paciente}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Search className="h-4 w-4" />
                        <span>Pesquisar</span>
                      </button>
                    </div>
                  </div>

                  {/* Nome da Mãe */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Nome da Mãe
                    </label>
                    <input
                      type="text"
                      name="nomeMae"
                      placeholder="Nome da mãe do paciente"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.nomeMae}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Data de Nascimento */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      name="dataNascimento"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.dataNascimento}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Idade */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Idade
                    </label>
                    <input
                      type="number"
                      name="idade"
                      placeholder="Digite a idade"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.idade}
                      onChange={handleChange}
                    />
                  </div>

                  {/* CPF */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      CPF
                    </label>
                    <input
                      type="text"
                      name="cpf"
                      placeholder="XXX.XXX.XXX-XX"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.cpf}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Identidade de Gênero */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Identidade de Gênero
                    </label>
                    <select
                      name="identidadeGenero"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.identidadeGenero}
                      onChange={handleChange}
                    >
                      <option value="">Selecione</option>
                      {identidadeGeneroOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gestante (condicional) */}
                  {formData.identidadeGenero === "1" && (
                    <div>
                      <label className="block mb-2 font-medium text-gray-700">
                        Gestante
                      </label>
                      <select
                        name="gestante"
                        className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        value={formData.gestante}
                        onChange={handleChange}
                      >
                        <option value="">Selecione</option>
                        {gestanteOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Raça */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Raça
                    </label>
                    <select
                      name="raca"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.raca}
                      onChange={handleChange}
                    >
                      <option value="">Selecione</option>
                      {racaOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Escolaridade */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Escolaridade
                    </label>
                    <select
                      name="escolaridade"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.escolaridade}
                      onChange={handleChange}
                    >
                      <option value="">Selecione</option>
                      {escolaridadeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Profissão/Ocupação com pesquisa */}
                  <div>
                    <CboInput
                      name="profissao"
                      value={formData.profissao}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          profissao: value,
                        }))
                      }
                      placeholder="Pesquisar profissão"
                      label="Profissão/Ocupação (CBO)"
                    />
                  </div>

                  {/* Contato Telefônico */}
                  <div>
                    <PhoneInput
                      name="contatoTelefonico"
                      value={formData.contatoTelefonico}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          contatoTelefonico: value,
                        }))
                      }
                      label="Contato Telefônico"
                      placeholder="Digite o número de telefone"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção 4: Informações do atendimento */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<ListChecks className="h-5 w-5 text-yellow-500" />}
              title="4. Informações do atendimento"
              isExpanded={expandedSections.atendimento}
              onToggle={() => toggleSection("atendimento")}
            />
            {expandedSections.atendimento && (
              <div className="p-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tipo de Atendimento */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Tipo de Atendimento
                    </label>
                    <select
                      name="tipoAtendimento"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.tipoAtendimento}
                      onChange={handleChange}
                    >
                      <option value="">Selecione</option>
                      {tipoAtendimentoOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Campos condicionais baseados no tipo de atendimento */}
                  {formData.tipoAtendimento === "1" && ( // Clínico
                    <>
                      {/* Sinais e Sintomas */}
                      <div className="md:col-span-2">
                        <label className="block mb-2 font-medium text-gray-700">
                          Sinais e Sintomas
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {sinaisESintomasOptions.map((option) => (
                            <label
                              key={option.value}
                              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 group"
                            >
                              <input
                                type="checkbox"
                                checked={formData.sinaisESintomas.includes(
                                  option.value
                                )}
                                onChange={() =>
                                  handleCheckboxChange(
                                    "sinaisESintomas",
                                    option.value
                                  )
                                }
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200 group-hover:border-blue-400"
                              />
                              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Data de Início dos Sintomas */}
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Data de Início dos Sintomas
                        </label>
                        <input
                          type="date"
                          name="dataInicioSintomas"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.dataInicioSintomas}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Observação dos Sintomas */}
                      <div className="md:col-span-2">
                        <label className="block mb-2 font-medium text-gray-700">
                          Observação
                        </label>
                        <textarea
                          name="observacaoSintomas"
                          rows={3}
                          placeholder="Informações adicionais sobre os sintomas..."
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.observacaoSintomas}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Hipótese Diagnóstica */}
                      <div className="md:col-span-2">
                        <label className="block mb-2 font-medium text-gray-700">
                          Hipótese Diagnóstica
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {hipoteseDiagnosticaOptions.map((option) => (
                            <label
                              key={option.value}
                              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 group"
                            >
                              <input
                                type="checkbox"
                                checked={formData.hipoteseDiagnostica.includes(
                                  option.value
                                )}
                                onChange={() =>
                                  handleCheckboxChange(
                                    "hipoteseDiagnostica",
                                    option.value
                                  )
                                }
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200 group-hover:border-blue-400"
                              />
                              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Observação da Hipótese */}
                      <div className="md:col-span-2">
                        <label className="block mb-2 font-medium text-gray-700">
                          Observação
                        </label>
                        <textarea
                          name="observacaoHipotese"
                          rows={3}
                          placeholder="Informações adicionais sobre a hipótese diagnóstica..."
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.observacaoHipotese}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}

                  {formData.tipoAtendimento === "2" && ( // Trauma
                    <>
                      {/* Tipo de Trauma */}
                      <div className="md:col-span-2">
                        <label className="block mb-2 font-medium text-gray-700">
                          Tipo de Trauma
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {tipoTraumaOptions.map((option) => (
                            <label
                              key={option.value}
                              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 group"
                            >
                              <input
                                type="checkbox"
                                checked={formData.tipoTrauma.includes(
                                  option.value
                                )}
                                onChange={() =>
                                  handleCheckboxChange(
                                    "tipoTrauma",
                                    option.value
                                  )
                                }
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200 group-hover:border-blue-400"
                              />
                              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Data da Ocorrência */}
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Data da Ocorrência
                        </label>
                        <input
                          type="date"
                          name="dataOcorrencia"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.dataOcorrencia}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Observação do Trauma */}
                      <div className="md:col-span-2">
                        <label className="block mb-2 font-medium text-gray-700">
                          Observação
                        </label>
                        <textarea
                          name="observacaoTrauma"
                          rows={3}
                          placeholder="Informações adicionais sobre o trauma..."
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.observacaoTrauma}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}

                  {/* Surto, Múltiplas vítimas, QBRN */}
                  {["3", "4", "5"].includes(formData.tipoAtendimento) && (
                    <>
                      {/* Relacionado a Surto ou Agregado de Indivíduos */}
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Relacionado a Surto ou Agregado de Indivíduos
                        </label>
                        <select
                          name="relacionadoSurto"
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.relacionadoSurto}
                          onChange={handleChange}
                        >
                          <option value="">Selecione</option>
                          <option value="1">Sim</option>
                          <option value="2">Não</option>
                        </select>
                      </div>

                      {/* Observação do Incidente */}
                      <div className="md:col-span-2">
                        <label className="block mb-2 font-medium text-gray-700">
                          Observação do Incidente
                        </label>
                        <textarea
                          name="observacaoIncidente"
                          rows={3}
                          placeholder="Informações adicionais sobre o incidente..."
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          value={formData.observacaoIncidente}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Seção 5: Informações da unidade notificadora */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<Bell className="h-5 w-5 text-orange-500" />}
              title="5. Informações da unidade notificadora"
              isExpanded={expandedSections.unidadeNotificadora}
              onToggle={() => toggleSection("unidadeNotificadora")}
            />
            {expandedSections.unidadeNotificadora && (
              <div className="p-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Data do Atendimento */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Data do Atendimento
                    </label>
                    <input
                      type="date"
                      name="dataAtendimento"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.dataAtendimento}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Unidade Notificadora */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Unidade Notificadora
                    </label>
                    <input
                      type="text"
                      name="unidadeNotificadora"
                      placeholder="Lista de unidades"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.unidadeNotificadora}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Nome do Notificador */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Nome do Notificador
                    </label>
                    <input
                      type="text"
                      name="nomeNotificador"
                      placeholder="Nome do notificador"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.nomeNotificador}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Contato do Notificador */}
                  <div>
                    <PhoneInput
                      name="contatoNotificador"
                      value={formData.contatoNotificador}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          contatoNotificador: value,
                        }))
                      }
                      label="Contato do Notificador"
                      placeholder="Digite o número de telefone"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção 6: Encerramento do Caso */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<ArchiveX className="h-5 w-5 text-gray-700" />}
              title="6. Encerramento do Caso"
              isExpanded={expandedSections.encerramento}
              onToggle={() => toggleSection("encerramento")}
            />
            {expandedSections.encerramento && (
              <div className="p-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Data de Encerramento */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Data de Encerramento
                    </label>
                    <input
                      type="date"
                      name="dataEncerramento"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.dataEncerramento}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Tipo de Encerramento */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Tipo de Encerramento
                    </label>
                    <select
                      name="tipoEncerramento"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={formData.tipoEncerramento}
                      onChange={handleChange}
                    >
                      <option value="">Selecione</option>
                      {tipoEncerramentoOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Local de Encaminhamento (condicional) */}
                  {formData.tipoEncerramento === "4" && (
                    <div>
                      <label className="block mb-2 font-medium text-gray-700">
                        Local de Encaminhamento
                      </label>
                      <select
                        name="localEncaminhamento"
                        className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        value={formData.localEncaminhamento}
                        onChange={handleChange}
                      >
                        <option value="">Selecione</option>
                        {hospitalBelemOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Local de Encaminhamento para Óbito */}
                  {formData.tipoEncerramento === "5" && (
                    <div>
                      <label className="block mb-2 font-medium text-gray-700">
                        Local de Encaminhamento
                      </label>
                      <select
                        name="localEncaminhamento"
                        className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        value={formData.localEncaminhamento}
                        onChange={handleChange}
                      >
                        <option value="">Selecione</option>
                        {localEncaminhamentoObitoOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação (Inferiores) */}
          <div className="flex justify-center gap-4 mt-8 pb-8">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              Salvar
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Novo Registro
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default NotificationForm;
