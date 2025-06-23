// src/features/notificationForms/components/sections/PersonIdentificationSection.tsx
import React, { useState, useEffect } from 'react';
import { User, Search, X, HelpCircle } from 'lucide-react';
import { FormSectionProps } from '@/features/notificationForms/types/index2';
import SectionHeader from '../shared/SectionHeader';
import FormField from '../shared/FormField';
import CustomDateInput from '@/features/notificationForms/components/CustomDateInput';
import CboInput from '@/features/notificationForms/components/CboInput';
import PhoneInput from '@/features/notificationForms/components/PhoneInput';
import { displayFormattedCPF } from '../../utils/formUtils';

interface PersonIdentificationSectionProps extends FormSectionProps {
  pacienteSuggestions: any[];
  showSuggestions: boolean;
  isCreatingNewPatient: boolean;
  handlePacienteChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectPaciente: (paciente: any) => void;
  criarNovoPaciente: () => void;
  setIsPatientModalOpen: (isOpen: boolean) => void;
  showGenderHelp: boolean;
  setShowGenderHelp: (show: boolean) => void;
  generoOptions: any[];
  racaOptions: any[];
  escolaridadeOptions: any[];
  setErrors: (errors: any) => void;
  originalCpf: string;
  checkCpfOfflineSafe: (cpf: string) => Promise<boolean>;
}

