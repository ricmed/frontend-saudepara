import { useState } from 'react';
import { FormData, ExpandedSections } from '../types/FormTypes';

// Hook inicial para estado do formulário
export const useFormData = () => {
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

  const initialExpandedSections: ExpandedSections = {
    dadosGerais: true,
    procedencia: true,
    identificacao: true,
    atendimento: true,
    unidadeNotificadora: true,
    encerramento: true,
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>(initialExpandedSections);
  const [searchSintomas, setSearchSintomas] = useState("");
  const [searchTrauma, setSearchTrauma] = useState("");
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  // Função para alternar a expansão de uma seção
  const toggleSection = (section: keyof ExpandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handler genérico para mudanças nos campos
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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

  // Handler para reset do formulário
  const handleReset = () => {
    setFormData(initialFormData);
  };

  // Handler para submit do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Formulário enviado:", formData);
    // Aqui você poderia adicionar lógica para enviar os dados para uma API
  };

  // Handler para exportação
  const handleExport = (format: string) => {
    alert(`Exportar para ${format} (funcionalidade não implementada)`);
    setIsExportDropdownOpen(false);
  };

  const toggleExportDropdown = () => {
    setIsExportDropdownOpen(!isExportDropdownOpen);
  };

  return {
    formData,
    setFormData,
    expandedSections,
    toggleSection,
    handleChange,
    handleCheckboxChange,
    handleReset,
    handleSubmit,
    searchSintomas,
    setSearchSintomas,
    searchTrauma,
    setSearchTrauma,
    isExportDropdownOpen,
    toggleExportDropdown,
    handleExport,
  };
};

export default useFormData;