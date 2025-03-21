import React from 'react';
import { User, Search } from 'lucide-react';
import FormSection from '../components/FormSection';
import SelectField from '../components/SelectField';
import InputField from '../components/InputField';
import DateField from '../components/DateField';
import CboInput from '../components/CboInput';
import PhoneInput from '../components/PhoneInput';
import {
  identidadeGeneroOptions,
  gestanteOptions,
  racaOptions,
  escolaridadeOptions
} from '@/features/notificationForms/types/OptionTypes';
import { FormData, FormChangeEvent } from '../types/FormTypes';

interface IdentificacaoSectionProps {
  formData: FormData;
  handleChange: (e: FormChangeEvent) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  isExpanded: boolean;
  toggleSection: () => void;
}

const IdentificacaoSection: React.FC<IdentificacaoSectionProps> = ({
  formData,
  handleChange,
  setFormData,
  isExpanded,
  toggleSection
}) => {
  // Handler para o botão de pesquisa de paciente
  const handlePacienteSearch = () => {
    // Implementar lógica de pesquisa ou mostrar modal
    console.log("Pesquisando paciente:", formData.paciente);
  };

  // Botão de pesquisa para o campo de paciente
  const searchButton = (
    <button
      type="button"
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      onClick={handlePacienteSearch}
    >
      <Search className="h-4 w-4" />
      <span>Pesquisar</span>
    </button>
  );

  return (
    <FormSection
      title="3. Identificação do indivíduo"
      icon={<User className="h-5 w-5 text-purple-500" />}
      isExpanded={isExpanded}
      onToggle={toggleSection}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome do Paciente */}
        <InputField
          label="Nome"
          name="paciente"
          value={formData.paciente}
          onChange={handleChange}
          placeholder="Nome do paciente"
          rightButton={searchButton}
        />

        {/* Nome da Mãe */}
        <InputField
          label="Nome da Mãe"
          name="nomeMae"
          value={formData.nomeMae}
          onChange={handleChange}
          placeholder="Nome da mãe do paciente"
        />

        {/* Data de Nascimento */}
        <DateField
          label="Data de Nascimento"
          name="dataNascimento"
          value={formData.dataNascimento}
          onChange={handleChange}
        />

        {/* Idade */}
        <InputField
          label="Idade"
          name="idade"
          value={formData.idade}
          onChange={handleChange}
          placeholder="Digite a idade"
          type="number"
        />

        {/* CPF */}
        <InputField
          label="CPF"
          name="cpf"
          value={formData.cpf}
          onChange={handleChange}
          placeholder="XXX.XXX.XXX-XX"
        />

        {/* Identidade de Gênero */}
        <SelectField
          label="Identidade de Gênero"
          name="identidadeGenero"
          value={formData.identidadeGenero}
          options={identidadeGeneroOptions}
          onChange={handleChange}
        />

        {/* Gestante (condicional) */}
        {formData.identidadeGenero === "1" && (
          <SelectField
            label="Gestante"
            name="gestante"
            value={formData.gestante}
            options={gestanteOptions}
            onChange={handleChange}
          />
        )}

        {/* Raça */}
        <SelectField
          label="Raça"
          name="raca"
          value={formData.raca}
          options={racaOptions}
          onChange={handleChange}
        />

        {/* Escolaridade */}
        <SelectField
          label="Escolaridade"
          name="escolaridade"
          value={formData.escolaridade}
          options={escolaridadeOptions}
          onChange={handleChange}
        />

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
    </FormSection>
  );
};

export default IdentificacaoSection;