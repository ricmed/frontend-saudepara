import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Globe, Building, Home } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import ChartExportMenu from '../../../../components/common/ChartExportMenu';
import DashboardExportMenu from '../../../../components/common/DashboardExportMenu';

// 🏳️ BANDEIRAS - FONTES E LICENÇAS
// =====================================
// 🌍 Países: https://flagcdn.com/ (Licença livre para uso)
// 🇧🇷 Estados BR: https://github.com/pierrelapalu/icones-bandeiras-br-uf (CC0 License - Uso livre)
// 
// Estrutura real do repositório brasileiro:
// - 4 estilos: "circle", "square-rounded", "rounded", "full"
// - 3 formatos: SVG ⭐ (preferido), PDF, PNG (200px e 800px)
// - Nomenclatura: {número}-{nome}-{estilo}.{ext}
// - Exemplo SVG: /dist/rounded/svg/15-para-rounded.svg
// - Exemplo PNG: /dist/circle/png-200/15-para-circle.png

// 🏳️ FUNÇÃO PARA OBTER URL DA BANDEIRA DE PAÍSES
const getFlagUrl = (countryName: string): string | null => {
  const countryCode = getCountryFlagCode(countryName);
  if (!countryCode) return null;
  return `https://flagcdn.com/${countryCode}.svg`;
};

// 🏳️ MAPEAMENTO DINÂMICO DE PAÍSES PARA CÓDIGOS DE BANDEIRAS
// Sistema completo que mapeia todos os 247 países do backend para códigos ISO
const getCountryFlagCode = (countryName: string): string | null => {
  // Mapeamento direto dos nomes do backend para códigos ISO 3166-1 alpha-2
  const countryMappings: Record<string, string> = {
    "Afeganistão": "af",
    "Aland, Ilhas": "ax", 
    "Albânia, República da": "al",
    "Alemanha": "de",
    "Andorra": "ad",
    "Angola": "ao",
    "Anguilla": "ai",
    "Antigua E Barbuda": "ag",
    "Antilhas Holandesas": "an", // Código histórico
    "Argentina": "ar",
    "Argélia": "dz",
    "Armênia, República da": "am",
    "Aruba": "aw",
    "Arábia Saudita": "sa",
    "Austrália": "au",
    "Azerbaijão, República do": "az",
    "Bahamas, Ilhas": "bs",
    "Bahrein, Ilhas": "bh",
    "Bangladesh": "bd",
    "Barbados": "bb",
    "Belarus, República da": "by",
    "Belize": "bz",
    "Benin": "bj",
    "Bermudas": "bm",
    "Bolívia, Estado Plurinacional da": "bo",
    "Bonaire, Saint Eustatius e Saba": "bq",
    "Bosnia-Herzegovina (República da)": "ba",
    "Botsuana": "bw",
    "Bouvet, Ilhas": "bv",
    "Brasil": "br",
    "Brunei": "bn",
    "Bulgária, República da": "bg",
    "Burkina Faso": "bf",
    "Burundi": "bi",
    "Butão": "bt",
    "Bélgica": "be",
    "Cabo Verde, República de": "cv",
    "Camarões": "cm",
    "Camboja": "kh",
    "Canadá": "ca",
    "Canárias, Ilhas": "es", // Usar código da Espanha
    "Catar": "qa",
    "Cayman, Ilhas": "ky",
    "Cazaquistão, República do": "kz",
    "Chade": "td",
    "Chile": "cl",
    "China, República Popular": "cn",
    "Chipre": "cy",
    "Christmas,Ilhas (Navidad)": "cx",
    "Cingapura": "sg",
    "Cocos-Keeling, Ilhas": "cc",
    "Colômbia": "co",
    "Comores, Ilhas": "km",
    "Congo": "cg",
    "Congo, República Democrática do": "cd",
    "Cook, Ilhas": "ck",
    "Coréia (do Norte), Rep.Pop.Democrática": "kp",
    "Coréia (do Sul), República da": "kr",
    "Costa Rica": "cr",
    "Costa do Marfim": "ci",
    "Coveite": "kw", // Kuwait
    "Croácia, República da": "hr",
    "Cuba": "cu",
    "Curaçao": "cw",
    "Dinamarca": "dk",
    "Djibuti": "dj",
    "Dominica, Ilha": "dm",
    "Egito": "eg",
    "El Salvador": "sv",
    "Emirados Árabes Unidos": "ae",
    "Equador": "ec",
    "Eritreia": "er",
    "Eslovaca, República": "sk",
    "Eslovênia, República da": "si",
    "Espanha": "es",
    "Estados Unidos": "us",
    "Estônia, República da": "ee",
    "Etiópia": "et",
    "Falkland (Ilhas Malvinas)": "fk",
    "Fiji": "fj",
    "Filipinas": "ph",
    "Finlândia": "fi",
    "Formosa (Taiwan)": "tw",
    "França": "fr",
    "Féroe, Ilhas": "fo",
    "Gabão": "ga",
    "Gana": "gh",
    "Geórgia, República da": "ge",
    "Gibraltar": "gi",
    "Granada": "gd",
    "Groenlândia": "gl",
    "Grécia": "gr",
    "Guadalupe": "gp",
    "Guam": "gu",
    "Guatemala": "gt",
    "Guiana": "gy",
    "Guiana Francesa": "gf",
    "Guiné": "gn",
    "Guiné Equatorial": "gq",
    "Guiné-Bissau": "gw",
    "Gâmbia": "gm",
    "Haiti": "ht",
    "Honduras": "hn",
    "Hong Kong": "hk",
    "Hungria, República da": "hu",
    "Iemen": "ye",
    "Ilhas do Canal (Jersey e Guernsey)": "je", // Jersey como representativo
    "Indonésia": "id",
    "Iraque": "iq",
    "Irlanda": "ie",
    "Irã, República Islâmica do": "ir",
    "Islândia": "is",
    "Israel": "il",
    "Itália": "it",
    "Jamaica": "jm",
    "Japão": "jp",
    "Johnston, Ilhas": "um", // US Minor Outlying Islands
    "Jordânia": "jo",
    "Kiribati": "ki",
    "Laos, Rep.Pop.Democr.do": "la",
    "Lebuan, Ilhas": "my", // Parte da Malásia
    "Lesoto": "ls",
    "Letônia, República da": "lv",
    "Libéria": "lr",
    "Liechtenstein": "li",
    "Lituânia, República da": "lt",
    "Luxemburgo": "lu",
    "Líbano": "lb",
    "Líbia": "ly",
    "Macau": "mo",
    "Macedônia, Ant.Rep.Iugoslava": "mk",
    "Madagascar": "mg",
    "Madeira, Ilha da": "pt", // Território português
    "Malavi": "mw",
    "Maldivas": "mv",
    "Mali": "ml",
    "Malta": "mt",
    "Malásia": "my",
    "Man, Ilha de": "im",
    "Marianas do Norte": "mp",
    "Marrocos": "ma",
    "Marshall, Ilhas": "mh",
    "Martinica": "mq",
    "Mauritânia": "mr",
    "Maurício": "mu",
    "Mianmar (Birmânia)": "mm",
    "Micronésia": "fm",
    "Midway, Ilhas": "um", // US Minor Outlying Islands
    "Moldavia, República da": "md",
    "Mongólia": "mn",
    "Montenegro": "me",
    "Montserrat, Ilhas": "ms",
    "Moçambique": "mz",
    "México": "mx",
    "Mônaco": "mc",
    "Namíbia": "na",
    "Nauru": "nr",
    "Nepal": "np",
    "Nicarágua": "ni",
    "Niger": "ne",
    "Nigéria": "ng",
    "Niue, Ilha": "nu",
    "Norfolk, Ilha": "nf",
    "Noruega": "no",
    "Nova Caledônia": "nc",
    "Nova Zelândia": "nz",
    "Omã": "om",
    "Pacífico, Ilhas do (possessão dos EUA)": "um",
    "Palau": "pw",
    "Palestina": "ps",
    "Panamá": "pa",
    "Papua Nova Guiné": "pg",
    "Paquistão": "pk",
    "Paraguai": "py",
    "Países Baixos (Holanda)": "nl",
    "Peru": "pe",
    "Pitcairn, Ilha De": "pn",
    "Polinésia Francesa": "pf",
    "Polônia, República da": "pl",
    "Porto Rico": "pr",
    "Portugal": "pt",
    "Quirguiz, República da": "kg",
    "Quênia": "ke",
    "Reino Unido": "gb",
    "República Centro-Africana": "cf",
    "República Dominicana": "do",
    "Reunião, Ilha": "re",
    "Romênia": "ro",
    "Ruanda": "rw",
    "Rússia, Federação da": "ru",
    "Saara Ocidental": "eh",
    "Salomão, Ilhas": "sb",
    "Samoa": "ws",
    "Samoa Americana": "as",
    "San Marino": "sm",
    "Santa Helena": "sh",
    "Santa Lúcia": "lc",
    "Senegal": "sn",
    "Serra Leoa": "sl",
    "Servia": "rs",
    "Seychelles": "sc",
    "Sint Maarten": "sx",
    "Somália": "so",
    "Sri Lanka": "lk",
    "Suazilândia": "sz",
    "Sudão": "sd",
    "Suriname": "sr",
    "Suécia": "se",
    "Suíça": "ch",
    "São Bartolomeu": "bl",
    "São Cristovão e Neves, Ilhas": "kn",
    "São Pedro e Miquelon": "pm",
    "São Tomé e Príncipe, Ilhas": "st",
    "São Vicente e Granadinas": "vc",
    "Síria, República Árabe da": "sy",
    "Tadjiquistão, República do": "tj",
    "Tailândia": "th",
    "Tanzania, Rep. Unida da": "tz",
    "Tcheca, República": "cz",
    "Território Britânico no Oceano Índico": "io",
    "Timor Leste": "tl",
    "Togo": "tg",
    "Tonga": "to",
    "Toquelau, Ilhas": "tk",
    "Trinidad e Tobago": "tt",
    "Tunísia": "tn",
    "Turcas e Caicos, Ilhas": "tc",
    "Turcomenistão, República do": "tm",
    "Turquia": "tr",
    "Tuvalu": "tv",
    "Ucrânia": "ua",
    "Uganda": "ug",
    "Uruguai": "uy",
    "Uzbequistão, República do": "uz",
    "Vanuatu": "vu",
    "Vaticano, Est. da Cidade do": "va",
    "Venezuela": "ve",
    "Vietnã": "vn",
    "Virgens, Ilhas (Britânicas)": "vg",
    "Virgens, Ilhas (E.U.A.)": "vi",
    "Wake, Ilha": "um", // US Minor Outlying Islands
    "Wallis e Futuna, Ilhas": "wf",
    "Zimbabue": "zw",
    "Zâmbia": "zm",
    "África do Sul": "za",
    "Áustria": "at",
    "Índia": "in"
  };
  
  return countryMappings[countryName] || null;
};

// Interface para dados de gráfico
interface ChartDataItem {
  name: string;
  value: number;
  fill: string;
  isAlarmante?: boolean;
  original?: any;
}

// Interface para as props do componente
interface GeographicLocationPanelProps {
  paisData: ChartDataItem[];
  estadoData: ChartDataItem[];
  municipioData: ChartDataItem[];
  bairroData: ChartDataItem[];
  onFilterClick?: (category: string, value: string, multiSelect?: boolean) => void;
  activeFilters?: Record<string, any>;
  exportMenu?: React.ReactNode;
}

// 🌍 FUNÇÃO PARA ABREVIAR NOMES DE PAÍSES (remover partes desnecessárias)
const abbreviateCountryName = (fullName: string): string => {
  // Remove partes comuns que deixam os nomes longos
  return fullName
    .replace(/, República Popular$/i, '')
    .replace(/, República da$/i, '')
    .replace(/, República do$/i, '')
    .replace(/, Estado Plurinacional da$/i, '')
    .replace(/, Rep\.Pop\.Democrática$/i, '')
    .replace(/, Rep\. Unida da$/i, '')
    .replace(/, Rep\.Pop\.Democr\.do$/i, '')
    .replace(/, República Islâmica do$/i, '')
    .replace(/, República Árabe da$/i, '')
    .replace(/, Ilhas$/i, '')
    .replace(/^Ilhas /i, '')
    .replace(/, República de$/i, '')
    .replace(/\(República da\)/i, '')
    .replace(/\(Birmânia\)/i, '')
    .replace(/\(Navidad\)/i, '')
    .replace(/\(Ilhas Malvinas\)/i, '')
    .replace(/\(Taiwan\)/i, '')
    .replace(/\(Holanda\)/i, '')
    .replace(/\(Jersey e Guernsey\)/i, '')
    .replace(/\(possessão dos EUA\)/i, '')
    .replace(/, Est\. da Cidade do$/i, '')
    .replace(/, Ant\.Rep\.Iugoslava$/i, '')
    .trim();
};

// Componente de tooltip personalizado
// COMPONENTE NÃO UTILIZADO - Mantido para referência
// const CustomTooltip = ({ active, payload, label }: any) => {
//   if (active && payload && payload.length) {
//     const data = payload[0];
//     return (
//       <div className="bg-white p-3 border rounded-lg shadow-lg">
//         <p className="font-semibold text-gray-800">{label}</p>
//         <p className="text-blue-600">
//           <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: data.fill }}></span>
//           Casos: <span className="font-bold">{data.value}</span>
//         </p>
//       </div>
//     );
//   }
//   return null;
// };

// Componente de gráfico de barra interativo
// COMPONENTE NÃO UTILIZADO - Mantido para referência
// const InteractiveBarChart: React.FC<{
//   data: ChartDataItem[];
//   title: string;
//   icon: React.ReactNode;
//   onBarClick?: (category: string, value: string, multiSelect?: boolean) => void;
//   filterCategory: string;
//   activeFilter?: string | string[];
//   maxItems?: number;
//   ctrlPressedRef: React.RefObject<boolean>;
// }> = ({ data, title, icon, onBarClick, filterCategory, activeFilter, maxItems = 10, ctrlPressedRef }) => {
//   // Limitar dados para visualização
//   const displayData = data.slice(0, maxItems);
//   
//   const handleBarClick = (data: any) => {
//     if (onBarClick && data && data.name) {
//       onBarClick(filterCategory, data.name, ctrlPressedRef.current ?? false);
//     }
//   };
// 
//   // Função para verificar se um item está filtrado
//   const isItemFiltered = (itemName: string) => {
//     if (Array.isArray(activeFilter)) {
//       return activeFilter.includes(itemName);
//     }
//     return activeFilter === itemName;
//   };
// 
//   // Função para obter cor baseada no filtro
//   const getCellColor = (itemName: string, baseColor: string) => {
//     const hasFilter = activeFilter && (Array.isArray(activeFilter) ? activeFilter.length > 0 : true);
//     if (!hasFilter) return baseColor;
//     if (isItemFiltered(itemName)) return baseColor;
//     // Adicionar 30% de opacidade
//     return baseColor + "4D";
//   };
// 
//   return (
//     <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex items-center gap-2">
//           {icon}
//           <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
//           <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
//             {data.length} {data.length === 1 ? 'item' : 'itens'}
//           </span>
//         </div>
//         {activeFilter && (
//           <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
//             <span>Filtro ativo: </span>
//             <span className="font-medium">{activeFilter}</span>
//           </div>
//         )}
//       </div>
// 
//       {displayData.length > 0 ? (
//         <ResponsiveContainer width="100%" height={Math.max(200, displayData.length * 25)}>
//           <BarChart data={displayData} margin={{ top: 25, right: 30, left: 20, bottom: 5 }}>
//             <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//             <XAxis 
//               dataKey="name" 
//               angle={-45}
//               textAnchor="end"
//               height={80}
//               fontSize={12}
//             />
//             <YAxis fontSize={12} />
//             <Tooltip content={<CustomTooltip />} />
//             <Bar 
//               dataKey="value" 
//               fill="#3b5bdb"
//               cursor="pointer"
//               onClick={handleBarClick}
//               radius={[2, 2, 0, 0]}
//             >
//               {displayData.map((entry, index) => (
//                 <Cell 
//                   key={`cell-${index}`} 
//                   fill={getCellColor(entry.name, entry.fill || "#3b5bdb")}
//                   stroke={isItemFiltered(entry.name) ? "#000" : "none"}
//                   strokeWidth={isItemFiltered(entry.name) ? 4 : 0}
//                 />
//               ))}
//               <LabelList
//                 dataKey="value"
//                 position="top"
//                 formatter={(value: number) => value.toLocaleString()}
//                 style={{ fontSize: '14px', fontWeight: 'bold', fill: '#374151' }}
//               />
//             </Bar>
//           </BarChart>
//         </ResponsiveContainer>
//       ) : (
//         <div className="flex items-center justify-center h-40 text-gray-500">
//           <div className="text-center">
//             <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
//             <p>Nenhum dado disponível</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// �️ FUNÇÃO PARA OBTER CÓDIGO DO ESTADO BRASILEIRO PARA BANDEIRAS
const getStateFlagCode = (stateName: string): string | null => {
  // Mapeamento dos estados brasileiros para suas siglas
  const stateMappings: Record<string, string> = {
    "Acre": "ac",
    "Alagoas": "al", 
    "Amapá": "ap",
    "Amazonas": "am",
    "Bahia": "ba",
    "Ceará": "ce",
    "Distrito Federal": "df",
    "Espírito Santo": "es",
    "Goiás": "go",
    "Maranhão": "ma",
    "Mato Grosso": "mt",
    "Mato Grosso do Sul": "ms",
    "Minas Gerais": "mg",
    "Pará": "pa",
    "Paraíba": "pb",
    "Paraná": "pr",
    "Pernambuco": "pe",
    "Piauí": "pi",
    "Rio de Janeiro": "rj",
    "Rio Grande do Norte": "rn",
    "Rio Grande do Sul": "rs",
    "Rondônia": "ro",
    "Roraima": "rr",
    "Santa Catarina": "sc",
    "São Paulo": "sp",
    "Sergipe": "se",
    "Tocantins": "to"
  };
  
  return stateMappings[stateName] || null;
};

// 🎨 FUNÇÃO PARA OBTER COR CARACTERÍSTICA DO ESTADO BRASILEIRO
const getStateColor = (stateName: string): string => {
  // Cores características baseadas na identidade visual/bandeira de cada estado
  const stateColors: Record<string, string> = {
    // Região Norte
    "Acre": "#006837", // Verde da floresta amazônica
    "Amapá": "#1B5E20", // Verde escuro amazônico
    "Amazonas": "#2E7D32", // Verde da Amazônia
    "Pará": "#1976D2", // Azul do rio e céu amazônico - DESTAQUE ESPECIAL PARA O PARÁ!
    "Rondônia": "#8BC34A", // Verde claro
    "Roraima": "#4CAF50", // Verde médio
    "Tocantins": "#81C784", // Verde claro dourado
    
    // Região Nordeste  
    "Alagoas": "#0277BD", // Azul do mar
    "Bahia": "#FF9800", // Laranja/dourado
    "Ceará": "#F57C00", // Laranja do sol
    "Maranhão": "#D32F2F", // Vermelho
    "Paraíba": "#1976D2", // Azul
    "Pernambuco": "#FF5722", // Vermelho/laranja
    "Piauí": "#795548", // Marrom/terra
    "Rio Grande do Norte": "#00BCD4", // Azul claro do litoral
    "Sergipe": "#009688", // Verde azulado
    
    // Região Centro-Oeste
    "Distrito Federal": "#9C27B0", // Roxo (Brasília)
    "Goiás": "#CDDC39", // Verde amarelado do cerrado
    "Mato Grosso": "#8BC34A", // Verde do pantanal
    "Mato Grosso do Sul": "#4CAF50", // Verde pantanal
    
    // Região Sudeste
    "Espírito Santo": "#00E676", // Verde claro
    "Minas Gerais": "#FFC107", // Amarelo/dourado das montanhas
    "Rio de Janeiro": "#2196F3", // Azul carioca
    "São Paulo": "#E91E63", // Rosa/magenta industrial
    
    // Região Sul
    "Paraná": "#4CAF50", // Verde do pinheiro
    "Rio Grande do Sul": "#F44336", // Vermelho gaúcho
    "Santa Catarina": "#03A9F4"  // Azul catarinense
  };
  
  return stateColors[stateName] || "#757575"; // Cinza como fallback
};

// 🔗 FUNÇÃO PARA OBTER URL DA BANDEIRA DO ESTADO
// 🎯 Usando o repositório oficial de bandeiras dos estados brasileiros (CC0 License)
// Fonte: https://github.com/pierrelapalu/icones-bandeiras-br-uf

// ⚡ BASES (Múltiplos CDNs para maior confiabilidade)
const UF_FLAGS_BASES = {
  raw: "https://raw.githubusercontent.com/pierrelapalu/icones-bandeiras-br-uf/master/dist",
  cdn: "https://cdn.jsdelivr.net/gh/pierrelapalu/icones-bandeiras-br-uf@master/dist",
  unpkg: "https://unpkg.com/icones-bandeiras-br-uf@latest/dist",
} as const;

// 🗺️ MAPEAMENTO REAL DOS ESTADOS PARA OS ARQUIVOS DO REPOSITÓRIO
// Baseado na estrutura real do repositório pierrelapalu/icones-bandeiras-br-uf
const STATE_FILE_MAPPING: Record<string, { number: string; name: string }> = {
  "Acre": { number: "02", name: "acre" },
  "Alagoas": { number: "03", name: "alagoas" },
  "Amapá": { number: "04", name: "amapa" },
  "Amazonas": { number: "05", name: "amazonas" },
  "Bahia": { number: "06", name: "bahia" },
  "Ceará": { number: "07", name: "ceara" },
  "Distrito Federal": { number: "08", name: "distrito-federal" },
  "Espírito Santo": { number: "09", name: "espirito-santo" },
  "Goiás": { number: "10", name: "goias" },
  "Maranhão": { number: "11", name: "maranhao" },
  "Mato Grosso": { number: "12", name: "mato-grosso" },
  "Mato Grosso do Sul": { number: "13", name: "mato-grosso-do-sul" },
  "Minas Gerais": { number: "14", name: "minas-gerais" },
  "Pará": { number: "15", name: "para" },
  "Paraíba": { number: "16", name: "paraiba" },
  "Paraná": { number: "17", name: "parana" },
  "Pernambuco": { number: "18", name: "pernambuco" },
  "Piauí": { number: "19", name: "piaui" },
  "Rio de Janeiro": { number: "20", name: "rio-de-janeiro" },
  "Rio Grande do Norte": { number: "21", name: "rio-grande-do-norte" },
  "Rio Grande do Sul": { number: "22", name: "rio-grande-do-sul" },
  "Rondônia": { number: "23", name: "rondonia" },
  "Roraima": { number: "24", name: "roraima" },
  "Santa Catarina": { number: "25", name: "santa-catarina" },
  "São Paulo": { number: "26", name: "sao-paulo" },
  "Sergipe": { number: "27", name: "sergipe" },
  "Tocantins": { number: "28", name: "tocantins" }
};

type FlagStyle = "circle" | "square-rounded" | "rounded" | "full";
type FlagFormat = "svg" | "pdf" | "png";
type FlagSize = 200 | 800;

interface FlagOptions {
  format?: FlagFormat;
  size?: FlagSize;
  style?: FlagStyle;
}

// 🔗 FUNÇÃO ATUALIZADA PARA GERAR URLs DOS ARQUIVOS REAIS
const makeUrl = (base: string, stateName: string, opts: FlagOptions) => {
  const { format = "png", size = 200, style = "circle" } = opts || {};
  const stateInfo = STATE_FILE_MAPPING[stateName];
  
  if (!stateInfo) return null;
  
  const { number, name } = stateInfo;
  
  // Estrutura real do repositório:
  // /dist/{style}/png-{size}/{number}-{name}-{style}.png
  // /dist/{style}/svg/{number}-{name}-{style}.svg
  
  if (format === "svg") {
    return `${base}/${style}/svg/${number}-${name}-${style}.svg`;
  } else if (format === "pdf") {
    return `${base}/${style}/pdf/${number}-${name}-${style}.pdf`;
  } else {
    return `${base}/${style}/png-${size}/${number}-${name}-${style}.png`;
  }
};

export const getStateFlagUrl = (stateName: string, opts: FlagOptions = {}) => {
  const url = makeUrl(UF_FLAGS_BASES.raw, stateName, opts);
  if (!url) return "";
  console.log(`🔗 URL gerada para ${stateName}:`, url);
  return url;
};

// 🎨 FUNÇÕES UTILITÁRIAS PARA DIFERENTES ESTILOS DE BANDEIRAS DOS ESTADOS
// Exemplos de uso:
// - getStateFlagSVG("São Paulo", "rounded") → bandeira SVG arredondada ⭐ RECOMENDADO
// - getStateFlagCircular("Pará", 200) → bandeira PNG circular 200px
// - getStateFlagSquareRounded("Rio de Janeiro", 800) → bandeira PNG quadrada arredondada HD 800px

export const getStateFlagSVG = (stateName: string, style: FlagStyle = "rounded") => 
  getStateFlagUrl(stateName, { format: "svg", style });

export const getStateFlagCircular = (stateName: string, size: FlagSize = 200) => {
  const url = getStateFlagUrl(stateName, { format: "png", size, style: "circle" });
  console.log(`🏳️ Bandeira PNG circular ${stateName}:`, url);
  return url;
};

export const getStateFlagSquareRounded = (stateName: string, size: FlagSize = 200) => 
  getStateFlagUrl(stateName, { format: "png", size, style: "square-rounded" });

// ✅ COMPONENTE PERSONALIZADO PARA BANDEIRA/ÍCONE DE ESTADO
const StateFlagIcon: React.FC<{
  stateName: string;
  className?: string;
  flagOptions?: FlagOptions;
}> = ({ 
  stateName, 
  className = "w-6 h-4", 
  flagOptions = {} 
}) => {
  const [imgError, setImgError] = useState(false);
  const [urlIndex, setUrlIndex] = useState(0);

  // ✅ CORRIGIDO: Declarar todas as variáveis e hooks ANTES de qualquer return
  const stateExists = STATE_FILE_MAPPING[stateName];

  // Lista de URLs para tentar em sequência com diferentes estilos e fontes
  const urls = stateExists ? [
    // 🎯 PRIORIDADE 1: SVGs (melhor qualidade, vetorial, mais leves)
    makeUrl(UF_FLAGS_BASES.raw, stateName, { ...flagOptions, format: "svg", style: "rounded" }),
    makeUrl(UF_FLAGS_BASES.cdn, stateName, { ...flagOptions, format: "svg", style: "rounded" }),
    makeUrl(UF_FLAGS_BASES.unpkg, stateName, { ...flagOptions, format: "svg", style: "rounded" }),
    
    // 🎯 PRIORIDADE 2: SVGs circulares como alternativa
    makeUrl(UF_FLAGS_BASES.raw, stateName, { ...flagOptions, format: "svg", style: "circle" }),
    makeUrl(UF_FLAGS_BASES.cdn, stateName, { ...flagOptions, format: "svg", style: "circle" }),
    
    // 🎯 PRIORIDADE 3: PNGs (fallback)
    makeUrl(UF_FLAGS_BASES.raw, stateName, { ...flagOptions, format: "png", style: "circle" }),
    makeUrl(UF_FLAGS_BASES.cdn, stateName, { ...flagOptions, format: "png", style: "circle" }),
    
    // 🎯 FALLBACK FINAL: Bandeira genérica do Brasil
    `https://flagcdn.com/br.svg`
  ].filter((url): url is string => url !== null) : [];

  const [src, setSrc] = useState(urls[0] || "");

  // Reset quando mudar o estado ou opções
  useEffect(() => {
    if (!stateExists || urls.length === 0) return;
    
    const newSrc = urls[0] || "";
    setSrc(newSrc);
    setImgError(false);
    setUrlIndex(0);
    console.log(`🔄 Reset para ${stateName}: ${newSrc}`);
  }, [stateName, JSON.stringify(flagOptions), stateExists, urls.length]);

  const handleError = () => {
    console.log(`❌ Erro ao carregar: ${src} para ${stateName} (tentativa ${urlIndex + 1}/${urls.length})`);
    
    const nextIndex = urlIndex + 1;
    if (nextIndex < urls.length) {
      const nextUrl = urls[nextIndex];
      console.log(`⚠️ Tentando próxima URL (${nextIndex + 1}/${urls.length}): ${nextUrl}`);
      setSrc(nextUrl);
      setUrlIndex(nextIndex);
    } else {
      console.log(`❌ Todas as URLs falharam para ${stateName} - sem fallback visual`);
      setImgError(true);
    }
  };

  const handleLoad = () => {
    const sourceType = src.includes('jsdelivr') ? 'CDN JSDelivr' : 
                      src.includes('unpkg') ? 'UNPKG' : 
                      src.includes('.svg') ? `SVG ${src.includes('rounded') ? 'Arredondado' : 'Circular'}` :
                      src.includes('square-rounded') ? 'PNG Quadrado Arredondado' :
                      src.includes('circle') ? 'PNG Circular' : 'Fallback';
    console.log(`✅ Bandeira carregada: ${stateName} (tentativa ${urlIndex + 1}, fonte: ${sourceType})`);
  };

  // ✅ AGORA os returns condicionais vêm DEPOIS dos hooks
  if (!stateExists) {
    return (
      <div 
        className={`${className} rounded border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400`} 
        style={{ backgroundColor: "#F3F4F6" }}
        title={`Estado não encontrado: ${stateName}`}
      >
        --
      </div>
    );
  }

  return (
    <div className={`${className} rounded border border-gray-200 overflow-hidden bg-white relative`}>
      {!imgError && src && (
        <img
          src={src}
          alt={`Bandeira ${stateName}`}
          className="w-full h-full object-cover"
          onLoad={handleLoad}
          onError={handleError}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
};

// �️ COMPONENTE HÍBRIDO MUNICÍPIOS: Gráfico de Barras + Tabela Interativa
const MunicipalitiesChartWithTable: React.FC<{
  data: ChartDataItem[];
  title: string;
  icon: React.ReactNode;
  onItemClick?: (category: string, value: string, multiSelect?: boolean) => void;
  filterCategory: string;
  activeFilter?: string | string[];
  stateFilter?: string; // Novo: para mostrar se há filtro de estado ativo
  ctrlPressed: boolean;
}> = ({ data, title, icon, onItemClick, filterCategory, activeFilter, stateFilter, ctrlPressed }) => {
  // Top 10 municípios para o gráfico (ordenados por valor decrescente, excluindo "Ignorado")
  const top10Municipalities = [...data]
    .filter(item => item.name.toLowerCase() !== 'ignorado')
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  
  const handleBarClick = (item: any) => {
    if (onItemClick && item && item.name) {
      onItemClick(filterCategory, item.name, ctrlPressed);
    }
  };

  const handleTableClick = (municipalityName: string) => {
    if (onItemClick) {
      onItemClick(filterCategory, municipalityName, ctrlPressed);
    }
  };

  // Verificar se um item está filtrado
  const isItemFiltered = (itemName: string): boolean => {
    if (!activeFilter) return false;
    if (Array.isArray(activeFilter)) {
      return activeFilter.includes(itemName);
    }
    return activeFilter === itemName;
  };

  // Obter cor da célula baseado em filtros ativos
  const getCellColor = (itemName: string, baseColor: string): string => {
    if (!activeFilter) return baseColor;
    if (Array.isArray(activeFilter) && activeFilter.length > 0) {
      return isItemFiltered(itemName) ? baseColor : baseColor + '4D';
    }
    return baseColor;
  };

  // Componente de célula personalizada para as barras com cores graduais

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
            {data.length} {data.length === 1 ? 'município' : 'municípios'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ChartExportMenu
            chartId={`${filterCategory}-chart`}
            chartData={data}
            chartTitle={title}
            buttonVariant="icon"
          />
          {stateFilter && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <span>Estado: </span>
              <span className="font-semibold">{stateFilter}</span>
            </div>
          )}
          {activeFilter && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              <span>Município: </span>
              <span className="font-semibold">{activeFilter}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gráfico de Barras - Top 10 */}
        <div className="xl:col-span-2">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-700 mb-2">
              Top 10 Municípios{stateFilter ? ` de ${stateFilter}` : ''}
            </h4>
            <p className="text-sm text-gray-500">Clique nas barras para filtrar por município</p>
          </div>
          
          {top10Municipalities.length > 0 ? (
            <div id={`${filterCategory}-chart`}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={top10Municipalities} margin={{ top: 40, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={11}
                    interval={0}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        
                        return (
                          <div className="bg-white p-4 border rounded-lg shadow-lg min-w-48">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-6 h-6 rounded border border-gray-200 bg-green-100 flex items-center justify-center">
                                <Building className="h-3 w-3 text-green-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{label}</p>
                                {stateFilter && <p className="text-xs text-gray-500">{stateFilter}</p>}
                              </div>
                            </div>
                            <p className="text-green-600">
                              <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: payload?.[0]?.color || '#4CAF50' }}></span>
                              <span className="font-bold">{data.value}</span> {data.value === 1 ? 'caso' : 'casos'}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    cursor="pointer"
                    onClick={handleBarClick}
                    radius={[4, 4, 0, 0]}
                  >
                    {top10Municipalities.map((entry, index) => {
                      // Gradiente de azul do aplicativo (cores.tsx - blue palette)
                      const colors = [
                        "#1a3cad", "#2a49c4", "#3b5bdb", "#4c6cf1", "#5d7df7",
                        "#7f96f9", "#a1affb", "#c2c9fd", "#e4e8fe", "#c2c9fd"
                      ];
                      const color = colors[index % colors.length];
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getCellColor(entry.name, color)}
                          stroke={isItemFiltered(entry.name) ? '#000000' : 'none'}
                          strokeWidth={isItemFiltered(entry.name) ? 4 : 0}
                        />
                      );
                    })}
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(value: number) => value.toLocaleString()}
                      style={{ fontSize: '14px', fontWeight: 'bold', fill: '#374151' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Building className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum dado de município disponível</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabela Completa - Todos os Municípios */}
        <div className="xl:col-span-1">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-700 mb-2">
              Todos os Municípios{stateFilter ? ` (${stateFilter})` : ''}
            </h4>
            <p className="text-sm text-gray-500">Clique para filtrar por município</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {data.map((item, index) => {
                const isActive = activeFilter === item.name;
                // Cores alternadas baseadas no índice
                const colors = [
                  "#1976D2", "#2196F3", "#4CAF50", "#FF9800", "#9C27B0", 
                  "#F44336", "#00BCD4", "#CDDC39", "#FF5722", "#795548"
                ];
                const itemColor = colors[index % colors.length];
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      isActive 
                        ? 'bg-green-100 border border-green-300 shadow-sm' 
                        : 'bg-white hover:bg-gray-100 border border-transparent hover:shadow-sm'
                    }`}
                    onClick={() => handleTableClick(item.name)}
                    title={`Clique para filtrar por ${item.name}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border border-gray-200 flex items-center justify-center"
                          style={{ backgroundColor: itemColor + '20' }}
                        >
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: itemColor }}
                          ></div>
                        </div>
                        <div>
                          <span className={`font-medium text-sm ${isActive ? 'text-green-800' : 'text-gray-700'}`}>
                            {item.name}
                          </span>
                          {stateFilter && (
                            <div className="text-xs text-gray-500">{stateFilter}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isActive ? 'text-green-700' : 'text-gray-600'}`}>
                        {item.value}
                      </span>
                      {isActive && <span className="text-green-500 text-xs">●</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// �️ COMPONENTE HÍBRIDO BAIRROS: Gráfico de Barras + Tabela Interativa
const NeighborhoodsChartWithTable: React.FC<{
  data: ChartDataItem[];
  title: string;
  icon: React.ReactNode;
  onItemClick?: (category: string, value: string, multiSelect?: boolean) => void;
  filterCategory: string;
  activeFilter?: string | string[];
  municipalityFilter?: string; // Novo: para mostrar se há filtro de município ativo
  stateFilter?: string; // Novo: para mostrar se há filtro de estado ativo
  ctrlPressed: boolean;
}> = ({ data, title, icon, onItemClick, filterCategory, activeFilter, municipalityFilter, stateFilter, ctrlPressed }) => {
  // Top 10 bairros para o gráfico (ordenados por valor decrescente, excluindo "Ignorado")
  const top10Neighborhoods = [...data]
    .filter(item => item.name.toLowerCase() !== 'ignorado')
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  
  const handleBarClick = (item: any) => {
    if (onItemClick && item && item.name) {
      onItemClick(filterCategory, item.name, ctrlPressed);
    }
  };

  const handleTableClick = (neighborhoodName: string) => {
    if (onItemClick) {
      onItemClick(filterCategory, neighborhoodName, ctrlPressed);
    }
  };

  // Verificar se um item está filtrado
  const isItemFiltered = (itemName: string): boolean => {
    if (!activeFilter) return false;
    if (Array.isArray(activeFilter)) {
      return activeFilter.includes(itemName);
    }
    return activeFilter === itemName;
  };

  // Obter cor da célula baseado em filtros ativos
  const getCellColor = (itemName: string, baseColor: string): string => {
    if (!activeFilter) return baseColor;
    if (Array.isArray(activeFilter) && activeFilter.length > 0) {
      return isItemFiltered(itemName) ? baseColor : baseColor + '4D';
    }
    return baseColor;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
            {data.length} {data.length === 1 ? 'bairro' : 'bairros'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ChartExportMenu
            chartId={`${filterCategory}-chart`}
            chartData={data}
            chartTitle={title}
            buttonVariant="icon"
          />
          {stateFilter && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              <span>Estado: </span>
              <span className="font-semibold">{stateFilter}</span>
            </div>
          )}
          {municipalityFilter && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <span>Município: </span>
              <span className="font-semibold">{municipalityFilter}</span>
            </div>
          )}
          {activeFilter && (
            <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
              <span>Bairro: </span>
              <span className="font-semibold">{activeFilter}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gráfico de Barras - Top 15 */}
        <div className="xl:col-span-2">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-700 mb-2">
              Top 10 Bairros
              {municipalityFilter && ` de ${municipalityFilter}`}
              {stateFilter && !municipalityFilter && ` de ${stateFilter}`}
            </h4>
            <p className="text-sm text-gray-500">Clique nas barras para filtrar por bairro</p>
          </div>
          
          {top10Neighborhoods.length > 0 ? (
            <div id={`${filterCategory}-chart`}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={top10Neighborhoods} margin={{ top: 40, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={11}
                    interval={0}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        
                        return (
                          <div className="bg-white p-4 border rounded-lg shadow-lg min-w-48">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-6 h-6 rounded border border-gray-200 bg-purple-100 flex items-center justify-center">
                                <Home className="h-3 w-3 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{label}</p>
                                {municipalityFilter && <p className="text-xs text-gray-500">{municipalityFilter}</p>}
                                {stateFilter && !municipalityFilter && <p className="text-xs text-gray-500">{stateFilter}</p>}
                                {stateFilter && municipalityFilter && <p className="text-xs text-gray-400">{stateFilter}</p>}
                              </div>
                            </div>
                            <p className="text-purple-600">
                              <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: payload?.[0]?.color || '#9C27B0' }}></span>
                              <span className="font-bold">{data.value}</span> {data.value === 1 ? 'caso' : 'casos'}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    cursor="pointer"
                    onClick={handleBarClick}
                    radius={[4, 4, 0, 0]}
                  >
                    {top10Neighborhoods.map((entry, index) => {
                      // Gradiente de azul do aplicativo (cores.tsx - blue palette)
                      const colors = [
                        "#1a3cad", "#2a49c4", "#3b5bdb", "#4c6cf1", "#5d7df7",
                        "#7f96f9", "#a1affb", "#c2c9fd", "#e4e8fe", "#c2c9fd"
                      ];
                      const color = colors[index % colors.length];
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getCellColor(entry.name, color)}
                          stroke={isItemFiltered(entry.name) ? '#000000' : 'none'}
                          strokeWidth={isItemFiltered(entry.name) ? 4 : 0}
                        />
                      );
                    })}
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(value: number) => value.toLocaleString()}
                      style={{ fontSize: '14px', fontWeight: 'bold', fill: '#374151' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Home className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum dado de bairro disponível</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabela Completa - Todos os Bairros */}
        <div className="xl:col-span-1">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-700 mb-2">
              Todos os Bairros
              {municipalityFilter && ` (${municipalityFilter})`}
              {stateFilter && !municipalityFilter && ` (${stateFilter})`}
            </h4>
            <p className="text-sm text-gray-500">Clique para filtrar por bairro</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {data.map((item, index) => {
                const isActive = activeFilter === item.name;
                // Cores alternadas baseadas no índice
                const colors = [
                  "#9C27B0", "#E91E63", "#F44336", "#FF9800", "#4CAF50", 
                  "#2196F3", "#00BCD4", "#795548", "#607D8B", "#9E9E9E"
                ];
                const itemColor = colors[index % colors.length];
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      isActive 
                        ? 'bg-purple-100 border border-purple-300 shadow-sm' 
                        : 'bg-white hover:bg-gray-100 border border-transparent hover:shadow-sm'
                    }`}
                    onClick={() => handleTableClick(item.name)}
                    title={`Clique para filtrar por ${item.name}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border border-gray-200 flex items-center justify-center"
                          style={{ backgroundColor: itemColor + '20' }}
                        >
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: itemColor }}
                          ></div>
                        </div>
                        <div>
                          <span className={`font-medium text-sm ${isActive ? 'text-purple-800' : 'text-gray-700'}`}>
                            {item.name}
                          </span>
                          {municipalityFilter && (
                            <div className="text-xs text-gray-500">{municipalityFilter}</div>
                          )}
                          {stateFilter && !municipalityFilter && (
                            <div className="text-xs text-gray-500">{stateFilter}</div>
                          )}
                          {stateFilter && municipalityFilter && (
                            <div className="text-xs text-gray-400">{stateFilter}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isActive ? 'text-purple-700' : 'text-gray-600'}`}>
                        {item.value}
                      </span>
                      {isActive && <span className="text-purple-500 text-xs">●</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// �🏛️ COMPONENTE HÍBRIDO ESTADOS: Gráfico de Barras + Tabela Interativa
const StatesChartWithTable: React.FC<{
  data: ChartDataItem[];
  title: string;
  icon: React.ReactNode;
  onItemClick?: (category: string, value: string, multiSelect?: boolean) => void;
  filterCategory: string;
  activeFilter?: string | string[];
  ctrlPressed: boolean;
}> = ({ data, title, icon, onItemClick, filterCategory, activeFilter, ctrlPressed }) => {
  // Top 10 estados para o gráfico (ordenados por valor decrescente, excluindo "Ignorado")
  const top10States = [...data]
    .filter(item => item.name.toLowerCase() !== 'ignorado')
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  
  const handleBarClick = (item: any) => {
    if (onItemClick && item && item.name) {
      onItemClick(filterCategory, item.name, ctrlPressed);
    }
  };

  const handleTableClick = (stateName: string) => {
    if (onItemClick) {
      onItemClick(filterCategory, stateName, ctrlPressed);
    }
  };

  // Verificar se um item está filtrado
  const isItemFiltered = (itemName: string): boolean => {
    if (!activeFilter) return false;
    if (Array.isArray(activeFilter)) {
      return activeFilter.includes(itemName);
    }
    return activeFilter === itemName;
  };

  // Obter cor da célula baseado em filtros ativos
  const getCellColor = (itemName: string, baseColor: string): string => {
    if (!activeFilter) return baseColor;
    if (Array.isArray(activeFilter) && activeFilter.length > 0) {
      return isItemFiltered(itemName) ? baseColor : baseColor + '4D';
    }
    return baseColor;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            {data.length} {data.length === 1 ? 'estado' : 'estados'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ChartExportMenu
            chartId={`${filterCategory}-chart`}
            chartData={data}
            chartTitle={title}
            buttonVariant="icon"
          />
          {activeFilter && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              <span>Filtro ativo: </span>
              <span className="font-semibold">{activeFilter}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gráfico de Barras - Top 10 */}
        <div className="xl:col-span-2">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-700 mb-2">Top 10 Estados</h4>
            <p className="text-sm text-gray-500">Clique nas barras para filtrar por estado</p>
          </div>
          
          {top10States.length > 0 ? (
            <div id={`${filterCategory}-chart`}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={top10States} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                    interval={0}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        
                        return (
                          <div className="bg-white p-4 border rounded-lg shadow-lg min-w-48">
                            <div className="flex items-center gap-3 mb-2">
                              <StateFlagIcon stateName={label} className="w-8 h-6" />
                              <div>
                                <p className="font-semibold text-gray-800">{label}</p>
                                <p className="text-xs text-gray-500 uppercase">{getStateFlagCode(label)}</p>
                              </div>
                            </div>
                            <p className="text-blue-600">
                              <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getStateColor(label) }}></span>
                              <span className="font-bold">{data.value}</span> {data.value === 1 ? 'caso' : 'casos'}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    cursor="pointer"
                    onClick={handleBarClick}
                    radius={[4, 4, 0, 0]}
                  >
                    {top10States.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getCellColor(entry.name, getStateColor(entry.name))}
                        stroke={isItemFiltered(entry.name) ? '#000000' : 'none'}
                        strokeWidth={isItemFiltered(entry.name) ? 4 : 0}
                      />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(value: number) => value.toLocaleString()}
                      style={{ fontSize: '14px', fontWeight: 'bold', fill: '#374151' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Building className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum dado de estado disponível</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabela Completa - Todos os Estados */}
        <div className="xl:col-span-1">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-700 mb-2">Todos os Estados</h4>
            <p className="text-sm text-gray-500">Clique para filtrar por estado</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {data.map((item, index) => {
                const isActive = activeFilter === item.name;
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-100 border border-blue-300 shadow-sm' 
                        : 'bg-white hover:bg-gray-100 border border-transparent hover:shadow-sm'
                    }`}
                    onClick={() => handleTableClick(item.name)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <StateFlagIcon stateName={item.name} className="w-6 h-4" />
                        <div>
                          <span className={`font-medium text-sm ${isActive ? 'text-blue-800' : 'text-gray-700'}`}>
                            {item.name}
                          </span>
                          <div className="text-xs text-gray-500 uppercase">{getStateFlagCode(item.name)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                        {item.value}
                      </span>
                      {isActive && <span className="text-blue-500 text-xs">●</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const CountriesChartWithTable: React.FC<{
  data: ChartDataItem[];
  title: string;
  icon: React.ReactNode;
  onItemClick?: (category: string, value: string, multiSelect?: boolean) => void;
  filterCategory: string;
  activeFilter?: string | string[];
  ctrlPressed: boolean;
}> = ({ data, title, icon, onItemClick, filterCategory, activeFilter, ctrlPressed }) => {
  // Top 10 países para o gráfico (ordenados por valor decrescente, excluindo "Ignorado")
  const top10Countries = [...data]
    .filter(item => item.name.toLowerCase() !== 'ignorado')
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  
  const handleItemClick = (countryName: string) => {
    if (onItemClick) {
      onItemClick(filterCategory, countryName, ctrlPressed);
    }
  };

  const handleBarClick = (clickData: any) => {
    if (clickData && clickData.name) {
      handleItemClick(clickData.name);
    }
  };

  const handleTableRowClick = (countryName: string) => {
    handleItemClick(countryName);
  };

  // Verificar se um item está filtrado (suporte para string ou array)
  const isItemFiltered = (itemName: string): boolean => {
    if (!activeFilter) return false;
    if (Array.isArray(activeFilter)) {
      return activeFilter.includes(itemName);
    }
    return activeFilter === itemName;
  };

  // Obter cor da célula baseado em filtros ativos
  const getCellColor = (itemName: string, baseColor: string): string => {
    if (!activeFilter) return baseColor;
    if (Array.isArray(activeFilter) && activeFilter.length > 0) {
      return isItemFiltered(itemName) ? baseColor : baseColor + '4D';
    }
    return baseColor;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            {data.length} {data.length === 1 ? 'país' : 'países'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ChartExportMenu
            chartId={`${filterCategory}-chart`}
            chartData={data}
            chartTitle={title}
            buttonVariant="icon"
          />
          {activeFilter && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              <span>Filtro ativo: </span>
              <span className="font-semibold">{activeFilter}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gráfico de Barras - Top 10 */}
        <div className="xl:col-span-2">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-700 mb-2">Top 10 Países</h4>
            <p className="text-sm text-gray-500">Clique nas barras para filtrar por país</p>
          </div>
          
          {top10Countries.length > 0 ? (
            <div id={`${filterCategory}-chart`}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={top10Countries} margin={{ top: 30, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={11}
                    interval={0}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        const countryData = data.payload; // Acessar dados originais do país
                        
                        return (
                          <div className="bg-white p-4 border rounded-lg shadow-lg min-w-48">
                            <div className="flex items-center gap-3 mb-2">
                              {getFlagUrl(label) ? (
                                <div className="flex items-center justify-center w-8 h-6 rounded border border-gray-200 bg-white overflow-hidden">
                                  <img 
                                    src={getFlagUrl(label)!} 
                                    alt={`Bandeira ${label}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Se a imagem falhar, mostrar um ícone de globo
                                      const target = e.target as HTMLImageElement;
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `<div class="w-6 h-6 rounded border border-gray-200 bg-blue-100 flex items-center justify-center"><svg class="h-3 w-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="m6.93 6.93 10.14 10.14"></path><path d="M6.93 17.07 17.07 6.93"></path></svg></div>`;
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div 
                                  className="w-8 h-6 rounded border border-gray-200 flex items-center justify-center"
                                  style={{ backgroundColor: countryData?.fill ? countryData.fill + '20' : '#3b82f620' }}
                                >
                                  <Globe className="h-3 w-3" style={{ color: countryData?.fill || '#3b82f6' }} />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-800">{label}</p>
                                <p className="text-xs text-gray-500 uppercase">
                                  {getCountryFlagCode(label) || 'País'}
                                </p>
                              </div>
                            </div>
                            <p className="text-blue-600">
                              <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: countryData?.fill || '#3b82f6' }}></span>
                              <span className="font-bold">{data.value}</span> {data.value === 1 ? 'caso' : 'casos'}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    cursor="pointer"
                    onClick={handleBarClick}
                    radius={[2, 2, 0, 0]}
                  >
                    {top10Countries.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getCellColor(entry.name, entry.fill)}
                        stroke={isItemFiltered(entry.name) ? '#000000' : 'none'}
                        strokeWidth={isItemFiltered(entry.name) ? 4 : 0}
                      />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(value: number) => value.toLocaleString()}
                      style={{ fontSize: '14px', fontWeight: 'bold', fill: '#374151' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Globe className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum país registrado</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabela Completa - Todos os Países */}
        <div className="xl:col-span-1">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-700 mb-2">Todos os Países</h4>
            <p className="text-sm text-gray-500">Clique para filtrar por país</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {data.map((country, index) => {
                const isActive = activeFilter === country.name;
                const abbreviatedName = abbreviateCountryName(country.name);
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-100 border border-blue-300 shadow-sm' 
                        : 'bg-white hover:bg-gray-100 border border-transparent hover:shadow-sm'
                    }`}
                    onClick={() => handleTableRowClick(country.name)}
                    title={`${country.name} - Clique para filtrar`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getFlagUrl(country.name) ? (
                          <div className="flex items-center justify-center w-6 h-4 rounded border border-gray-200 bg-white overflow-hidden flex-shrink-0">
                            <img 
                              src={getFlagUrl(country.name)!} 
                              alt={`Bandeira ${abbreviatedName}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="w-3 h-3 rounded-full" style="background-color: ${country.fill}"></div>`;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: country.fill }}
                          ></div>
                        )}
                        <span className={`font-medium text-sm truncate ${isActive ? 'text-blue-800' : 'text-gray-700'}`}>
                          {abbreviatedName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                        {country.value}
                      </span>
                      {isActive && <span className="text-blue-500 text-xs">●</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal do painel de localização geográfica
const GeographicLocationPanel: React.FC<GeographicLocationPanelProps> = ({
  paisData,
  estadoData,
  municipioData, 
  bairroData,
  onFilterClick,
  activeFilters = {},
  exportMenu
}) => {
  // Ref para rastrear estado do Ctrl
  const ctrlPressedRef = useRef(false);

  // Adicionar listeners globais para detectar Ctrl
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlPressedRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlPressedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="space-y-4" data-dashboard="geographic-location">
      {/* Cabeçalho do painel - Compacto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MapPin className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Localização Geográfica</h2>
            <p className="text-xs text-gray-600">Distribuição por localização de residência</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DashboardExportMenu
            paisData={paisData}
            estadoData={estadoData}
            municipioData={municipioData}
            bairroData={bairroData}
            totalRecords={paisData.reduce((sum, item) => sum + item.value, 0) + 
                         estadoData.reduce((sum, item) => sum + item.value, 0) + 
                         municipioData.reduce((sum, item) => sum + item.value, 0) + 
                         bairroData.reduce((sum, item) => sum + item.value, 0)}
            activeFilters={activeFilters}
            buttonVariant="button"
            className="text-sm"
            title="Painel Geográfico"
          />
          {exportMenu}
        </div>
      </div>

      {/* Grade responsiva dos gráficos - Layout em 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Países - Gráfico Híbrido (Barras + Tabela) */}
        <div className="lg:col-span-1">
          <CountriesChartWithTable
            data={paisData}
            title="Países de Residência"
            icon={<Globe className="h-5 w-5 text-blue-600" />}
            onItemClick={onFilterClick}
            filterCategory="pais"
            activeFilter={activeFilters?.pais}
            ctrlPressed={ctrlPressedRef.current}
          />
        </div>

        {/* Componente Híbrido - Estados/UF com Gráfico + Tabela */}
        <div className="lg:col-span-1">
          <StatesChartWithTable
            data={estadoData}
            title="Estados/UF de Residência"
            icon={<Building className="h-5 w-5 text-blue-600" />}
            onItemClick={onFilterClick}
            filterCategory="estado"
            activeFilter={activeFilters?.estado}
            ctrlPressed={ctrlPressedRef.current}
          />
        </div>

        {/* Componente Híbrido - Municípios com Gráfico + Tabela */}
        <div className="lg:col-span-1">
          <MunicipalitiesChartWithTable
            data={municipioData}
            title="Municípios de Residência"
            icon={<Building className="h-5 w-5 text-green-600" />}
            onItemClick={onFilterClick}
            filterCategory="municipio"
            activeFilter={activeFilters?.municipio}
            stateFilter={activeFilters?.estado} // Passa o filtro de estado ativo
            ctrlPressed={ctrlPressedRef.current}
          />
        </div>

        {/* Componente Híbrido - Bairros com Gráfico + Tabela */}
        <div className="lg:col-span-1">
          <NeighborhoodsChartWithTable
            data={bairroData}
            title="Bairros de Residência"
            icon={<Home className="h-5 w-5 text-purple-600" />}
            onItemClick={onFilterClick}
            filterCategory="bairro"
            activeFilter={activeFilters?.bairro}
            municipalityFilter={activeFilters?.municipio} // Passa o filtro de município ativo
            stateFilter={activeFilters?.estado} // Passa o filtro de estado ativo
            ctrlPressed={ctrlPressedRef.current}
          />
        </div>
      </div>

      {/* Informações adicionais */}
      {(activeFilters?.pais || activeFilters?.estado || activeFilters?.municipio || activeFilters?.bairro) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">Filtros de Localização Ativos</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters?.pais && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                País: {activeFilters.pais}
              </span>
            )}
            {activeFilters?.estado && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                Estado: {activeFilters.estado}
              </span>
            )}
            {activeFilters?.municipio && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                Município: {activeFilters.municipio}
              </span>
            )}
            {activeFilters?.bairro && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                Bairro: {activeFilters.bairro}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeographicLocationPanel;
