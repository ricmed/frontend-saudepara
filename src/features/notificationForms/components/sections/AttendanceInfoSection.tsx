import React, { useState, useEffect } from 'react';
import { ListChecks, Search, X, Info, HelpCircle } from 'lucide-react';
import { FormSectionProps } from '@/features/notificationForms/types/index2';
import SectionHeader from '../shared/SectionHeader';
import FormField from '../shared/FormField';
import SearchableCheckboxGroup from '../shared/SearchableCheckboxGroup';
import CustomDateInput from '@/features/notificationForms/components/CustomDateInput';
import { ListaSindromicaService } from '@/services/ListaSindromicaService';
import HipoteseDiagItem from '../shared/HipoteseDiagItem';

// Tipo para as explicações dos sintomas
type SintomaExplicacao = {
  titulo: string;
  explicacao: string;
  sinonimos: string[];
};

// Tipo para as props do componente
interface SintomaHelpButtonProps {
  sintoma: string;
}

// Base de dados de explicações para sintomas específicos do seu sistema
const sintomasExplicacoes: Record<string, SintomaExplicacao> = {
  'ADENOMEGALIA': {
    titulo: 'Adenomegalia',
    explicacao: 'Aumento do tamanho dos gânglios linfáticos (ínguas). Pode indicar infecção, inflamação ou outras doenças.',
    sinonimos: ['ínguas aumentadas', 'gânglios inchados', 'linfonodos aumentados']
  },
  'ANOREXIA': {
    titulo: 'Anorexia',
    explicacao: 'Perda do apetite ou falta de vontade de comer. Pode ser sintoma de várias doenças.',
    sinonimos: ['falta de apetite', 'inapetência', 'sem fome']
  },
  'APNEIA': {
    titulo: 'Apneia',
    explicacao: 'Parada temporária da respiração. Pode ser causada por obstrução das vias aéreas ou problemas neurológicos.',
    sinonimos: ['parada respiratória', 'interrupção da respiração']
  },
  'ASTENIA': {
    titulo: 'Astenia',
    explicacao: 'Fraqueza e cansaço extremo, com diminuição da força física e mental.',
    sinonimos: ['fraqueza', 'cansaço', 'fadiga', 'exaustão']
  },
  'CALAFRIOS': {
    titulo: 'Calafrios',
    explicacao: 'Sensação de frio com tremores involuntários, geralmente acompanha a febre.',
    sinonimos: ['tremores de frio', 'arrepios', 'tremedeira']
  },
  'CIANOSE': {
    titulo: 'Cianose',
    explicacao: 'Coloração azulada da pele e mucosas, indicando falta de oxigênio no sangue.',
    sinonimos: ['pele azulada', 'lábios roxos', 'falta de oxigênio']
  },
  'CONFUSAO MENTAL': {
    titulo: 'Confusão Mental',
    explicacao: 'Estado de desorientação, dificuldade de raciocínio e alteração da consciência.',
    sinonimos: ['desorientação', 'alteração mental', 'confusão']
  },
  'CONGESTAO NASAL': {
    titulo: 'Congestão Nasal',
    explicacao: 'Obstrução das vias nasais, dificultando a respiração pelo nariz.',
    sinonimos: ['nariz entupido', 'nariz obstruído', 'dificuldade para respirar pelo nariz']
  },
  'CONJUNTIVITE': {
    titulo: 'Conjuntivite',
    explicacao: 'Inflamação da conjuntiva (membrana que reveste o olho), causando vermelhidão e irritação.',
    sinonimos: ['olho vermelho', 'irritação no olho', 'inflamação ocular']
  },
  'CONSTIPACAO': {
    titulo: 'Constipação',
    explicacao: 'Dificuldade para evacuar, com fezes endurecidas e evacuações menos frequentes.',
    sinonimos: ['prisão de ventre', 'intestino preso', 'dificuldade para evacuar']
  },
  'CONTRACTURAS MUSCULARES': {
    titulo: 'Contraturas Musculares',
    explicacao: 'Tensão ou rigidez muscular involuntária, causando dor e limitação de movimento.',
    sinonimos: ['músculos contraídos', 'tensão muscular', 'rigidez muscular']
  },
  'CONVULSOES': {
    titulo: 'Convulsões',
    explicacao: 'Contrações musculares involuntárias e rítmicas, podem envolver perda de consciência.',
    sinonimos: ['ataques epilépticos', 'crises convulsivas', 'espasmos']
  },
  'CORIZA': {
    titulo: 'Coriza',
    explicacao: 'Secreção nasal líquida e abundante, comum em resfriados e alergias.',
    sinonimos: ['nariz escorrendo', 'secreção nasal', 'ranho']
  },
  'DIARREIA': {
    titulo: 'Diarreia',
    explicacao: 'Evacuações líquidas ou semilíquidas frequentes (3 ou mais por dia).',
    sinonimos: ['evacuação líquida', 'intestino solto', 'desarranjo intestinal']
  },
  'DIPLOPIA': {
    titulo: 'Diplopia',
    explicacao: 'Visão dupla, quando se vê duas imagens de um único objeto.',
    sinonimos: ['visão dupla', 'ver dobrado']
  },
  'DISARTRIA': {
    titulo: 'Disartria',
    explicacao: 'Dificuldade para articular palavras devido a problemas musculares ou neurológicos.',
    sinonimos: ['dificuldade para falar', 'fala pastosa', 'articulação deficiente']
  },
  'DISFAGIA': {
    titulo: 'Disfagia',
    explicacao: 'Dificuldade para engolir alimentos sólidos ou líquidos.',
    sinonimos: ['dificuldade para engolir', 'engolir difícil']
  },
  'DISTENSAO ABDOMINAL': {
    titulo: 'Distensão Abdominal',
    explicacao: 'Aumento do volume abdominal, sensação de barriga inchada.',
    sinonimos: ['barriga inchada', 'abdome dilatado', 'estufamento']
  },
  'DISTUBIOS GUSTATIVOS': {
    titulo: 'Distúrbios Gustativos',
    explicacao: 'Alterações no paladar, perda ou mudança no sabor dos alimentos.',
    sinonimos: ['perda do paladar', 'gosto alterado', 'sabor estranho']
  },
  'DISTUBIOS OLFATIVOS': {
    titulo: 'Distúrbios Olfativos',
    explicacao: 'Alterações no olfato, perda ou diminuição da capacidade de sentir odores.',
    sinonimos: ['perda do olfato', 'não sente cheiro', 'anosmia']
  },
  'DISURIA': {
    titulo: 'Disúria',
    explicacao: 'Dor ou dificuldade para urinar, sensação de queimação.',
    sinonimos: ['dor ao urinar', 'ardência para urinar', 'queimação ao urinar']
  },
  'DOR ABDOMINAL': {
    titulo: 'Dor Abdominal',
    explicacao: 'Dor localizada na região do abdome, pode ser em qualquer quadrante.',
    sinonimos: ['dor de barriga', 'dor no estômago', 'cólica abdominal']
  },
  'DOR DE CABECA': {
    titulo: 'Dor de Cabeça',
    explicacao: 'Dor na região craniana, pode ser localizada ou generalizada.',
    sinonimos: ['cefaleia', 'enxaqueca', 'dor na cabeça']
  },
  'DOR LOMBAR': {
    titulo: 'Dor Lombar',
    explicacao: 'Dor na região inferior das costas, pode irradiar para as pernas.',
    sinonimos: ['dor nas costas', 'lombalgia', 'dor na lombar']
  },
  'DOR MUSCULAR': {
    titulo: 'Dor Muscular',
    explicacao: 'Dor nos músculos, pode ser localizada ou generalizada.',
    sinonimos: ['mialgia', 'dor nos músculos', 'dor muscular']
  },
  'DOR NA GARGANTA': {
    titulo: 'Dor na Garganta',
    explicacao: 'Dor ou irritação na região da garganta, comum em infecções.',
    sinonimos: ['garganta dolorida', 'odinofagia', 'garganta inflamada']
  },
  'DOR NAS ARTICULACOES': {
    titulo: 'Dor nas Articulações',
    explicacao: 'Dor nas juntas do corpo, pode indicar inflamação ou lesão.',
    sinonimos: ['artralgia', 'dor articular', 'juntas doloridas']
  },
  'DOR NOS OLHOS': {
    titulo: 'Dor nos Olhos',
    explicacao: 'Dor ou desconforto ocular, pode ser superficial ou profunda.',
    sinonimos: ['dor ocular', 'olho dolorido']
  },
  'DOR RETROORBITARIA': {
    titulo: 'Dor Retroorbitária',
    explicacao: 'Dor localizada atrás dos olhos, comum em sinusites e enxaquecas.',
    sinonimos: ['dor atrás dos olhos', 'dor orbital']
  },
  'DOR TORACICA': {
    titulo: 'Dor Torácica',
    explicacao: 'Dor na região do peito, pode ter diversas causas cardíacas ou não cardíacas.',
    sinonimos: ['dor no peito', 'dor precordial']
  },
  'EDEMA DE FACE': {
    titulo: 'Edema de Face',
    explicacao: 'Inchaço na região facial, pode indicar problemas renais, cardíacos ou alérgicos.',
    sinonimos: ['inchaço no rosto', 'face inchada', 'rosto inchado']
  },
  'EDEMA PERIARTICULAR': {
    titulo: 'Edema Periarticular',
    explicacao: 'Inchaço ao redor das articulações, indica inflamação local.',
    sinonimos: ['inchaço nas juntas', 'articulações inchadas']
  },
  'EMAGRECIMENTO': {
    titulo: 'Emagrecimento',
    explicacao: 'Perda de peso não intencional, pode indicar várias doenças.',
    sinonimos: ['perda de peso', 'magreza', 'adelgaçamento']
  },
  'ENGASGO': {
    titulo: 'Engasgo',
    explicacao: 'Obstrução parcial ou total das vias respiratórias por alimento ou objeto.',
    sinonimos: ['sufocamento', 'asfixia', 'obstrução respiratória']
  },
  'EQUIMOSES': {
    titulo: 'Equimoses',
    explicacao: 'Manchas roxas na pele causadas por sangramento subcutâneo.',
    sinonimos: ['hematomas', 'roxos', 'manchas roxas']
  },
  'ERUPCOES CUTANEAS': {
    titulo: 'Erupções Cutâneas',
    explicacao: 'Alterações na pele como manchas, bolhas ou descamação.',
    sinonimos: ['lesões de pele', 'manchas na pele', 'rash cutâneo']
  },
  'ERUPCOES CUTANEAS DOLOROSAS': {
    titulo: 'Erupções Cutâneas Dolorosas',
    explicacao: 'Lesões na pele que causam dor, como vesículas ou ulcerações.',
    sinonimos: ['lesões dolorosas', 'feridas na pele', 'erupções que doem']
  },
  'ESPLENOMEGALIA': {
    titulo: 'Esplenomegalia',
    explicacao: 'Aumento do tamanho do baço, pode ser sentido no exame físico.',
    sinonimos: ['baço aumentado', 'baço grande']
  },
  'EXANTEMA': {
    titulo: 'Exantema',
    explicacao: 'Erupção cutânea generalizada, comum em doenças virais.',
    sinonimos: ['erupção na pele', 'rash', 'manchas vermelhas']
  },
  'EXANTEMA MACULO PAPULAR': {
    titulo: 'Exantema Máculo-papular',
    explicacao: 'Erupção com manchas planas e elevadas na pele, típica de algumas viroses.',
    sinonimos: ['erupção mista', 'manchas e bolinhas na pele']
  },
  'FADIGA': {
    titulo: 'Fadiga',
    explicacao: 'Cansaço extremo e persistente que não melhora com repouso.',
    sinonimos: ['cansaço', 'exaustão', 'fraqueza']
  },
  'FALTA DE AR': {
    titulo: 'Falta de Ar',
    explicacao: 'Dificuldade respiratória ou sensação de não conseguir respirar adequadamente.',
    sinonimos: ['dispneia', 'dificuldade para respirar', 'cansaço respiratório']
  },
  'FEBRE ELEVADA': {
    titulo: 'Febre Elevada',
    explicacao: 'Temperatura corporal acima de 39°C, indica resposta intensa do organismo.',
    sinonimos: ['temperatura muito alta', 'febre alta']
  },
  'FEBRE MODERADA': {
    titulo: 'Febre Moderada',
    explicacao: 'Temperatura corporal entre 37,8°C e 39°C.',
    sinonimos: ['febre', 'temperatura elevada']
  },
  'FEBRE PERSISTENTE': {
    titulo: 'Febre Persistente',
    explicacao: 'Febre que dura mais de 3 dias consecutivos.',
    sinonimos: ['febre prolongada', 'febre contínua']
  },
  'FEBRE VESPERTINA': {
    titulo: 'Febre Vespertina',
    explicacao: 'Febre que aparece no final da tarde ou início da noite.',
    sinonimos: ['febre da tarde', 'febre noturna']
  },
  'FOTOFOBIA': {
    titulo: 'Fotofobia',
    explicacao: 'Sensibilidade excessiva à luz, causando desconforto ocular.',
    sinonimos: ['sensibilidade à luz', 'intolerância à luz']
  },
  'GANGLIOS PALPAVEIS NO PESCOCO': {
    titulo: 'Gânglios Palpáveis no Pescoço',
    explicacao: 'Ínguas no pescoço que podem ser sentidas ao toque.',
    sinonimos: ['ínguas no pescoço', 'caroços no pescoço']
  },
  'GLANDULAS PAROTIDAS EDEMACIADAS E PALPAVEIS': {
    titulo: 'Glândulas Parótidas Inchadas',
    explicacao: 'Inchaço das glândulas salivares localizadas na frente das orelhas.',
    sinonimos: ['caxumba', 'parótidas inchadas', 'inchaço na face']
  },
  'GUINCHO INSPIRATORIO': {
    titulo: 'Guincho Inspiratório',
    explicacao: 'Som agudo durante a inspiração, indica obstrução das vias aéreas superiores.',
    sinonimos: ['estridor', 'chiado respiratório']
  },
  'HEMATURIA': {
    titulo: 'Hematúria',
    explicacao: 'Presença de sangue na urina, pode ser visível ou detectada em exames.',
    sinonimos: ['sangue na urina', 'urina com sangue']
  },
  'HEPATOMEGALIA': {
    titulo: 'Hepatomegalia',
    explicacao: 'Aumento do tamanho do fígado, pode ser sentido no exame físico.',
    sinonimos: ['fígado aumentado', 'fígado grande']
  },
  'ICTERICIA': {
    titulo: 'Icterícia',
    explicacao: 'Coloração amarelada da pele e olhos, indica problemas no fígado ou vias biliares.',
    sinonimos: ['pele amarela', 'olhos amarelos', 'amarelão']
  },
  'INFORMACOES EPIDEMIOLOGICAS': {
    titulo: 'Informações Epidemiológicas',
    explicacao: 'Dados sobre exposição, viagens ou contato com casos suspeitos de doenças.',
    sinonimos: ['histórico de exposição', 'dados epidemiológicos']
  },
  'IRRITABILIDADE': {
    titulo: 'Irritabilidade',
    explicacao: 'Estado de agitação e impaciência, comum em crianças com febre.',
    sinonimos: ['agitação', 'inquietação', 'nervosismo']
  },
  'LESOES DE PELE COM DIMINUICAO DA SENSIBILIDADE TERMICA OU DOLOROSA': {
    titulo: 'Lesões com Perda de Sensibilidade',
    explicacao: 'Manchas ou lesões na pele onde há diminuição da sensação de dor ou temperatura.',
    sinonimos: ['lesões anestésicas', 'manchas dormentes', 'perda de sensibilidade']
  },
  'LESOES ULCERADAS DE PELE OU MUCOSAS': {
    titulo: 'Lesões Ulceradas',
    explicacao: 'Feridas abertas na pele ou mucosas, podem ser profundas e dolorosas.',
    sinonimos: ['úlceras', 'feridas abertas', 'lesões ulcerativas']
  },
  'LETARGIA': {
    titulo: 'Letargia',
    explicacao: 'Estado de sonolência excessiva e falta de energia.',
    sinonimos: ['sonolência', 'apatia', 'falta de energia']
  },
  'LINFADENOPATIA': {
    titulo: 'Linfadenopatia',
    explicacao: 'Aumento dos gânglios linfáticos em qualquer região do corpo.',
    sinonimos: ['ínguas', 'gânglios aumentados']
  },
  'MAL ESTAR GERAL': {
    titulo: 'Mal-estar Geral',
    explicacao: 'Sensação inespecífica de desconforto e indisposição.',
    sinonimos: ['indisposição', 'desconforto geral', 'sensação de doença']
  },
  'MANCHAS ROSACEAS': {
    titulo: 'Manchas Rosáceas',
    explicacao: 'Manchas de cor rosa na pele, podem ser planas ou levemente elevadas.',
    sinonimos: ['manchas rosa', 'erupção rosada']
  },
  'NAUSEAS': {
    titulo: 'Náuseas',
    explicacao: 'Sensação desagradável de enjoo, vontade de vomitar.',
    sinonimos: ['enjoo', 'má digestão', 'estômago embrulhado']
  },
  'OLIGURIA': {
    titulo: 'Oligúria',
    explicacao: 'Diminuição da quantidade de urina produzida pelo organismo.',
    sinonimos: ['pouca urina', 'diminuição da urina']
  },
  'PALIDEZ': {
    titulo: 'Palidez',
    explicacao: 'Coloração pálida da pele e mucosas, pode indicar anemia ou má circulação.',
    sinonimos: ['pele pálida', 'cor pálida', 'embranquecimento']
  },
  'PARALISIA FLACIDA AGUDA': {
    titulo: 'Paralisia Flácida Aguda',
    explicacao: 'Perda súbita da força muscular com diminuição do tônus muscular.',
    sinonimos: ['paralisia súbita', 'fraqueza muscular aguda']
  },
  'PARESIA': {
    titulo: 'Paresia',
    explicacao: 'Fraqueza muscular parcial, diminuição da força sem paralisia completa.',
    sinonimos: ['fraqueza muscular', 'diminuição da força']
  },
  'PERDA DE FORCA MUSCULAR': {
    titulo: 'Perda de Força Muscular',
    explicacao: 'Diminuição da capacidade de contração muscular.',
    sinonimos: ['fraqueza muscular', 'força diminuída']
  },
  'PETEQUIAS': {
    titulo: 'Petéquias',
    explicacao: 'Pequenas manchas vermelhas na pele causadas por sangramento de pequenos vasos.',
    sinonimos: ['pontinhos vermelhos na pele', 'manchas de sangue']
  },
  'PLACAS ESBRANQUICADAS NAS AMIGDALAS': {
    titulo: 'Placas Brancas nas Amígdalas',
    explicacao: 'Depósitos esbranquiçados nas amígdalas, comum em infecções bacterianas.',
    sinonimos: ['pus nas amígdalas', 'placas de pus', 'amígdalas com secreção']
  },
  'POLACIURIA': {
    titulo: 'Polaquiúria',
    explicacao: 'Aumento da frequência urinária, necessidade de urinar muitas vezes.',
    sinonimos: ['urinar frequente', 'muita vontade de urinar']
  },
  'POLIURIA': {
    titulo: 'Poliúria',
    explicacao: 'Aumento excessivo da quantidade de urina produzida.',
    sinonimos: ['excesso de urina', 'urinar muito']
  },
  'PROSTRACAO': {
    titulo: 'Prostração',
    explicacao: 'Estado de extrema fraqueza e abatimento físico e mental.',
    sinonimos: ['abatimento', 'extrema fraqueza', 'debilidade']
  },
  'PTOSE PALPEBRAL': {
    titulo: 'Ptose Palpebral',
    explicacao: 'Queda da pálpebra superior, dificuldade para manter o olho aberto.',
    sinonimos: ['pálpebra caída', 'olho caído']
  },
  'RECUSA ALIMENTAR': {
    titulo: 'Recusa Alimentar',
    explicacao: 'Falta de vontade ou incapacidade de se alimentar.',
    sinonimos: ['não quer comer', 'inapetência', 'rejeição à comida']
  },
  'RIGIDEZ ABDOMINAL': {
    titulo: 'Rigidez Abdominal',
    explicacao: 'Tensão e endurecimento dos músculos abdominais, sinal de irritação peritoneal.',
    sinonimos: ['abdome rígido', 'barriga dura']
  },
  'RIGIDEZ DE NUCA': {
    titulo: 'Rigidez de Nuca',
    explicacao: 'Dificuldade e dor para mover o pescoço, especialmente para frente.',
    sinonimos: ['pescoço duro', 'dificuldade para mexer o pescoço']
  },
  'RISO SARDONICO': {
    titulo: 'Riso Sardônico',
    explicacao: 'Contração involuntária dos músculos faciais simulando um sorriso forçado.',
    sinonimos: ['sorriso forçado', 'contração facial']
  },
  'SANGRAMENTO DE MUCOSAS': {
    titulo: 'Sangramento de Mucosas',
    explicacao: 'Sangramento das membranas que revestem cavidades do corpo (boca, nariz, etc.).',
    sinonimos: ['sangramento nas mucosas', 'hemorragia mucosa']
  },
  'SECRECAO NASO FARINGEA': {
    titulo: 'Secreção Nasofaríngea',
    explicacao: 'Secreção produzida na região do nariz e garganta.',
    sinonimos: ['catarro no nariz', 'secreção nasal', 'muco nasal']
  },
  'SINAL DE ROMANA OU CHAGOMA DE INOCULACAO': {
    titulo: 'Sinal de Romaña',
    explicacao: 'Inchaço unilateral da pálpebra, sinal característico da doença de Chagas aguda.',
    sinonimos: ['chagoma de inoculação', 'inchaço na pálpebra', 'olho inchado unilateral']
  },
  'SUDORESE': {
    titulo: 'Sudorese',
    explicacao: 'Transpiração excessiva, suor em quantidade anormal.',
    sinonimos: ['suor excessivo', 'transpiração intensa']
  },
  'SUDORESE NOTURNA': {
    titulo: 'Sudorese Noturna',
    explicacao: 'Transpiração excessiva durante a noite, molhando roupas e lençóis.',
    sinonimos: ['suor noturno', 'transpiração à noite']
  },
  'TAQUICARDIA': {
    titulo: 'Taquicardia',
    explicacao: 'Aumento da frequência cardíaca acima do normal (>100 bpm em repouso).',
    sinonimos: ['coração acelerado', 'batimento rápido', 'palpitação']
  },
  'TOSSE PAROXISTICA': {
    titulo: 'Tosse Paroxística',
    explicacao: 'Tosse em crises ou ataques intensos e prolongados.',
    sinonimos: ['tosse em crises', 'ataques de tosse']
  },
  'TOSSE POR MAIS DE TRES SEMANAS': {
    titulo: 'Tosse Persistente',
    explicacao: 'Tosse que persiste por mais de três semanas, requer investigação.',
    sinonimos: ['tosse crônica', 'tosse prolongada']
  },
  'TOSSE PRODUTIVA': {
    titulo: 'Tosse Produtiva',
    explicacao: 'Tosse com expectoração (catarro), ajuda a limpar as vias respiratórias.',
    sinonimos: ['tosse com catarro', 'tosse com secreção']
  },
  'TOSSE SECA': {
    titulo: 'Tosse Seca',
    explicacao: 'Tosse sem expectoração (sem catarro), geralmente irritativa.',
    sinonimos: ['tosse sem catarro', 'tosse irritativa']
  },
  'TRISMO': {
    titulo: 'Trismo',
    explicacao: 'Dificuldade para abrir a boca devido à contração dos músculos da mastigação.',
    sinonimos: ['boca travada', 'dificuldade para abrir a boca']
  },
  'UMA OU MAIS MANIFESTACOES HEMORRAGICAS (EPISTAXE, HEMATEMESE, METRORRAGIA, ETC)': {
    titulo: 'Manifestações Hemorrágicas',
    explicacao: 'Sangramentos diversos como sangramento nasal, vômito com sangue, sangramento menstrual anormal, etc.',
    sinonimos: ['sangramentos', 'hemorragias', 'sangramento nasal', 'vômito com sangue']
  },
  'URINA ESCURA': {
    titulo: 'Urina Escura',
    explicacao: 'Urina de cor escura, pode indicar desidratação ou problemas hepáticos.',
    sinonimos: ['urina concentrada', 'urina amarela escura']
  },
  'VISAO TURVA': {
    titulo: 'Visão Turva',
    explicacao: 'Diminuição da nitidez visual, dificuldade para enxergar com clareza.',
    sinonimos: ['visão embaçada', 'vista embaçada', 'enxergar embaçado']
  },
  'VOMITO': {
    titulo: 'Vômito',
    explicacao: 'Expulsão forçada do conteúdo do estômago pela boca.',
    sinonimos: ['vomitar', 'devolver', 'regurgitação']
  },
  'VOMITO EM JATO': {
    titulo: 'Vômito em Jato',
    explicacao: 'Vômito expelido com grande força, pode indicar aumento da pressão intracraniana.',
    sinonimos: ['vômito projectil', 'vômito violento']
  },
  'VOMITO POS TOSSE': {
    titulo: 'Vômito Pós-tosse',
    explicacao: 'Vômito que ocorre após crises de tosse intensa.',
    sinonimos: ['vomitar depois de tossir']
  }
};