const PersonIdentificationSection: React.FC<PersonIdentificationSectionProps> = ({
  formData,
  setFormData,
  errors,
  handleChange,
  isExpanded,
  toggleSection,
  pacienteSuggestions,
  showSuggestions,
  isCreatingNewPatient,
  handlePacienteChange,
  handleSelectPaciente,
  criarNovoPaciente,
  setIsPatientModalOpen,
  showGenderHelp,
  setShowGenderHelp,
  generoOptions,
  racaOptions,
  escolaridadeOptions,
  setErrors,
  originalCpf,
  checkCpfOfflineSafe
}) => {
  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);
  const [isValidCPF, setIsValidCPF] = useState<boolean>(false);

  // Função auxiliar para formatar CPF (remover caracteres não numéricos)
  const formatCPF = (cpf: string) => {
    return cpf.replace(/\D/g, "").slice(0, 11);
  };  // Função para verificar CPF existente usando o serviço offline/online
  const handleCPFChangeWithValidation = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedCPF = formatCPF(rawValue);

    setFormData((prev) => ({
      ...prev,
      cpf: formattedCPF,
    }));

    // Resetar estados de validação
    setIsValidCPF(false);
    
    // Limpar erro anterior
    if (errors.cpf) {
      setErrors((prev: Record<string, string>) => {
        const newErrors = { ...prev };
        delete newErrors.cpf;
        return newErrors;
      });
    }
      // Se o CPF tem menos de 11 dígitos, não validar e limpar estados
    if (formattedCPF.length < 11) {
      setIsValidCPF(false);
      // Limpar timer se existir
      if (typingTimer) {
        clearTimeout(typingTimer);
        setTypingTimer(null);
      }
      return;
    }
    
    // Só verificar com 11 dígitos - caso contrário não é um CPF válido
    if (formattedCPF.length === 11) {
      // Verificar se é o CPF original (modo edição) - não deve mostrar erro
      if (formattedCPF === originalCpf) {
        setIsValidCPF(true);
        setErrors((prev: Record<string, string>) => {
          const newErrors = { ...prev };
          delete newErrors.cpf;
          return newErrors;
        });
        return;
      }

      // Limpar timeout anterior
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
      
      // Usar um timer para debounce
      const timer = setTimeout(async () => {
        try {
          // Adicionar feedback visual durante a verificação
          setErrors((prev: Record<string, string>) => ({
            ...prev,
            cpf: "Verificando CPF..."
          }));
          
          // ✅ USAR SISTEMA OFFLINE/ONLINE INTEGRADO
          const exists = await checkCpfOfflineSafe(formattedCPF);
          
          if (exists) {
            // Se o CPF já existe no sistema, mostramos erro
            setIsValidCPF(false);
            setErrors((prev: Record<string, string>) => ({
              ...prev,
              cpf: "CPF já cadastrado no sistema"
            }));
          } else {
            // CPF não existe no sistema - é VÁLIDO para uso
            setIsValidCPF(true);
            
            // Limpar o erro de verificação
            setErrors((prev: Record<string, string>) => {
              const newErrors = { ...prev };
              delete newErrors.cpf;
              return newErrors;
            });
          }
        } catch (error) {
          console.error("Erro ao verificar CPF:", error);
          setIsValidCPF(false);
          
          // Limpar mensagem de verificação
          setErrors((prev: Record<string, string>) => {
            const newErrors = { ...prev };
            delete newErrors.cpf;
            return newErrors;
          });
        }
      }, 300);
      
      setTypingTimer(timer);
    }
  };

  // Limpar o timer quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
    };
  }, [typingTimer]);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <SectionHeader
        icon={<User className="h-5 w-5 text-purple-500" />}
        title="3. Identificação do indivíduo"
        isExpanded={isExpanded}
        onToggle={toggleSection}
      />
      
      {isExpanded && (
        <div className="p-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome do Paciente */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Nome <span className="text-red-500">*</span>
              </label>
              <div className="relative paciente-suggestions-area">
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="paciente"
                    placeholder="Nome do paciente"
                    className={`flex-1 p-3 border ${
                      errors.paciente
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200"
                    } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                    value={formData.paciente}
                    onChange={handlePacienteChange}
                    maxLength={100}
                    data-error={errors.paciente ? "true" : "false"}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPatientModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    <span>Pesquisar</span>
                  </button>
                </div>

                {/* Mostrar sugestões */}
                {showSuggestions && pacienteSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {pacienteSuggestions.map((paciente) => (
                      <button
                        key={paciente.idpaciente}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 text-sm text-gray-700 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          handleSelectPaciente(paciente);
                        }}
                      >
                        <div className="font-medium">{paciente.nome}</div>
                        <div className="text-xs text-gray-500">
                          {paciente.data_nascimento
                            ? `Nascimento: ${new Date(paciente.data_nascimento).toLocaleDateString()}`
                            : ""}
                          {paciente.cpf ? ` | CPF: ${paciente.cpf}` : ""}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Mensagem quando não há resultados */}
                {showSuggestions &&
                  formData.paciente.length >= 3 &&
                  pacienteSuggestions.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
                      <p className="text-sm text-gray-600">
                        Nenhum paciente encontrado.
                      </p>
                      <button
                        type="button"
                        className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        onClick={criarNovoPaciente}
                        disabled={isCreatingNewPatient}
                      >
                        {isCreatingNewPatient
                          ? "Criando..."
                          : "Criar novo paciente"}
                      </button>
                    </div>
                  )}
              </div>
              {errors.paciente && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.paciente}
                </p>
              )}

              {/* Mostra o ID do paciente quando for selecionado */}
              {formData.pacienteId && (
                <p className="mt-1 text-xs text-blue-500">
                  ID do paciente: {formData.pacienteId}
                </p>
              )}
            </div>

            {/* Nome da Mãe */}
            <FormField
              label="Nome da Mãe"
              name="nomeMae"
              value={formData.nomeMae}
              onChange={handleChange}
              placeholder="Nome da mãe do paciente"
              error={errors.nomeMae}
              maxLength={100}
            />

            {/* Data de Nascimento */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Data de Nascimento
              </label>
              <CustomDateInput
                name="dataNascimento"
                className={`w-full p-3 border ${
                  errors.dataNascimento
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200"
                } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                value={formData.dataNascimento}
                onChange={handleChange}
                data-error={errors.dataNascimento ? "true" : "false"}
              />
              {errors.dataNascimento && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.dataNascimento}
                </p>
              )}
            </div>

            {/* Idade */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Idade
              </label>
              <input
                type="number"
                name="idade"
                placeholder={
                  formData.dataNascimento
                    ? "Calculada automaticamente"
                    : "Digite a idade"
                }
                className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                value={formData.idade}
                onChange={(e) => {
                  // Obter o valor digitado
                  const value = e.target.value;

                  // Verificar se é um número válido e não maior que 120
                  const numValue = parseInt(value);
                  if (!isNaN(numValue) && numValue > 120) {
                    // Se for maior que 120, mostrar erro
                    setFormData(prev => ({
                      ...prev,
                      idade: value
                    }));
                    return;
                  }

                  // Limitar a 3 caracteres e processar normalmente
                  if (value.length <= 3) {
                    handleChange({
                      target: {
                        name: "idade",
                        value: value,
                      },
                    } as React.ChangeEvent<HTMLInputElement>);
                  }
                }}
                disabled={!!formData.dataNascimento}
                max={120}
              />
              {formData.dataNascimento && (
                <p className="mt-1 text-xs text-gray-500">
                  Idade calculada a partir da data de nascimento
                </p>
              )}
              {errors.idade && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.idade}
                </p>
              )}
            </div>

            {/* CPF */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                CPF
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="cpf"
                  placeholder="000.000.000-00"
                  className={`w-full p-3 border ${
                    errors.cpf
                      ? "border-red-500 bg-red-50"
                      : isValidCPF
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200"
                  } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                  value={
                    formData.cpf ? displayFormattedCPF(formData.cpf) : ""
                  }
                  onChange={handleCPFChangeWithValidation}
                  maxLength={14}
                  data-error={errors.cpf ? "true" : "false"}
                  data-valid={isValidCPF ? "true" : "false"}
                />
                {isValidCPF && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg 
                      className="h-5 w-5 text-green-500" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>
                )}
              </div>
              {errors.cpf && (
                <p className="mt-1 text-sm text-red-500">{errors.cpf}</p>
              )}
              {isValidCPF && (
                <p className="mt-1 text-sm text-green-500">CPF válido e disponível para cadastro</p>
              )}
            </div>

            {/* Identidade de Gênero */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="font-medium text-gray-700">
                  Identidade de Gênero{" "}
                  <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowGenderHelp(!showGenderHelp)}
                  className="text-gray-500 hover:text-blue-600 transition-colors focus:outline-none"
                  aria-label="Ajuda sobre identidade de gênero"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>

              {showGenderHelp && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-gray-700 relative">
                  <button
                    type="button"
                    onClick={() => setShowGenderHelp(false)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    aria-label="Fechar ajuda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <h4 className="font-medium text-blue-700 mb-2">
                    Entendendo Identidade de Gênero:
                  </h4>
                  <ul className="space-y-1.5">
                    <li>
                      <strong>Mulher cisgênero:</strong> Pessoa nascida
                      com sexo feminino que se identifica como mulher.
                    </li>
                    <li>
                      <strong>Homem cisgênero:</strong> Pessoa nascida com
                      sexo masculino que se identifica como homem.
                    </li>
                    <li>
                      <strong>Mulher transgênero:</strong> Pessoa nascida
                      com sexo masculino que se identifica como mulher.
                    </li>
                    <li>
                      <strong>Homem transgênero:</strong> Pessoa nascida
                      com sexo feminino que se identifica como homem.
                    </li>
                    <li>
                      <strong>Travesti:</strong> Pessoa designada como
                      homem ao nascer que se expressa no gênero feminino.
                    </li>
                    <li>
                      <strong>Não binário:</strong> Pessoa cuja identidade
                      não se limita ao binário masculino/feminino.
                    </li>
                    <li>
                      <strong>Não se aplica:</strong> Quando a identidade
                      de gênero não é relevante para o atendimento.
                    </li>
                    <li>
                      <strong>Ignorado:</strong> Quando a informação não
                      está disponível.
                    </li>
                  </ul>
                </div>
              )}

              <select
                name="identidadeGenero"
                className={`w-full p-3 border ${
                  errors.identidadeGenero
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200"
                } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                value={formData.identidadeGenero}
                onChange={handleChange}
                data-error={errors.identidadeGenero ? "true" : "false"}
              >
                <option value="">Selecione</option>
                {generoOptions.map((option) => (
                  <option
                    key={option.idtipo_genero}
                    value={option.idtipo_genero}
                  >
                    {option.descricao}
                  </option>
                ))}
              </select>
              {errors.identidadeGenero && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.identidadeGenero}
                </p>
              )}
            </div>

            {/* Gestante (condicional) - Mulher cisgênero OU Homem transgênero */}
            {(formData.identidadeGenero === "1" || formData.identidadeGenero === "4") && (
              <FormField
                label="Gestante"
                name="gestante"
                value={formData.gestante}
                onChange={handleChange}
                type="select"
                error={errors.gestante}
                options={[
                  { value: "S", label: "Sim" },
                  { value: "N", label: "Não" }
                ]}
              />
            )}

            {/* Raça */}
            <FormField
              label="Raça"
              name="raca"
              value={formData.raca}
              onChange={handleChange}
              type="select"
              required
              error={errors.raca}
              options={
                racaOptions?.map((option) => ({
                  value: option.idtipo_raca.toString(),
                  label: option.descricao
                })) || []
              }
            />

            {/* Escolaridade */}
            <FormField
              label="Escolaridade"
              name="escolaridade"
              value={formData.escolaridade}
              onChange={handleChange}
              type="select"
              options={
                escolaridadeOptions?.map((option) => ({
                  value: option.idtipo_escolaridade.toString(),
                  label: option.descricao
                })) || []
              }
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
                ddi={formData.ddi}
                onChange={(value) => {
                  // Preserve the full phone number including country code
                  const formattedValue = value.slice(0, 20);

                  // Extrair o código do país e o número de telefone
                  let ddi = "55"; // Valor padrão (Brasil)
                  let phoneNumber = formattedValue;

                  // Se o valor tem formato +XX YYYYY, separar o DDI e o número
                  if (
                    formattedValue.startsWith("+") &&
                    formattedValue.includes(" ")
                  ) {
                    const parts = formattedValue.split(" ");
                    ddi = parts[0].replace("+", ""); // Remove o "+" do DDI
                    phoneNumber = parts.slice(1).join(" "); // O resto é o número
                  }

                  setFormData((prev) => ({
                    ...prev,
                    contatoTelefonico: phoneNumber,
                    ddi: ddi,
                  }));
                }}
                label="Contato Telefônico"
                placeholder="Digite o número de telefone"
              />
              {errors.contatoTelefonico && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.contatoTelefonico}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonIdentificationSection;