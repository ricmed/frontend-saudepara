import React from 'react';
import { User, X, HelpCircle } from 'lucide-react';
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
  // ✅ REMOVIDO: Estados e validação de CPF duplicado (conforme solicitação)
  // const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);
  // const [isValidCPF, setIsValidCPF] = useState<boolean>(false);

  // Função auxiliar para formatar CPF (remover caracteres não numéricos)
  const formatCPF = (cpf: string) => {
    return cpf.replace(/\D/g, "").slice(0, 11);
  };
  
  // ✅ SIMPLIFICADO: Apenas formatar CPF sem validação de duplicidade
  const handleCPFChangeWithValidation = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedCPF = formatCPF(rawValue);

    setFormData((prev) => ({
      ...prev,
      cpf: formattedCPF,
    }));

    // Limpar erro anterior
    if (errors.cpf) {
      setErrors((prev: Record<string, string>) => {
        const newErrors = { ...prev };
        delete newErrors.cpf;
        return newErrors;
      });
    }
  };

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
                {/* ✅ REMOVIDO: Botão azul de buscar paciente (conforme solicitação) */}
                <input
                  type="text"
                  name="paciente"
                  placeholder="Nome do paciente"
                  className={`w-full p-3 border ${
                    errors.paciente
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200"
                  } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                  value={formData.paciente}
                  onChange={handlePacienteChange}
                  maxLength={100}
                  data-error={errors.paciente ? "true" : "false"}
                />

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
              required
            />

            {/* Sexo ao nascimento (SINAN) */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Sexo ao nascimento <span className="text-red-500">*</span>
              </label>
              <select
                name="sexoNascimento"
                className={`w-full p-3 border ${
                  errors.sexoNascimento
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200"
                } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                value={formData.sexoNascimento ?? ""}
                onChange={handleChange}
                data-error={errors.sexoNascimento ? "true" : "false"}
              >
                <option value="">Selecione</option>
                <option value="1">Masculino</option>
                <option value="2">Feminino</option>
                <option value="3">Intersexo</option>
                <option value="9">Ignorado</option>
              </select>
              {errors.sexoNascimento && (
                <p className="mt-1 text-sm text-red-500">{errors.sexoNascimento}</p>
              )}
            </div>

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
            </div>            {/* Idade com Lógica Melhorada */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Idade
                {formData.dataNascimento && (
                  <span className="text-xs text-gray-500 ml-2">
                    (calculada automaticamente)
                  </span>
                )}
              </label>
              
              {formData.dataNascimento ? (
                // Mostrar idade calculada quando há data de nascimento
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  <span className="font-medium">
                    {(() => {
                      const totalMeses = parseInt(formData.idadeMeses) || 0;
                      const anos = parseInt(formData.idade) || 0;
                      
                      // Se tem menos de 12 meses, mostrar só os meses
                      if (totalMeses < 12) {
                        return `${totalMeses} ${totalMeses === 1 ? 'mês' : 'meses'}`;
                      }
                      // Se tem 12 meses ou mais, mostrar só os anos
                      else {
                        return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
                      }
                    })()}
                  </span>
                </div>
              ) : (
                // Permitir edição manual quando não há data de nascimento
                <div className="flex items-center gap-2">
                  <select
                    name="idadeUnidade"
                    value={formData.idadeUnidade}
                    onChange={handleChange}
                    className="p-3 border border-gray-200 rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  >
                    <option value="anos">Anos</option>
                    <option value="meses">Meses</option>
                  </select>

                  <input
                    type="number"
                    name={formData.idadeUnidade === 'anos' ? 'idade' : 'idadeMeses'}
                    value={formData.idadeUnidade === 'anos' ? formData.idade : formData.idadeMeses}
                    onChange={handleChange}
                    placeholder={formData.idadeUnidade === 'anos' ? 'Anos' : 'Meses'}
                    min="0"
                    max={formData.idadeUnidade === 'anos' ? "120" : "11"}
                    className={`w-full p-3 border ${
                      (formData.idadeUnidade === 'anos' && errors.idade) || 
                      (formData.idadeUnidade === 'meses' && errors.idadeMeses)
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200"
                    } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                  />
                </div>
              )}
              
              {(errors.idade || errors.idadeMeses || errors.dataNascimento) && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.dataNascimento || errors.idade || errors.idadeMeses}
                </p>
              )}
            </div>

            {/* É estrangeiro? */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                É estrangeiro? <span className="text-red-500">*</span>
              </label>
              <select
                name="eEstrangeiro"
                className={`w-full p-3 border ${
                  errors.eEstrangeiro
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200"
                } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                value={formData.eEstrangeiro ?? ""}
                onChange={handleChange}
                data-error={errors.eEstrangeiro ? "true" : "false"}
              >
                <option value="">Selecione</option>
                <option value="2">Não</option>
                <option value="1">Sim</option>
              </select>
              {errors.eEstrangeiro && (
                <p className="mt-1 text-sm text-red-500">{errors.eEstrangeiro}</p>
              )}
            </div>

            {/* CPF */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                CPF
                {formData.eEstrangeiro === "2" && (
                  <span className="text-red-500"> *</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="cpf"
                  data-testid="notif-field-cpf"
                  placeholder="000.000.000-00"
                  className={`w-full p-3 border ${
                    errors.cpf
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200"
                  } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                  value={
                    formData.cpf ? displayFormattedCPF(formData.cpf) : ""
                  }
                  onChange={handleCPFChangeWithValidation}
                  maxLength={14}
                  data-error={errors.cpf ? "true" : "false"}
                />
                {/* ✅ REMOVIDO: Ícone de validação de CPF */}
              </div>
              {errors.cpf && (
                <p className="mt-1 text-sm text-red-500" data-testid="notif-cpf-error">
                  {errors.cpf}
                </p>
              )}
              {/* ✅ REMOVIDO: Mensagem "CPF válido e disponível para cadastro" */}
            </div>

            {/* CNS — obrigatório se não houver CPF válido (não estrangeiro) */}
            {formData.eEstrangeiro === "2" && (
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  CNS (Cartão SUS)
                  {(!formData.cpf || formData.cpf.replace(/\D/g, "").length !== 11) && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>
                <input
                  type="text"
                  name="cns"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Somente números (15 dígitos)"
                  className={`w-full p-3 border ${
                    errors.cns ? "border-red-500 bg-red-50" : "border-gray-200"
                  } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                  value={formData.cns ?? ""}
                  onChange={handleChange}
                  maxLength={18}
                  data-error={errors.cns ? "true" : "false"}
                />
                {errors.cns && (
                  <p className="mt-1 text-sm text-red-500">{errors.cns}</p>
                )}
              </div>
            )}

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

            {/* Gestante — visível quando sexo ao nascimento = Feminino (SINAN) */}
            {formData.sexoNascimento === "2" && (
              <FormField
                label="Gestante"
                name="gestante"
                value={formData.gestante}
                onChange={handleChange}
                type="select"
                required
                error={errors.gestante}
                options={[
                  { value: "T1", label: "1º trimestre" },
                  { value: "T2", label: "2º trimestre" },
                  { value: "T3", label: "3º trimestre" },
                  { value: "TI", label: "Idade gestacional ignorada" },
                  { value: "N", label: "Não" },
                  { value: "NA", label: "Não se aplica" },
                  { value: "9", label: "Ignorado" },
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
              required
              error={errors.escolaridade}
              options={
                escolaridadeOptions?.map((option) => ({
                  value: option.idtipo_escolaridade.toString(),
                  label: option.descricao
                })) || []
              }
            />

            {/* Profissão/Ocupação com pesquisa */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Profissão/Ocupação (CBO) <span className="text-red-500">*</span>
              </label>
              <CboInput
                name="profissao"
                value={formData.profissao}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    profissao: value,
                  }));
                  if (errors.profissao) {
                    setErrors((prev: Record<string, string>) => {
                      const next = { ...prev };
                      delete next.profissao;
                      return next;
                    });
                  }
                }}
                placeholder="Pesquisar profissão"
                label=""
              />
              {errors.profissao && (
                <p className="mt-1 text-sm text-red-500">{errors.profissao}</p>
              )}
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
                label="Contato Telefônico *"
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