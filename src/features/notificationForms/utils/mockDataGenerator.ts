// src/features/notificationForms/utils/mockDataGenerator.ts
import { FormData, detectUserTimezone } from '../types/index2';

// 🎯 GERADOR DE DADOS FICTÍCIOS PARA FORMULÁRIO DE NOTIFICAÇÃO

// Arrays de dados realistas para geração aleatória
const NOMES_MASCULINOS = [
  'João Silva', 'Pedro Santos', 'Carlos Oliveira', 'José Souza', 'Antonio Costa',
  'Fernando Lima', 'Ricardo Mendes', 'Paulo Alves', 'Marco Rocha', 'Bruno Ferreira',
  'Leonardo Carvalho', 'Rafael Barbosa', 'Gabriel Martins', 'Diego Ribeiro', 'Thiago Gomes',
  'Mateus Pereira', 'Felipe Araújo', 'Lucas Nascimento', 'Gustavo Cardoso', 'Daniel Pinto'
];

const NOMES_FEMININOS = [
  'Maria Silva', 'Ana Santos', 'Carla Oliveira', 'Paula Souza', 'Fernanda Costa',
  'Juliana Lima', 'Patrícia Mendes', 'Sandra Alves', 'Márcia Rocha', 'Cristina Ferreira',
  'Luciana Carvalho', 'Adriana Barbosa', 'Gabriela Martins', 'Daniela Ribeiro', 'Tatiana Gomes',
  'Natália Pereira', 'Camila Araújo', 'Larissa Nascimento', 'Bianca Cardoso', 'Roberta Pinto'
];

const NOMES_MAES = [
  'Maria dos Santos', 'Ana da Silva', 'Rosa Oliveira', 'Carmen Souza', 'Helena Costa',
  'Antonia Lima', 'Francisca Mendes', 'Josefa Alves', 'Luiza Rocha', 'Conceição Ferreira',
  'Socorro Carvalho', 'Raimunda Barbosa', 'Benedita Martins', 'Terezinha Ribeiro', 'Nazaré Gomes'
];

const BAIRROS_BELEM_IDS = [
  15, // Batista Campos
  2,  // Campina  
  8,  // Marco
  14, // Nazaré
  7,  // Pedreira
  3,  // Reduto
  4,  // Umarizal
];

const MUNICIPIOS_PARA_IDS = [
  1651, // Belém (assumindo que existe, senão usar Ananindeua)
  161,  // Ananindeua
];

const SINTOMAS_IDS = [
  193, // Adenomegalia
  176, // Anorexia
  202, // Apnéia
  178, // Astenia
  197, // Calafrios
  203, // Cianose
  242, // Confusão mental
  205, // Congestão nasal
  192, // Conjuntivite
  216, // Constipação
];

const HIPOTESES_DIAGNOSTICAS_IDS = [
  16, // BOTULISMO
  4,  // CAXUMBA
  28, // CHIKUNGUNYA
  15, // CÓLERA
  12, // COQUELUCHE
  10, // COVID 19
  27, // DENGUE
  13, // DFTERIA
  8,  // DOENÇA DE CHAGAS AGUDA
  20, // DOENÇA MENINGOCÓCICA
];

const TRAUMAS_IDS = [
  3,  // AFOGAMENTO
  4,  // AGRESSÃO FÍSICA
  5,  // AGRESSÃO SEXUAL
  6,  // ATAQUE ANIMAL/INSETO
  7,  // CONTUSAO
  8,  // CORTE/INCISAO/PERFURACAO
  9,  // DISTENSÃO
  10, // ENTORSE/LUXACAO
  11, // ESCORIAÇÃO
];

// 👨‍💼 IDs de profissões (CBO) confirmados do backend
const PROFISSOES_CBO_IDS = [
  2695, // Estudante
  2696, // Do lar  
  125,  // Comerciante atacadista
  532,  // Professor
  717,  // Administrador
  652,  // Advogado
  1548, // Vendedor permissionário
  2333, // Trabalhador portuário
  2576, // Abatedor
  2577, // Açougueiro
  2332, // Ajudante de motorista
  1826, // Acabador de superfícies de concreto
  1372, // Administrador de edifícios
  726,  // Administrador de fundos e carteiras
  239,  // Administrador de banco de dados
  1649, // Adestrador de animais
  1219, // Acrobata
  240,  // Administrador de redes
  657,  // Advogado (áreas especiais)
  658   // Advogado (direito do trabalho)
];

// 🏥 IDs de estabelecimentos reais ativos para notificações
// Baseado na lista oficial de estabelecimentos ativos fornecida
const ESTABELECIMENTOS_NOTIFICADORES_IDS = [
  // Hospitais e UPAs (mais prováveis para notificações de urgência)
  12131, // HOSPITAL MAGALHAES
  12178, // UNIDADE DE PRONTO ATENDIMENTO UPA BRAGANCA
  12187, // UPA MARAMBAIA
  12209, // UPA 24H DR HAROLDO MARTINS
  12220, // HOSPITAL REGIONAL DO BAIXO TOCANTINS HOSPITAL SANTA ROSA
  12244, // UPA JURUNAS
  12337, // HOSPITAL REGIONAL PUBLICO DE CASTANHAL
  12343, // HOSPITAL GERAL DE PARAGOMINAS
  12374, // HOSPITAL GERAL PUBLICO CASTELO DOS SONHOS
  12451, // HCMB HOSPITAL CENTRAL MARABA
  
  // USFs e UBS (comuns para casos ambulatoriais)
  12132, // USF DR LUIS CHARLET
  12133, // USF SAO JOAO 1 E 2
  12174, // UBS MANOEL DE JESUS QUEIROZ
  12238, // USF VILA DO TATU
  12239, // USF VILA NOVA ESPERANCA
  12248, // UNIDADE BASICA DE SAUDE PORTAL DA AMAZONIA
  12249, // UNIDADE BASICA DE SAUDE CASTANHEIRA
  12361, // UBS ANDRES SENA PACHECO
  
  // Centros de Saúde e Especialidades
  12160, // CENTRO DE SAUDE DR EVALDO AZEVEDO
  12281, // CENTRO DE SAUDE CIDADE NOVA
  12129, // CAE CENTRO DE ATENDIMENTO ESPECIALIZADO
  12146, // CAPS CENTRO DE ATENCAO PSICOSSOCIAL
  
  // Clínicas especializadas
  12134, // CLINICA DE ACIDENT SAO FRANCISCO
  12163, // CLINICA PROCARDIACO LTDA
  12171, // CLINICA ODONTO MEDIC
  12200, // CLINICA CABANAGEM
  12172, // CLINICA DE ESPECIALIDADES HERMOGENEO PELEGRINI
  
  // Postos de Saúde rurais/locais
  12145, // POSTO DE SAUDE HILARIO DOS REIS E SILVA
  12150, // POSTO DE SAUDE ALTINO LAMEIRA
  12151, // POSTO DE SAUDE IRACEMA
  12152, // POSTO DE SAUDE ITAQUI
  12153, // POSTO DE SAUDE NAZARE
  12156, // POSTO DE SAUDE BOA VISTA
  12157, // POSTO DE SAUDE SAO LUCAS
  
  // USFs adicionais para diversidade
  12135, // USF MARIA TEREZA GODOT DA SILVA
  12136, // USF CASTELO BRANCO
  12137, // USF RAIMUNDO BRILHANTE CUNHA
  12138, // USF BACABAL
  12139, // USF FRANCISCO CORREA
  12147, // USF JOSE ALVES DE SOUZA
  12155, // USF 3 DE OUTUBRO
  12159, // USF FRANCISCO LOPES DA SILVA
  12164, // USF SANTA CATARINA
];

// Função para gerar CPF válido (formato)
function gerarCPF(): string {
  const numbers = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  
  // Calcular primeiro dígito verificador
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += numbers[i] * (10 - i);
  }
  const digit1 = ((sum1 * 10) % 11) % 10;
  
  // Calcular segundo dígito verificador
  let sum2 = 0;
  for (let i = 0; i < 9; i++) {
    sum2 += numbers[i] * (11 - i);
  }
  sum2 += digit1 * 2;
  const digit2 = ((sum2 * 10) % 11) % 10;
  
  return `${numbers.join('')}${digit1}${digit2}`;
}