// Componente de botão de ajuda para sintomas - versão maior e mais visível
const SintomaHelpButton: React.FC<SintomaHelpButtonProps> = ({ sintoma }) => {
  const [showHelp, setShowHelp] = useState(false);
  
  const sintomaKey = sintoma.toUpperCase().replace(/\s+/g, ' ').trim();
  const ajuda = sintomasExplicacoes[sintomaKey as keyof typeof sintomasExplicacoes];
  
  if (!ajuda) return null;
  
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowHelp(true);
        }}
        className="ml-2 flex items-center justify-center w-7 h-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm hover:shadow-md"
        title={`Ver explicação sobre: ${ajuda.titulo}`}
      >
        <Info className="w-5 h-5" />
      </button>
      
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowHelp(false)}>
          <div className="absolute inset-0 bg-black bg-opacity-25"></div>
          <div 
            className="relative z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-blue-900 text-sm">{ajuda.titulo}</h3>
                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                {ajuda.explicacao}
              </p>
              
              {ajuda.sinonimos && ajuda.sinonimos.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-900 mb-2">
                    Também conhecido como:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {ajuda.sinonimos.map((sinonimo: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {sinonimo}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Componente para mostrar sintomas relacionados (mantido do código original)
const SintomasRelacionados = ({ 
  hipoteseId, 
  qtdSintomas,
  formData,
  sintomaOptions 
}: { 
  hipoteseId: string; 
  qtdSintomas: number;
  formData: any;
  sintomaOptions: any[];
}) => {
  const [showRelatedSymptoms, setShowRelatedSymptoms] = useState(false);
  const [relatedSymptoms, setRelatedSymptoms] = useState<{id: string, descricao: string}[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);
  
  useEffect(() => {
    if (!showRelatedSymptoms) return;
    
    const fetchRelatedSymptoms = async () => {
      try {
        setIsLoadingRelated(true);
        
        const response = await ListaSindromicaService.getSintomasPorHipotese(hipoteseId);
        
        const sintomas = response.map((sintoma: any) => ({
          id: sintoma.id.toString(),
          descricao: sintoma.sintoma
        }));
        
        setRelatedSymptoms(sintomas);
      } catch (error) {
        console.error('Erro ao buscar sintomas relacionados:', error);
        
        const sintomasInferidos = sintomaOptions
          .filter(sintoma => formData.sinaisESintomas.includes(sintoma.idtipo_sintoma.toString()))
          .map(sintoma => ({
            id: sintoma.idtipo_sintoma.toString(),
            descricao: sintoma.descricao
          }));
        
        setRelatedSymptoms(sintomasInferidos);
      } finally {
        setIsLoadingRelated(false);
      }
    };
    
    fetchRelatedSymptoms();
  }, [hipoteseId, showRelatedSymptoms, formData.sinaisESintomas, sintomaOptions]);

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-yellow-600">
        {qtdSintomas} {qtdSintomas === 1 ? 'sintoma relacionado' : 'sintomas relacionados'}
      </span>
      
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowRelatedSymptoms(!showRelatedSymptoms);
        }}
        className="ml-1 text-blue-500 hover:text-blue-700 rounded-full w-5 h-5 flex items-center justify-center bg-blue-50 hover:bg-blue-100 transition-colors"
        title="Ver sintomas relacionados"
      >
        <span role="img" aria-label="Sintomas">🩺</span>
      </button>
      
      {showRelatedSymptoms && (
        <div className="absolute z-10 top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 max-w-xs w-60 text-xs text-gray-700">
          <div className="font-medium mb-1 text-gray-900">Sintomas relacionados:</div>
          
          {isLoadingRelated ? (
            <div className="flex items-center justify-center p-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-xs text-gray-600">Carregando sintomas...</span>
            </div>
          ) : relatedSymptoms.length === 0 ? (
            <div className="text-gray-500 italic">Nenhum sintoma específico encontrado.</div>
          ) : (
            <ul className="list-disc pl-4 space-y-1 max-h-40 overflow-y-auto">
              {relatedSymptoms.map(sintoma => {
                const isSelecionado = formData.sinaisESintomas.includes(sintoma.id);
                
                return (
                  <li key={sintoma.id} className={isSelecionado ? "text-green-600 font-medium" : ""}>
                    {sintoma.descricao}
                    {isSelecionado && (
                      <span className="ml-1 text-xs text-green-500">(selecionado)</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          
          <div className="absolute right-1 top-1">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowRelatedSymptoms(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface AttendanceInfoSectionProps extends FormSectionProps {
  searchSintomas: string;
  setSearchSintomas: (search: string) => void;
  searchTrauma: string;
  setSearchTrauma: (search: string) => void;
  atendimentoOptions: any[];
  sintomaOptions: any[];
  traumaOptions: any[];
  hipoteseDiagOptions: any[];
  hipoteseDiagFiltradas: any[];
  isLoadingHipoteses: boolean;
  isTipoAtendimentoFunc: (tipo: string) => boolean;
  setErrors?: (errors: any) => void;
  handleValidationError: (name: string, error: string | null) => void;
}

const AttendanceInfoSection: React.FC<AttendanceInfoSectionProps> = ({
  formData,
  setFormData,
  errors,
  handleChange,
  handleCheckboxChange,
  isExpanded,
  toggleSection,
  searchSintomas,
  setSearchSintomas,
  searchTrauma,
  setSearchTrauma,
  atendimentoOptions,
  sintomaOptions,
  traumaOptions,
  hipoteseDiagOptions,
  hipoteseDiagFiltradas,
  isLoadingHipoteses,
  isTipoAtendimentoFunc,
  setErrors = () => {},
  handleValidationError
}) => {
  const [searchHipotese, setSearchHipotese] = useState('');
  const [showAllHipoteses, setShowAllHipoteses] = useState(false);
  const [showDateHelp, setShowDateHelp] = useState(false);
  
  // Função para normalizar texto para busca
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .trim();
  };

  // Função de busca personalizada que inclui sinônimos e retorna informação sobre o match
  const searchWithSynonyms = (option: { id: string | number; label: string }, searchTerm: string) => {
    const normalizedSearch = normalizeText(searchTerm);
    const normalizedLabel = normalizeText(option.label);
    
    // Busca no nome principal
    if (normalizedLabel.includes(normalizedSearch)) {
      return true;
    }
    
    // Busca nos sinônimos
    const sintomaKey = option.label.toUpperCase().replace(/\s+/g, ' ').trim();
    const ajuda = sintomasExplicacoes[sintomaKey as keyof typeof sintomasExplicacoes];
    
    if (ajuda && ajuda.sinonimos) {
      return ajuda.sinonimos.some(sinonimo => 
        normalizeText(sinonimo).includes(normalizedSearch)
      );
    }
    
    return false;
  };

  // Função para encontrar qual sinônimo foi usado na busca
  const getMatchingSynonym = (option: { id: string | number; label: string }, searchTerm: string) => {
    if (!searchTerm) return null;
    
    const normalizedSearch = normalizeText(searchTerm);
    const normalizedLabel = normalizeText(option.label);
    
    // Se encontrou no nome principal, não há sinônimo
    if (normalizedLabel.includes(normalizedSearch)) {
      return null;
    }
    
    // Procura nos sinônimos
    const sintomaKey = option.label.toUpperCase().replace(/\s+/g, ' ').trim();
    const ajuda = sintomasExplicacoes[sintomaKey as keyof typeof sintomasExplicacoes];
    
    if (ajuda && ajuda.sinonimos) {
      const matchingSynonym = ajuda.sinonimos.find(sinonimo => 
        normalizeText(sinonimo).includes(normalizedSearch)
      );
      return matchingSynonym || null;
    }
    
    return null;
  };
  
  const filteredHipoteses = hipoteseDiagFiltradas.filter(
    option => 
      searchHipotese === '' || 
      option.descricao.toLowerCase().includes(searchHipotese.toLowerCase())
  );

  const handleClearAllHipoteses = () => {
    if (formData.hipoteseDiagnostica.length > 0 && 
        window.confirm(`Deseja remover todas as hipóteses diagnósticas selecionadas?`)) {
      setFormData({
        ...formData,
        hipoteseDiagnostica: []
      });
    }
  };

  const getSelectedHipoteses = () => {
    return formData.hipoteseDiagnostica.map(id => {
      const option = hipoteseDiagOptions.find(opt => opt.idtipo_hipotese_diag.toString() === id);
      return {
        id,
        label: option ? option.descricao : id
      };
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <SectionHeader
        icon={<ListChecks className="h-5 w-5 text-yellow-500" />}
        title="4. Informações do atendimento"
        isExpanded={isExpanded}
        onToggle={toggleSection}
      />
      
      {isExpanded && (
        <div className="p-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Atendimento */}
            <FormField
              label="Tipo de Atendimento"
              name="tipoAtendimento"
              value={formData.tipoAtendimento}
              onChange={handleChange}
              type="select"
              required
              error={errors.tipoAtendimento}
              options={
                atendimentoOptions?.map((option) => ({
                  value: option.idtipo_atendimento.toString(),
                  label: option.descricao
                })) || []
              }
            />

            {/* Sinais e Sintomas para CLINICO e INCIDENTE QBRN */}
            {(isTipoAtendimentoFunc("CLINICO") ||
              isTipoAtendimentoFunc("INCIDENTE QBRN")) && (
              <div className="md:col-span-2" data-field="sinaisESintomas">
                <SearchableCheckboxGroup
                  label="Sinais e Sintomas"
                  options={sintomaOptions.map(option => ({
                    id: option.idtipo_sintoma.toString(),
                    label: option.descricao,
                    helpButton: <SintomaHelpButton sintoma={option.descricao} />
                  }))}
                  selectedValues={formData.sinaisESintomas}
                  onChange={(value) => handleCheckboxChange && handleCheckboxChange('sinaisESintomas', value)}
                  error={errors.sinaisESintomas}
                  maxHeight="96"
                  customSearchFunction={searchWithSynonyms}
                  getSynonymMatch={getMatchingSynonym}
                />
              </div>
            )}

            {/* Data de Início dos Sintomas e Observação apenas para CLINICO */}
            {isTipoAtendimentoFunc("CLINICO") && (
              <>
                <div className="relative">
                  <label className="block mb-2 font-medium text-gray-700">
                    <span className="flex items-center gap-2">
                      Data de Início dos Sintomas
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowDateHelp(!showDateHelp);
                        }}
                        className="text-blue-500 hover:text-blue-700 transition-colors inline-flex items-center"
                        title="Informações sobre este campo"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </span>
                  </label>
                  
                  {showDateHelp && (
                    <div className="absolute z-50 left-0 mt-1 w-72">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-xl">
                        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 rounded-t-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-blue-900 text-sm">Informação</span>
                            <button
                              type="button"
                              onClick={() => setShowDateHelp(false)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-gray-700">
                            <strong className="text-gray-900">Importante:</strong> A data de início dos sintomas não pode ser futura. 
                            A mensagem de erro permanecerá visível até que uma data válida seja inserida ou o campo seja limpo manualmente.
                          </p>
                        </div>
                      </div>
                      <div className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-white"></div>
                    </div>
                  )}
                  
                  <CustomDateInput
                    name="dataInicioSintomas"
                    className={`w-full p-3 border ${
                      errors.dataInicioSintomas
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200"
                    } rounded-lg text-sm bg-white transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                    value={formData.dataInicioSintomas}
                    onChange={handleChange}
                    data-error={errors.dataInicioSintomas ? "true" : "false"}
                    error={errors.dataInicioSintomas}
                    onValidationError={handleValidationError}
                  />
                </div>

                <div className="md:col-span-2">
                  <FormField
                    label="Observação"
                    name="observacaoSintomas"
                    value={formData.observacaoSintomas}
                    onChange={handleChange}
                    type="textarea"
                    placeholder="Informações adicionais sobre os sintomas..."
                    maxLength={255}
                  />
                </div>
              </>
            )}

            {/* Trauma ou múltiplas vítimas ou incidente QBRN */}
            {(isTipoAtendimentoFunc("TRAUMA") ||
              isTipoAtendimentoFunc("MULTIPLAS VITIMAS") ||
              isTipoAtendimentoFunc("INCIDENTE QBRN")) && (
              <>
                <div className="md:col-span-2" data-field="tipoTrauma">
                  <SearchableCheckboxGroup
                    label="Tipo de Trauma"
                    options={traumaOptions.map(option => ({
                      id: option.idtipo_trauma.toString(),
                      label: option.descricao
                    }))}
                    selectedValues={formData.tipoTrauma}
                    onChange={(value) => handleCheckboxChange && handleCheckboxChange('tipoTrauma', value)}
                    error={errors.tipoTrauma}
                    maxHeight="96"
                    customSearchFunction={searchWithSynonyms}
                    getSynonymMatch={getMatchingSynonym}
                  />
                </div>

                <div className="md:col-span-2">
                  <FormField
                    label="Observação"
                    name="observacaoTrauma"
                    value={formData.observacaoTrauma}
                    onChange={handleChange}
                    type="textarea"
                    placeholder="Informações adicionais sobre o trauma..."
                    maxLength={255}
                  />
                </div>
              </>
            )}

            {/* Observação do Incidente para INCIDENTE QBRN */}
            {isTipoAtendimentoFunc("INCIDENTE QBRN") && (
              <>
                <div className="md:col-span-2">
                  <FormField
                    label="Observação do Incidente"
                    name="observacaoIncidente"
                    value={formData.observacaoIncidente}
                    onChange={handleChange}
                    type="textarea"
                    placeholder="Informações adicionais sobre o incidente..."
                    maxLength={255}
                  />
                </div>
              </>
            )}

            {/* Hipótese Diagnóstica para TODOS os tipos EXCETO TRAUMA e MULTIPLAS VITIMAS */}
            {!isTipoAtendimentoFunc("TRAUMA") && !isTipoAtendimentoFunc("MULTIPLAS VITIMAS") && (
              <div className="md:col-span-2" data-field="hipoteseDiagnostica">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-gray-700">
                    Hipóteses Diagnósticas (selecione uma ou mais)
                  </label>
                  
                  <div className="relative w-64">
                    <input
                      type="text"
                      placeholder="Pesquisar hipóteses..."
                      value={searchHipotese}
                      onChange={(e) => setSearchHipotese(e.target.value)}
                      className="w-full p-2 pl-8 text-sm border border-gray-200 rounded-lg hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      disabled={isLoadingHipoteses}
                    />
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    {searchHipotese && (
                      <button
                        type="button"
                        onClick={() => setSearchHipotese('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
                
                {formData.hipoteseDiagnostica.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      {getSelectedHipoteses().map((hipotese) => (
                        <div
                          key={hipotese.id}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs"
                        >
                          <span>{hipotese.label}</span>
                          <button
                            type="button"
                            onClick={() => handleCheckboxChange && 
                              handleCheckboxChange("hipoteseDiagnostica", hipotese.id)}
                            className="text-blue-500 hover:text-blue-700 focus:outline-none"
                            aria-label={`Remover ${hipotese.label}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      
                      {formData.hipoteseDiagnostica.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllHipoteses}
                          className="ml-2 text-xs text-gray-500 hover:text-red-500 focus:outline-none"
                        >
                          Limpar todas
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {isLoadingHipoteses ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-600">Carregando hipóteses diagnósticas...</span>
                  </div>
                ) : (
                  <>
                    {formData.sinaisESintomas.length > 0 && hipoteseDiagFiltradas.length > 0 && !showAllHipoteses && (
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-xs text-gray-500">
                          Mostrando hipóteses diagnósticas ordenadas por relevância com base nos sintomas selecionados.
                        </div>
                        <button 
                          type="button"
                          onClick={() => setShowAllHipoteses(true)}
                          className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none flex items-center gap-1"
                        >
                          <span>Ver todas as hipóteses</span>
                        </button>
                      </div>
                    )}
                    
                    {showAllHipoteses && (
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-xs text-gray-500">
                          Mostrando todas as hipóteses diagnósticas disponíveis.
                        </div>
                        <button 
                          type="button"
                          onClick={() => setShowAllHipoteses(false)}
                          className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none flex items-center gap-1"
                        >
                          <span>Ver apenas hipóteses relacionadas</span>
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {(() => {
                        let hipotesesToShow = [];
                        
                        if (showAllHipoteses) {
                          const hipotesesEnriquecidas = hipoteseDiagOptions.map(option => {
                            const matchingSintomaOption = hipoteseDiagFiltradas.find(
                              h => h.idtipo_hipotese_diag === option.idtipo_hipotese_diag
                            );
                            
                            return {
                              ...option,
                              qtdSintomas: matchingSintomaOption ? matchingSintomaOption.qtdSintomas : 0
                            };
                          });
                          
                          hipotesesToShow = hipotesesEnriquecidas
                            .sort((a, b) => (b.qtdSintomas || 0) - (a.qtdSintomas || 0))
                            .filter(option => 
                              searchHipotese === '' || 
                              option.descricao.toLowerCase().includes(searchHipotese.toLowerCase())
                            );
                        } else {
                          hipotesesToShow = filteredHipoteses;
                        }
                        
                        if (hipotesesToShow.length > 0) {
                          return hipotesesToShow.map((option) => {
                            const matchingSintomaOption = hipoteseDiagFiltradas.find(
                              h => h.idtipo_hipotese_diag === option.idtipo_hipotese_diag
                            );
                            
                            const qtdSintomas = matchingSintomaOption ? matchingSintomaOption.qtdSintomas : 0;
                            const isChecked = formData.hipoteseDiagnostica.includes(option.idtipo_hipotese_diag.toString());
                            
                            return (
                              <HipoteseDiagItem
                                key={option.idtipo_hipotese_diag}
                                option={option}
                                qtdSintomas={qtdSintomas}
                                formData={formData}
                                checked={isChecked}
                                onChange={() => {
                                  // ✅ MUDANÇA PRINCIPAL: Usar handleCheckboxChange padrão para permitir múltiplas seleções
                                  handleCheckboxChange && handleCheckboxChange("hipoteseDiagnostica", option.idtipo_hipotese_diag.toString());
                                }}
                                showAllHipoteses={showAllHipoteses}
                              />
                            );
                          });
                        } else if (searchHipotese) {
                          return (
                            <div className="md:col-span-3 text-center p-3 text-gray-500 italic border border-dashed border-gray-300 rounded-lg">
                              Nenhuma hipótese diagnóstica encontrada para "{searchHipotese}".
                            </div>
                          );
                        } else if (formData.sinaisESintomas.length > 0 && hipoteseDiagFiltradas.length === 0) {
                          return (
                            <div className="md:col-span-3 text-center p-3 text-gray-500 italic border border-dashed border-gray-300 rounded-lg">
                              Nenhuma hipótese diagnóstica encontrada para os sintomas selecionados.
                              <div className="mt-2">
                                <button 
                                  type="button"
                                  onClick={() => setShowAllHipoteses(true)}
                                  className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                                >
                                  Ver todas as hipóteses disponíveis
                                </button>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="md:col-span-3 text-center p-3 text-gray-500 italic border border-dashed border-gray-300 rounded-lg">
                              Selecione sintomas para ver hipóteses diagnósticas relacionadas ou
                              <button 
                                type="button"
                                onClick={() => setShowAllHipoteses(true)}
                                className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                              >
                                veja todas as hipóteses disponíveis
                              </button>.
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Observação da Hipótese para TODOS os tipos de atendimento */}
            <div className="md:col-span-2">
              <FormField
                label="Observação da Hipótese"
                name="observacaoHipotese"
                value={formData.observacaoHipotese}
                onChange={handleChange}
                type="textarea"
                placeholder="Informações adicionais sobre a hipótese diagnóstica..."
                maxLength={255}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceInfoSection;

// Export das funções utilitárias para usar em outros componentes
export { SintomaHelpButton, sintomasExplicacoes };