// Função para gerar telefone
function gerarTelefone(): string {
  const ddd = '91'; // DDD de Belém
  const numero = '9' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${ddd}${numero}`;
}

// Função para gerar data aleatória nos últimos 30 dias
function gerarDataRecente(): string {
  const hoje = new Date();
  const diasAtras = Math.floor(Math.random() * 30);
  const data = new Date(hoje.getTime() - diasAtras * 24 * 60 * 60 * 1000);
  return data.toISOString().split('T')[0];
}

// Função para gerar data de nascimento realista
function gerarDataNascimento(): { data: string; idade: string; meses: string } {
  const hoje = new Date();
  const idade = Math.floor(Math.random() * 80) + 1; // Entre 1 e 80 anos
  const meses = Math.floor(Math.random() * 12); // 0-11 meses adicionais
  
  const anoNascimento = hoje.getFullYear() - idade;
  const mesNascimento = Math.floor(Math.random() * 12) + 1;
  const diaNascimento = Math.floor(Math.random() * 28) + 1; // Para evitar problemas com fevereiro
  
  const dataNascimento = `${anoNascimento}-${mesNascimento.toString().padStart(2, '0')}-${diaNascimento.toString().padStart(2, '0')}`;
  
  return {
    data: dataNascimento,
    idade: idade.toString(),
    meses: meses.toString()
  };
}

// Função para escolher elemento aleatório de array
function escolherAleatorio<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Função para escolher múltiplos elementos aleatórios
function escolherMultiplosAleatorios<T>(array: T[], min: number = 1, max?: number): T[] {
  const maxItems = max || Math.min(array.length, 3);
  const numItems = Math.floor(Math.random() * (maxItems - min + 1)) + min;
  const resultado: T[] = [];
  const arrayCopy = [...array];
  
  for (let i = 0; i < numItems && arrayCopy.length > 0; i++) {
    const index = Math.floor(Math.random() * arrayCopy.length);
    resultado.push(arrayCopy.splice(index, 1)[0]);
  }
  
  return resultado;
}

// 🎯 FUNÇÃO PRINCIPAL PARA GERAR CASO ALEATÓRIO
export function gerarCasoAleatorio(): FormData {
  // Determinar gênero primeiro para escolher nome apropriado
  const generos = ['Masculino', 'Feminino'];
  const genero = escolherAleatorio(generos);
  const nome = genero === 'Masculino' ? escolherAleatorio(NOMES_MASCULINOS) : escolherAleatorio(NOMES_FEMININOS);
  
  // Gerar dados de nascimento
  const nascimento = gerarDataNascimento();
  
  // Determinar se é de Belém (70% chance) ou outro município
  const eBelem = Math.random() < 0.7;
  const municipio = eBelem ? '1651' : escolherAleatorio(MUNICIPIOS_PARA_IDS).toString(); // Usando IDs
  const bairro = eBelem ? escolherAleatorio(BAIRROS_BELEM_IDS).toString() : '';  // Usando IDs
  
  // Determinar tipo de atendimento e sintomas relacionados
  const tiposAtendimento = ['3', '4', '6', '7']; // 3=CLINICO, 4=TRAUMA, 6=MÚLTIPLAS VÍTIMAS, 7=INCIDENTE QBRN
  const tipoAtendimento = escolherAleatorio(tiposAtendimento);
  
  // Sintomas baseados no tipo de atendimento
  let sintomas: number[];
  let hipoteses: number[];
  let traumas: number[] = []; // Agora pode ter múltiplos traumas
  
  if (tipoAtendimento === '4') { // TRAUMA
    sintomas = escolherMultiplosAleatorios(SINTOMAS_IDS, 1, 3);
    hipoteses = escolherMultiplosAleatorios(HIPOTESES_DIAGNOSTICAS_IDS, 1, 2);
    traumas = escolherMultiplosAleatorios(TRAUMAS_IDS, 1, 3); // Pode ter de 1 a 3 traumas
  } else if (tipoAtendimento === '6') { // MÚLTIPLAS VÍTIMAS
    sintomas = escolherMultiplosAleatorios(SINTOMAS_IDS, 2, 4);
    hipoteses = escolherMultiplosAleatorios(HIPOTESES_DIAGNOSTICAS_IDS, 1, 2);
    // Em múltiplas vítimas também pode haver traumas
    if (Math.random() > 0.5) {
      traumas = escolherMultiplosAleatorios(TRAUMAS_IDS, 1, 2);
    }
  } else {
    sintomas = escolherMultiplosAleatorios(SINTOMAS_IDS, 1, 4);
    hipoteses = escolherMultiplosAleatorios(HIPOTESES_DIAGNOSTICAS_IDS, 1, 2);
  }
  
  // Detectar timezone do usuário
  const timezoneInfo = detectUserTimezone();
  
  const casoAleatorio: FormData = {
    // Seção 1: Dados Gerais
    evento: escolherAleatorio(['3', '2']), // 3=COP30, 2=CÍRIO DE NAZARÉ 2025
    publicoAtendido: escolherAleatorio(['1', '2', '3', '4']), // 1=Participante, 2=Trab.evento, 3=Autoridade, 4=Outro
    localidadeEvento: '',
    localidadeEventoOutro: '',
    localidadeEventoAtual: null,

    // Seção 2: Procedência do indivíduo
    residenteBelem: eBelem ? 'S' : 'N', // S=Sim, N=Não (VarChar(1))
    bairro: bairro,
    municipio: municipio,
    uf: '15', // ID do estado do Pará (já estava correto)
    paisProcedencia: Math.random() < 0.9 ? '105' : escolherAleatorio(['13', '17', '23', '47']), // 105=Brasil, outros países aleatórios
    localHospedagem: eBelem ? '' : escolherAleatorio(['Hotel Plaza', 'Pousada Amazônia', 'Hotel Sagres', 'Ibis Belém', 'Casa de Hospedagem']),
    contatoLocal: eBelem ? '' : gerarTelefone(),

    // Seção 3: Identificação do indivíduo
    paciente: nome,
    nomeMae: escolherAleatorio(NOMES_MAES),
    dataNascimento: nascimento.data,
    idade: nascimento.idade,
    idadeMeses: nascimento.meses,
    idadeUnidade: 'anos' as 'anos',
    cpf: gerarCPF(),
    identidadeGenero: genero === 'Masculino' ? escolherAleatorio(['2', '4']) : escolherAleatorio(['1', '3']), // 1=Mulher cis, 2=Homem cis, 3=Mulher trans, 4=Homem trans
    gestante:
      genero === "Feminino" && parseInt(nascimento.idade) >= 15 && parseInt(nascimento.idade) <= 45
        ? escolherAleatorio(["1", "2"])
        : "",
    raca: escolherAleatorio(['1', '2', '3', '4', '5', '9']), // 1=Branca, 2=Preta, 3=Amarela, 4=Parda, 5=Indígena, 9=Ignorado
    escolaridade: escolherAleatorio(['1', '2', '3', '4', '5', '6', '7', '8', '9', '11']), // 1=Analfabeto, 2=Fund.incompleto, 3=Fund.completo, 4=Médio incompleto, 5=Médio completo, 6=Superior incompleto, 7=Superior completo, 8=Ignorado, 9=Não se aplica, 11=Pós-graduado
    profissao: escolherAleatorio(PROFISSOES_CBO_IDS).toString(),
    ddi: '+55',
    contatoTelefonico: gerarTelefone(),

    // Seção 4: Informações do atendimento
    tipoAtendimento: tipoAtendimento,
    sinaisESintomas: sintomas.map(s => s.toString()),
    dataInicioSintomas: gerarDataRecente(),
    observacaoSintomas: `Sintomas iniciaram ${Math.floor(Math.random() * 5) + 1} dias antes do atendimento.`,
    hipoteseDiagnostica: hipoteses.map(h => h.toString()),
    observacaoHipotese: `Hipótese baseada nos sintomas apresentados e histórico clínico.`,
    tipoTrauma: traumas.map(t => t.toString()), // Array com múltiplos traumas
    observacaoTrauma: traumas.length > 0 ? `Trauma ${escolherAleatorio(['leve', 'moderado', 'grave'])} observado durante o atendimento.` : '',
    relacionadoSurto: 'N', // Sempre 'N' conforme especificado
    observacaoIncidente: Math.random() < 0.3 ? `Possível relação com outros casos similares na região.` : '',

    // Seção 5: Informações da unidade notificadora
    dataAtendimento: gerarDataRecente(),
    unidadeNotificadora: escolherAleatorio(ESTABELECIMENTOS_NOTIFICADORES_IDS).toString(),
    nomeNotificador: escolherAleatorio([...NOMES_MASCULINOS, ...NOMES_FEMININOS]),
    contatoNotificador: gerarTelefone(),

    // Seção 6: Encerramento do Caso
    dataEncerramento: Math.random() < 0.7 ? gerarDataRecente() : '',
    tipoEncerramento: Math.random() < 0.7 ? escolherAleatorio(['1', '2', '3', '4']) : '', // 1=Atendido e Liberado, 2=Internacao, 3=Observacao, 4=Obito
    localEncaminhamento: Math.random() < 0.3 ? escolherAleatorio(ESTABELECIMENTOS_NOTIFICADORES_IDS).toString() : '',

    // Seção 7: Arquivos Anexos
    arquivos: [], // Vazio por padrão

    // Timezone automático
    timezone_name: timezoneInfo.timezone_name,
    timezone_offset_minutos: timezoneInfo.timezone_offset_minutos
  };

  return casoAleatorio;
}

// 🎯 FUNÇÃO PARA GERAR MÚLTIPLOS CASOS
export function gerarMultiplosCasos(quantidade: number): FormData[] {
  const casos: FormData[] = [];
  
  for (let i = 0; i < quantidade; i++) {
    casos.push(gerarCasoAleatorio());
  }
  
  console.log(`📊 Gerados ${quantidade} casos aleatórios`, casos);
  return casos;
}

// 🎯 FUNÇÃO PARA APLICAR CASO ALEATÓRIO AO FORMULÁRIO
export function aplicarCasoAleatorioAoFormulario(
  setFormData: (data: FormData) => void,
  setErrors?: (errors: any) => void
): void {
  try {
    const casoAleatorio = gerarCasoAleatorio();
    
    console.log('🎲 Aplicando caso aleatório ao formulário:', casoAleatorio);
    
    // Aplicar dados ao formulário
    setFormData(casoAleatorio);
    
    // Limpar erros se a função for fornecida
    if (setErrors) {
      setErrors({});
    }
    
    // Feedback visual
    console.log('✅ Caso aleatório aplicado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar caso aleatório:', error);
  }
}

// 🎯 PRESETS DE CASOS ESPECÍFICOS
export const PRESETS_CASOS = {
  turista_dengue: (): FormData => ({
    ...gerarCasoAleatorio(),
    evento: '3', // COP30
    publicoAtendido: '1', // Participante
    paisProcedencia: '23', // Alemanha
    residenteBelem: 'N', // N=Não (VarChar(1))
    localHospedagem: 'Hotel Plaza',
    sinaisESintomas: [197, 193, 176, 192].map(s => s.toString()), // IDs dos sintomas
    hipoteseDiagnostica: [27].map(h => h.toString()), // Dengue
    tipoAtendimento: '3' // Clínico
  }),
  
  local_trauma: (): FormData => ({
    ...gerarCasoAleatorio(),
    evento: '2', // Círio de Nazaré
    publicoAtendido: '1', // Participante
    residenteBelem: 'S', // S=Sim (VarChar(1))
    bairro: escolherAleatorio(BAIRROS_BELEM_IDS).toString(),
    tipoAtendimento: '4', // Trauma
    sinaisESintomas: [193, 176, 203].map(s => s.toString()), // IDs dos sintomas
    hipoteseDiagnostica: [16].map(h => h.toString()), // Botulismo
    tipoTrauma: ['7', '11'] // Múltiplos traumas: Contusão e Escoriação
  }),
  
  surto_alimentar: (): FormData => ({
    ...gerarCasoAleatorio(),
    evento: '3', // COP30
    publicoAtendido: '1', // Participante
    sinaisESintomas: [176, 216, 192, 202].map(s => s.toString()), // IDs dos sintomas
    hipoteseDiagnostica: [15].map(h => h.toString()), // Cólera
    relacionadoSurto: 'S',
    observacaoIncidente: 'Relato de consumo de alimentos em evento público'
  })
};

// 🎯 FUNÇÃO PARA APLICAR PRESET ESPECÍFICO
export function aplicarPreset(
  preset: keyof typeof PRESETS_CASOS,
  setFormData: (data: FormData) => void,
  setErrors?: (errors: any) => void
): void {
  try {
    const casoPreset = PRESETS_CASOS[preset]();
    
    console.log(`🎯 Aplicando preset "${preset}":`, casoPreset);
    
    setFormData(casoPreset);
    
    if (setErrors) {
      setErrors({});
    }
    
    console.log(`✅ Preset "${preset}" aplicado com sucesso!`);
    
  } catch (error) {
    console.error(`❌ Erro ao aplicar preset "${preset}":`, error);
  }
}
