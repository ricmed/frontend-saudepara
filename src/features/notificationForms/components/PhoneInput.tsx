import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

// Interface para os países com DDI
interface CountryCode {
  name: string;
  code: string;
  dial_code: string;
}

// Logger para rastrear as transformações do número de telefone
const phoneLogger = {
  enable: false, // Desabilitado por padrão
  log: (stage: string, data: any) => {
    if (phoneLogger.enable) {
      console.log(`[PHONE ${stage}]`, data);
    }
  }
};

// Lista completa de países com DDI
const countryCodes: CountryCode[] = [
  { name: "Afeganistão", code: "AF", dial_code: "+93" },
  { name: "África do Sul", code: "ZA", dial_code: "+27" },
  { name: "Albânia", code: "AL", dial_code: "+355" },
  { name: "Alemanha", code: "DE", dial_code: "+49" },
  { name: "Andorra", code: "AD", dial_code: "+376" },
  { name: "Angola", code: "AO", dial_code: "+244" },
  { name: "Anguilla", code: "AI", dial_code: "+1264" },
  { name: "Antártida", code: "AQ", dial_code: "+672" },
  { name: "Antígua e Barbuda", code: "AG", dial_code: "+1268" },
  { name: "Arábia Saudita", code: "SA", dial_code: "+966" },
  { name: "Argélia", code: "DZ", dial_code: "+213" },
  { name: "Argentina", code: "AR", dial_code: "+54" },
  { name: "Armênia", code: "AM", dial_code: "+374" },
  { name: "Aruba", code: "AW", dial_code: "+297" },
  { name: "Austrália", code: "AU", dial_code: "+61" },
  { name: "Áustria", code: "AT", dial_code: "+43" },
  { name: "Azerbaijão", code: "AZ", dial_code: "+994" },
  { name: "Bahamas", code: "BS", dial_code: "+1242" },
  { name: "Bahrein", code: "BH", dial_code: "+973" },
  { name: "Bangladesh", code: "BD", dial_code: "+880" },
  { name: "Barbados", code: "BB", dial_code: "+1246" },
  { name: "Bélgica", code: "BE", dial_code: "+32" },
  { name: "Belize", code: "BZ", dial_code: "+501" },
  { name: "Benin", code: "BJ", dial_code: "+229" },
  { name: "Bermudas", code: "BM", dial_code: "+1441" },
  { name: "Bielorrússia", code: "BY", dial_code: "+375" },
  { name: "Bolívia", code: "BO", dial_code: "+591" },
  { name: "Bósnia e Herzegovina", code: "BA", dial_code: "+387" },
  { name: "Botswana", code: "BW", dial_code: "+267" },
  { name: "Brasil", code: "BR", dial_code: "+55" },
  { name: "Brunei", code: "BN", dial_code: "+673" },
  { name: "Bulgária", code: "BG", dial_code: "+359" },
  { name: "Burkina Faso", code: "BF", dial_code: "+226" },
  { name: "Burundi", code: "BI", dial_code: "+257" },
  { name: "Butão", code: "BT", dial_code: "+975" },
  { name: "Cabo Verde", code: "CV", dial_code: "+238" },
  { name: "Camarões", code: "CM", dial_code: "+237" },
  { name: "Camboja", code: "KH", dial_code: "+855" },
  { name: "Canadá", code: "CA", dial_code: "+1" },
  { name: "Catar", code: "QA", dial_code: "+974" },
  { name: "Cazaquistão", code: "KZ", dial_code: "+7" },
  { name: "Chade", code: "TD", dial_code: "+235" },
  { name: "Chile", code: "CL", dial_code: "+56" },
  { name: "China", code: "CN", dial_code: "+86" },
  { name: "Chipre", code: "CY", dial_code: "+357" },
  { name: "Colômbia", code: "CO", dial_code: "+57" },
  { name: "Comores", code: "KM", dial_code: "+269" },
  { name: "Congo", code: "CG", dial_code: "+242" },
  { name: "Congo, República Democrática", code: "CD", dial_code: "+243" },
  { name: "Coreia do Norte", code: "KP", dial_code: "+850" },
  { name: "Coreia do Sul", code: "KR", dial_code: "+82" },
  { name: "Costa do Marfim", code: "CI", dial_code: "+225" },
  { name: "Costa Rica", code: "CR", dial_code: "+506" },
  { name: "Croácia", code: "HR", dial_code: "+385" },
  { name: "Cuba", code: "CU", dial_code: "+53" },
  { name: "Dinamarca", code: "DK", dial_code: "+45" },
  { name: "Djibouti", code: "DJ", dial_code: "+253" },
  { name: "Dominica", code: "DM", dial_code: "+1767" },
  { name: "Egito", code: "EG", dial_code: "+20" },
  { name: "El Salvador", code: "SV", dial_code: "+503" },
  { name: "Emirados Árabes Unidos", code: "AE", dial_code: "+971" },
  { name: "Equador", code: "EC", dial_code: "+593" },
  { name: "Eritreia", code: "ER", dial_code: "+291" },
  { name: "Eslováquia", code: "SK", dial_code: "+421" },
  { name: "Eslovênia", code: "SI", dial_code: "+386" },
  { name: "Espanha", code: "ES", dial_code: "+34" },
  { name: "Estados Unidos", code: "US", dial_code: "+1" },
  { name: "Estônia", code: "EE", dial_code: "+372" },
  { name: "Etiópia", code: "ET", dial_code: "+251" },
  { name: "Fiji", code: "FJ", dial_code: "+679" },
  { name: "Filipinas", code: "PH", dial_code: "+63" },
  { name: "Finlândia", code: "FI", dial_code: "+358" },
  { name: "França", code: "FR", dial_code: "+33" },
  { name: "Gabão", code: "GA", dial_code: "+241" },
  { name: "Gâmbia", code: "GM", dial_code: "+220" },
  { name: "Gana", code: "GH", dial_code: "+233" },
  { name: "Geórgia", code: "GE", dial_code: "+995" },
  { name: "Gibraltar", code: "GI", dial_code: "+350" },
  { name: "Grécia", code: "GR", dial_code: "+30" },
  { name: "Groenlândia", code: "GL", dial_code: "+299" },
  { name: "Guadalupe", code: "GP", dial_code: "+590" },
  { name: "Guam", code: "GU", dial_code: "+1671" },
  { name: "Guatemala", code: "GT", dial_code: "+502" },
  { name: "Guiana", code: "GY", dial_code: "+592" },
  { name: "Guiana Francesa", code: "GF", dial_code: "+594" },
  { name: "Guiné", code: "GN", dial_code: "+224" },
  { name: "Guiné Equatorial", code: "GQ", dial_code: "+240" },
  { name: "Guiné-Bissau", code: "GW", dial_code: "+245" },
  { name: "Haiti", code: "HT", dial_code: "+509" },
  { name: "Honduras", code: "HN", dial_code: "+504" },
  { name: "Hong Kong", code: "HK", dial_code: "+852" },
  { name: "Hungria", code: "HU", dial_code: "+36" },
  { name: "Iêmen", code: "YE", dial_code: "+967" },
  { name: "Ilhas Cayman", code: "KY", dial_code: "+1345" },
  { name: "Ilhas Cook", code: "CK", dial_code: "+682" },
  { name: "Ilhas Faroe", code: "FO", dial_code: "+298" },
  { name: "Ilhas Malvinas", code: "FK", dial_code: "+500" },
  { name: "Ilhas Marshall", code: "MH", dial_code: "+692" },
  { name: "Ilhas Salomão", code: "SB", dial_code: "+677" },
  { name: "Ilhas Virgens Americanas", code: "VI", dial_code: "+1340" },
  { name: "Ilhas Virgens Britânicas", code: "VG", dial_code: "+1284" },
  { name: "Índia", code: "IN", dial_code: "+91" },
  { name: "Indonésia", code: "ID", dial_code: "+62" },
  { name: "Irã", code: "IR", dial_code: "+98" },
  { name: "Iraque", code: "IQ", dial_code: "+964" },
  { name: "Irlanda", code: "IE", dial_code: "+353" },
  { name: "Islândia", code: "IS", dial_code: "+354" },
  { name: "Israel", code: "IL", dial_code: "+972" },
  { name: "Itália", code: "IT", dial_code: "+39" },
  { name: "Jamaica", code: "JM", dial_code: "+1876" },
  { name: "Japão", code: "JP", dial_code: "+81" },
  { name: "Jordânia", code: "JO", dial_code: "+962" },
  { name: "Kiribati", code: "KI", dial_code: "+686" },
  { name: "Kuwait", code: "KW", dial_code: "+965" },
  { name: "Laos", code: "LA", dial_code: "+856" },
  { name: "Lesoto", code: "LS", dial_code: "+266" },
  { name: "Letônia", code: "LV", dial_code: "+371" },
  { name: "Líbano", code: "LB", dial_code: "+961" },
  { name: "Libéria", code: "LR", dial_code: "+231" },
  { name: "Líbia", code: "LY", dial_code: "+218" },
  { name: "Liechtenstein", code: "LI", dial_code: "+423" },
  { name: "Lituânia", code: "LT", dial_code: "+370" },
  { name: "Luxemburgo", code: "LU", dial_code: "+352" },
  { name: "Macau", code: "MO", dial_code: "+853" },
  { name: "Macedônia do Norte", code: "MK", dial_code: "+389" },
  { name: "Madagascar", code: "MG", dial_code: "+261" },
  { name: "Malásia", code: "MY", dial_code: "+60" },
  { name: "Malawi", code: "MW", dial_code: "+265" },
  { name: "Maldivas", code: "MV", dial_code: "+960" },
  { name: "Mali", code: "ML", dial_code: "+223" },
  { name: "Malta", code: "MT", dial_code: "+356" },
  { name: "Marrocos", code: "MA", dial_code: "+212" },
  { name: "Martinica", code: "MQ", dial_code: "+596" },
  { name: "Maurício", code: "MU", dial_code: "+230" },
  { name: "Mauritânia", code: "MR", dial_code: "+222" },
  { name: "México", code: "MX", dial_code: "+52" },
  { name: "Micronésia", code: "FM", dial_code: "+691" },
  { name: "Moçambique", code: "MZ", dial_code: "+258" },
  { name: "Moldávia", code: "MD", dial_code: "+373" },
  { name: "Mônaco", code: "MC", dial_code: "+377" },
  { name: "Mongólia", code: "MN", dial_code: "+976" },
  { name: "Montenegro", code: "ME", dial_code: "+382" },
  { name: "Montserrat", code: "MS", dial_code: "+1664" },
  { name: "Myanmar", code: "MM", dial_code: "+95" },
  { name: "Namíbia", code: "NA", dial_code: "+264" },
  { name: "Nauru", code: "NR", dial_code: "+674" },
  { name: "Nepal", code: "NP", dial_code: "+977" },
  { name: "Nicarágua", code: "NI", dial_code: "+505" },
  { name: "Níger", code: "NE", dial_code: "+227" },
  { name: "Nigéria", code: "NG", dial_code: "+234" },
  { name: "Niue", code: "NU", dial_code: "+683" },
  { name: "Noruega", code: "NO", dial_code: "+47" },
  { name: "Nova Caledônia", code: "NC", dial_code: "+687" },
  { name: "Nova Zelândia", code: "NZ", dial_code: "+64" },
  { name: "Omã", code: "OM", dial_code: "+968" },
  { name: "Países Baixos", code: "NL", dial_code: "+31" },
  { name: "Palau", code: "PW", dial_code: "+680" },
  { name: "Palestina", code: "PS", dial_code: "+970" },
  { name: "Panamá", code: "PA", dial_code: "+507" },
  { name: "Papua-Nova Guiné", code: "PG", dial_code: "+675" },
  { name: "Paquistão", code: "PK", dial_code: "+92" },
  { name: "Paraguai", code: "PY", dial_code: "+595" },
  { name: "Peru", code: "PE", dial_code: "+51" },
  { name: "Polinésia Francesa", code: "PF", dial_code: "+689" },
  { name: "Polônia", code: "PL", dial_code: "+48" },
  { name: "Porto Rico", code: "PR", dial_code: "+1" },
  { name: "Portugal", code: "PT", dial_code: "+351" },
  { name: "Quênia", code: "KE", dial_code: "+254" },
  { name: "Quirguistão", code: "KG", dial_code: "+996" },
  { name: "Reino Unido", code: "GB", dial_code: "+44" },
  { name: "República Centro-Africana", code: "CF", dial_code: "+236" },
  { name: "República Checa", code: "CZ", dial_code: "+420" },
  { name: "República Dominicana", code: "DO", dial_code: "+1" },
  { name: "Reunião", code: "RE", dial_code: "+262" },
  { name: "Romênia", code: "RO", dial_code: "+40" },
  { name: "Ruanda", code: "RW", dial_code: "+250" },
  { name: "Rússia", code: "RU", dial_code: "+7" },
  { name: "Saara Ocidental", code: "EH", dial_code: "+212" },
  { name: "Samoa", code: "WS", dial_code: "+685" },
  { name: "Samoa Americana", code: "AS", dial_code: "+1684" },
  { name: "Santa Lúcia", code: "LC", dial_code: "+1758" },
  { name: "São Cristóvão e Névis", code: "KN", dial_code: "+1869" },
  { name: "São Marinho", code: "SM", dial_code: "+378" },
  { name: "São Tomé e Príncipe", code: "ST", dial_code: "+239" },
  { name: "São Vicente e Granadinas", code: "VC", dial_code: "+1784" },
  { name: "Senegal", code: "SN", dial_code: "+221" },
  { name: "Serra Leoa", code: "SL", dial_code: "+232" },
  { name: "Sérvia", code: "RS", dial_code: "+381" },
  { name: "Seychelles", code: "SC", dial_code: "+248" },
  { name: "Singapura", code: "SG", dial_code: "+65" },
  { name: "Síria", code: "SY", dial_code: "+963" },
  { name: "Somália", code: "SO", dial_code: "+252" },
  { name: "Sri Lanka", code: "LK", dial_code: "+94" },
  { name: "Suazilândia", code: "SZ", dial_code: "+268" },
  { name: "Sudão", code: "SD", dial_code: "+249" },
  { name: "Sudão do Sul", code: "SS", dial_code: "+211" },
  { name: "Suécia", code: "SE", dial_code: "+46" },
  { name: "Suíça", code: "CH", dial_code: "+41" },
  { name: "Suriname", code: "SR", dial_code: "+597" },
  { name: "Tajiquistão", code: "TJ", dial_code: "+992" },
  { name: "Tailândia", code: "TH", dial_code: "+66" },
  { name: "Taiwan", code: "TW", dial_code: "+886" },
  { name: "Tanzânia", code: "TZ", dial_code: "+255" },
  {
    name: "Território Britânico do Oceano Índico",
    code: "IO",
    dial_code: "+246",
  },
  { name: "Timor-Leste", code: "TL", dial_code: "+670" },
  { name: "Togo", code: "TG", dial_code: "+228" },
  { name: "Tokelau", code: "TK", dial_code: "+690" },
  { name: "Tonga", code: "TO", dial_code: "+676" },
  { name: "Trinidad e Tobago", code: "TT", dial_code: "+1868" },
  { name: "Tunísia", code: "TN", dial_code: "+216" },
  { name: "Turcomenistão", code: "TM", dial_code: "+993" },
  { name: "Turquia", code: "TR", dial_code: "+90" },
  { name: "Tuvalu", code: "TV", dial_code: "+688" },
  { name: "Ucrânia", code: "UA", dial_code: "+380" },
  { name: "Uganda", code: "UG", dial_code: "+256" },
  { name: "Uruguai", code: "UY", dial_code: "+598" },
  { name: "Uzbequistão", code: "UZ", dial_code: "+998" },
  { name: "Vanuatu", code: "VU", dial_code: "+678" },
  { name: "Vaticano", code: "VA", dial_code: "+39" },
  { name: "Venezuela", code: "VE", dial_code: "+58" },
  { name: "Vietnã", code: "VN", dial_code: "+84" },
  { name: "Wallis e Futuna", code: "WF", dial_code: "+681" },
  { name: "Zâmbia", code: "ZM", dial_code: "+260" },
  { name: "Zimbábue", code: "ZW", dial_code: "+263" },
];

// Sistema aprimorado de padrões de formatação para números de telefone
const phonePatterns = {
  // Brasil
  BR: { 
    lengths: [10, 11], 
    formats: [
      { length: 10, format: (n: string) => `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}` }, // Fixo
      { length: 11, format: (n: string) => `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}` } // Celular
    ],
    validate: (number: string) => {
      // Lista de DDDs válidos do Brasil
      const validDDDs = [
        "11", "12", "13", "14", "15", "16", "17", "18", "19",
        "21", "22", "24", "27", "28",
        "31", "32", "33", "34", "35", "37", "38",
        "41", "42", "43", "44", "45", "46", "47", "48", "49",
        "51", "53", "54", "55",
        "61", "62", "63", "64", "65", "66", "67", "68", "69",
        "71", "73", "74", "75", "77", "79",
        "81", "82", "83", "84", "85", "86", "87", "88", "89",
        "91", "92", "93", "94", "95", "96", "97", "98", "99"
      ];
      
      if (number.length >= 2) {
        const possibleDDD = number.substring(0, 2);
        return validDDDs.includes(possibleDDD);
      }
      return false;
    }
  },
  // Estados Unidos e Canadá
  US: { 
    lengths: [10], 
    formats: [
      { length: 10, format: (n: string) => `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}` }
    ]
  },
  CA: { 
    lengths: [10], 
    formats: [
      { length: 10, format: (n: string) => `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}` }
    ]
  },
  // Reino Unido
  GB: { 
    lengths: [10, 11], 
    formats: [
      { length: 10, format: (n: string) => `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` },
      { length: 11, format: (n: string) => `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}` }
    ]
  },
  // Alemanha
  DE: {
    lengths: [10, 11],
    formats: [
      { length: 10, format: (n: string) => `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` },
      { length: 11, format: (n: string) => `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}` }
    ]
  },
  // França
  FR: {
    lengths: [9],
    formats: [
      { length: 9, format: (n: string) => `${n.slice(0, 1)} ${n.slice(1, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7)}` }
    ]
  },
  // Espanha
  ES: {
    lengths: [9],
    formats: [
      { length: 9, format: (n: string) => `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` }
    ]
  },
  // Portugal
  PT: {
    lengths: [9],
    formats: [
      { length: 9, format: (n: string) => `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` }
    ]
  },
  // Itália
  IT: {
    lengths: [9, 10],
    formats: [
      { length: 9, format: (n: string) => `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` },
      { length: 10, format: (n: string) => `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` }
    ]
  },
  // Japão
  JP: {
    lengths: [10, 11],
    formats: [
      { length: 10, format: (n: string) => `${n.slice(0, 2)}-${n.slice(2, 6)}-${n.slice(6)}` },
      { length: 11, format: (n: string) => `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}` }
    ]
  },
  // China
  CN: {
    lengths: [11],
    formats: [
      { length: 11, format: (n: string) => `${n.slice(0, 3)} ${n.slice(3, 7)} ${n.slice(7)}` }
    ]
  },
  // Austrália
  AU: {
    lengths: [9, 10],
    formats: [
      { length: 9, format: (n: string) => `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` },
      { length: 10, format: (n: string) => `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}` }
    ]
  },
  // Índia
  IN: {
    lengths: [10],
    formats: [
      { length: 10, format: (n: string) => `${n.slice(0, 5)} ${n.slice(5)}` }
    ]
  },
  // Rússia
  RU: {
    lengths: [10],
    formats: [
      { length: 10, format: (n: string) => `${n.slice(0, 3)} ${n.slice(3, 6)}-${n.slice(6, 8)}-${n.slice(8)}` }
    ]
  },
  // México
  MX: {
    lengths: [10],
    formats: [
      { length: 10, format: (n: string) => `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` }
    ]
  },
  // Argentina
  AR: {
    lengths: [10],
    formats: [
      { length: 10, format: (n: string) => `${n.slice(0, 3)} ${n.slice(3, 6)}-${n.slice(6)}` }
    ]
  },
  // Chile
  CL: {
    lengths: [9],
    formats: [
      { length: 9, format: (n: string) => `${n.slice(0, 1)} ${n.slice(1, 5)} ${n.slice(5)}` }
    ]
  },
  // Colômbia
  CO: {
    lengths: [10],
    formats: [
      { length: 10, format: (n: string) => `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` }
    ]
  }
};

// Padrão de formatação global para países sem definição específica
const globalPattern = {
  format: (n: string) => {
    if (n.length <= 3) return n;
    if (n.length <= 6) return `${n.slice(0, 3)} ${n.slice(3)}`;
    if (n.length <= 9) return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
    return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 9)} ${n.slice(9)}`;
  }
};

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  ddi?: string; // Adicionar esta nova prop
  onChangeWithCode?: (dialCode: string, phoneNumber: string, countryCode: string) => void;
  name: string;
  placeholder?: string;
  className?: string;
  label?: string;
  defaultCountry?: string; // Novo: país padrão (código ISO)
  debug?: boolean; // Nova prop para habilitar logs de debug
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  ddi,
  onChangeWithCode,
  name,
  placeholder = "Digite o número de telefone",
  className = "",
  label = "Contato Telefônico",
  defaultCountry = "BR", // Brasil como padrão
  debug = false
}) => {
  // Habilitar logs para debug se solicitado
  phoneLogger.enable = debug;

  // Refs para controlar o ciclo de renderização
  const isInternalChangeRef = useRef(false);
  const previousValueRef = useRef(value);
  const initialLoadRef = useRef(true);
  const userSelectedCountryRef = useRef(false); // Nova ref para controlar se o usuário já selecionou um país

  // Estado interno
  const [internalPhoneNumber, setInternalPhoneNumber] = useState("");

  // Estado para o país selecionado
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | null>(null);

  // UI states
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Refs para elementos do DOM
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef({ x: 0, y: 0 });

  // Calcular o total de caracteres atual (DDI + número nacional)
  const calculateTotalChars = () => {
    if (!selectedCountry) return 0;
    const dialDigits = selectedCountry.dial_code.replace(/[+\s]/g, '');
    return dialDigits.length + internalPhoneNumber.length;
  };

  const totalChars = calculateTotalChars();
  const isExceeding = totalChars > 15;

  // Função melhorada para detectar o país a partir do código de discagem
  const detectCountryFromNumber = (phoneNumber: string) => {
    if (!phoneNumber) return null;

    phoneLogger.log("DETECTING COUNTRY FROM", phoneNumber);

    // 1. Se o número começa com +, é explicitamente um DDI
    if (phoneNumber.startsWith("+")) {
      const cleanedPhone = phoneNumber.replace(/\s+/g, " ").trim();
      const dialCodePart = cleanedPhone.includes(" ")
        ? cleanedPhone.split(" ")[0]
        : cleanedPhone;

      phoneLogger.log("EXPLICIT DDI", dialCodePart);

      // Buscar correspondência exata
      const country = countryCodes.find((c) => c.dial_code === dialCodePart);
      if (country) {
        phoneLogger.log("COUNTRY FOUND EXACT", country.name);
        return country;
      }

      // Buscar por prefixo DDI
      const sortedCountryCodes = [...countryCodes].sort((a, b) => 
        b.dial_code.length - a.dial_code.length
      );
      
      for (const c of sortedCountryCodes) {
        if (dialCodePart.startsWith(c.dial_code)) {
          phoneLogger.log("COUNTRY FOUND BY PREFIX", c.name);
          return c;
        }
      }
    }
    
    // 2. Se temos um DDI explícito na prop, usar isso
    if (ddi) {
      const country = countryCodes.find((c) => c.dial_code === `+${ddi}`);
      if (country) {
        phoneLogger.log("COUNTRY FOUND VIA PROP DDI", country.name);
        return country;
      }
    }
    
    // 3. Se o usuário já selecionou explicitamente um país antes, manter esse país
    if (userSelectedCountryRef.current && selectedCountry) {
      phoneLogger.log("KEEPING USER SELECTED COUNTRY", selectedCountry.name);
      return selectedCountry;
    }

    // 4. Verificar se o número segue o padrão do país padrão (Brasil)
    const defaultCountryObj = countryCodes.find(c => c.code === defaultCountry);
    const numericPhone = phoneNumber.replace(/\D/g, '');
    
    if (defaultCountryObj && defaultCountry === "BR") {
      // Verificar se parece ser um número brasileiro (tem 10 ou 11 dígitos e começa com DDD válido)
      if ((numericPhone.length === 10 || numericPhone.length === 11) && 
           phonePatterns.BR.validate(numericPhone)) {
        phoneLogger.log("NUMBER RECOGNIZED AS BRAZILIAN BY PATTERN", numericPhone);
        return defaultCountryObj;
      }
    }

    // Se nenhum país foi identificado, usar o padrão
    phoneLogger.log("USING DEFAULT COUNTRY", defaultCountryObj?.name || "Brasil");
    return defaultCountryObj || countryCodes.find(c => c.code === "BR") || countryCodes[0];
  };

  // Normalizar texto (remover acentos e converter para minúsculas)
  const normalizeText = (text: string): string => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  // Inicialização - deve acontecer uma única vez no carregamento
  useEffect(() => {
    if (initialLoadRef.current) {
      phoneLogger.log("INITIALIZING COMPONENT", { value, ddi, defaultCountry });
      initialLoadRef.current = false;

      // Determinar o país inicial
      let initialCountry: CountryCode | null = null;
      
      // 1. Tentar detectar do valor fornecido
      if (value) {
        initialCountry = detectCountryFromNumber(value);
        phoneLogger.log("COUNTRY DETECTED FROM INITIAL VALUE", initialCountry?.name);
      }
      
      // 2. Se não detectou, usar o DDI da prop
      if (!initialCountry && ddi) {
        const found = countryCodes.find((c) => c.dial_code === `+${ddi}`);
        initialCountry = found || null;
        phoneLogger.log("COUNTRY DETECTED FROM DDI PROP", initialCountry?.name);
      }
      
      // 3. Se ainda não tem país, usar o defaultCountry
      if (!initialCountry) {
        initialCountry = countryCodes.find((c) => c.code === defaultCountry) || 
                         countryCodes.find((c) => c.code === "BR") || 
                         countryCodes[0];
        phoneLogger.log("USING DEFAULT COUNTRY", initialCountry.name);
      }
      
      setSelectedCountry(initialCountry);
      
      // Extrair o número nacional se tiver valor inicial
      if (value && initialCountry) {
        const dialCodeClean = initialCountry.dial_code.replace(/\D/g, '');
        
        // Se começa com + ou com o DDI, extrair a parte nacional
        if (value.startsWith('+') && value.includes(' ')) {
          // Formato +XX XXXXX
          const parts = value.split(' ');
          if (parts.length > 1) {
            const phoneNumber = parts.slice(1).join(' ');
            setInternalPhoneNumber(phoneNumber.replace(/\D/g, ''));
            phoneLogger.log("EXTRACTED NUMBER FROM +XX FORMAT", phoneNumber);
          }
        } else if (value.replace(/\D/g, '').startsWith(dialCodeClean)) {
          // Formato sem +, mas começa com DDI (ex: 5591981901220)
          const numericPhone = value.replace(/\D/g, '');
          const nationalPart = numericPhone.substring(dialCodeClean.length);
          setInternalPhoneNumber(nationalPart);
          phoneLogger.log("EXTRACTED NUMBER FROM NUMERIC FORMAT", nationalPart);
        } else {
          // Assumir que é apenas o número nacional
          setInternalPhoneNumber(value.replace(/\D/g, ''));
          phoneLogger.log("ASSUMING NATIONAL NUMBER", value);
        }
      }
    }
  }, [value, ddi, defaultCountry]);

  // Efeito para processar mudanças externas no valor
  useEffect(() => {
    // Pular se a inicialização já foi feita ou se a mudança foi interna
    if (!initialLoadRef.current && isInternalChangeRef.current) {
      phoneLogger.log("SKIPPING EXTERNAL CHANGE (INTERNAL CHANGE)", value);
      return;
    }

    // Se o valor vindo de fora mudou, processar
    if (value !== previousValueRef.current) {
      previousValueRef.current = value;

      if (value) {
        phoneLogger.log("PROCESSING EXTERNAL VALUE", value);

        // Detectar país, mas preservar seleção do usuário
        if (!userSelectedCountryRef.current) {
          const detectedCountry = detectCountryFromNumber(value);
          if (detectedCountry) {
            phoneLogger.log("COUNTRY DETECTED FROM UPDATE", detectedCountry.name);
            setSelectedCountry(detectedCountry);
          }
        }

        // Extrair o número nacional
        if (selectedCountry) {
          const dialCodeClean = selectedCountry.dial_code.replace(/\D/g, '');
          
          if (value.startsWith('+') && value.includes(' ')) {
            // Formato +XX XXXXX
            const parts = value.split(' ');
            if (parts.length > 1) {
              const phoneNumber = parts.slice(1).join(' ');
              setInternalPhoneNumber(phoneNumber.replace(/\D/g, ''));
              phoneLogger.log("EXTRACTED NUMBER FROM UPDATE +XX FORMAT", phoneNumber);
            }
          } else if (value.replace(/\D/g, '').startsWith(dialCodeClean)) {
            // Formato sem +, mas começa com DDI
            const numericPhone = value.replace(/\D/g, '');
            const nationalPart = numericPhone.substring(dialCodeClean.length);
            setInternalPhoneNumber(nationalPart);
            phoneLogger.log("EXTRACTED NUMBER FROM UPDATE NUMERIC FORMAT", nationalPart);
          } else {
            // Assumir que é apenas o número nacional
            setInternalPhoneNumber(value.replace(/\D/g, ''));
            phoneLogger.log("ASSUMING UPDATE NATIONAL NUMBER", value);
          }
        }
      } else {
        phoneLogger.log("EMPTY VALUE, CLEARING INTERNAL NUMBER", "");
        setInternalPhoneNumber("");
      }
    }
  }, [value, selectedCountry]);

  // IMPLEMENTAÇÃO MELHORADA: Função que formata e notifica o componente pai de mudanças
  // Garante que o número total (DDI + número) não ultrapasse 15 caracteres
  const notifyParentOfChange = (country: CountryCode, phone: string) => {
    if (!country) {
      console.error("País inválido");
      return;
    }
    
    // Garantir que só temos dígitos numéricos no telefone nacional
    const cleanPhone = phone.replace(/\D/g, "");
    
    // Remover o + para obter apenas os dígitos do DDI
    const dialDigits = country.dial_code.replace(/[+\s]/g, '');
    
    // IMPORTANTE: Limitar para máximo de 15 caracteres no total (DDI + número)
    const maxNationalDigits = 15 - dialDigits.length;
    
    // Limitar o número nacional ao máximo permitido
    const limitedPhone = cleanPhone.slice(0, maxNationalDigits);
    
    // IMPORTANTE: Garantir que o formato +XX YYYYY seja preservado
    // Este é o formato que deve ser salvo no banco de dados
    const fullNumber = limitedPhone ? `+${dialDigits} ${limitedPhone}` : "";
    
    phoneLogger.log("NOTIFYING PARENT", {
      countryName: country.name,
      dialCode: dialDigits,
      nationalNumber: limitedPhone,
      fullNumber: fullNumber,
      totalLength: (dialDigits.length + limitedPhone.length)
    });
    
    // Verificar e logging do limite de 15 caracteres
    if (dialDigits.length + limitedPhone.length > 15) {
      console.warn(`Número excede 15 caracteres. DDI: ${dialDigits.length}, Número: ${limitedPhone.length}, Total: ${dialDigits.length + limitedPhone.length}`);
    }
    
    // Marcar que esta mudança é interna para evitar loops
    isInternalChangeRef.current = true;
    previousValueRef.current = fullNumber;
    
    // Notificar o pai com o número completo (incluindo DDI)
    onChange(fullNumber);
    
    // Enviar também informações separadas se necessário
    if (onChangeWithCode && limitedPhone.trim()) {
      onChangeWithCode(dialDigits, limitedPhone.trim(), country.code);
      phoneLogger.log("NOTIFYING PARENT WITH CODE DETAILS", {
        dialCode: dialDigits,
        phoneNumber: limitedPhone.trim(),
        countryCode: country.code
      });
    }
    
    // Resetar a flag após um curto período
    setTimeout(() => {
      isInternalChangeRef.current = false;
    }, 50);
  };

  // Handler para mudanças no input do telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Obter valor digitado e remover formatação
    let newPhone = e.target.value.replace(/\D/g, "");
    
    // Verificar se o total de caracteres (DDI + número) excederia o limite
    if (selectedCountry) {
      const dialDigits = selectedCountry.dial_code.replace(/[+\s]/g, '');
      const maxNationalDigits = 15 - dialDigits.length;
      
      // Se o novo valor exceder o limite, truncar
      if (newPhone.length > maxNationalDigits) {
        newPhone = newPhone.substring(0, maxNationalDigits);
      }
    }
    
    phoneLogger.log("PHONE INPUT CHANGED", {
      raw: e.target.value,
      cleaned: newPhone
    });
    
    // Atualizar o valor interno
    setInternalPhoneNumber(newPhone);

    // Notificar o pai apenas se houver um valor significativo
    if (selectedCountry && newPhone.trim()) {
      notifyParentOfChange(selectedCountry, newPhone);
    } else if (!newPhone.trim()) {
      // Se o campo estiver vazio, notificar com string vazia
      onChange("");
      isInternalChangeRef.current = true;
      previousValueRef.current = "";
      setTimeout(() => {
        isInternalChangeRef.current = false;
      }, 50);
    }
  };

  // PONTO CRÍTICO: Handler para seleção de país
  // Este handler garante que o país selecionado pelo usuário seja mantido
  const handleCountrySelect = (
    country: CountryCode,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    phoneLogger.log("COUNTRY SELECTED BY USER", {
      name: country.name,
      dialCode: country.dial_code
    });

    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchQuery("");
    
    // IMPORTANTE: Marcar que o usuário selecionou explicitamente um país
    // Isso impede que o país seja alterado automaticamente depois
    userSelectedCountryRef.current = true;

    // Notificar o pai imediatamente com o novo código de país
    if (internalPhoneNumber.trim()) {
      notifyParentOfChange(country, internalPhoneNumber);
    }

    // Restaurar posição de scroll
    setTimeout(() => {
      window.scrollTo(scrollPositionRef.current.x, scrollPositionRef.current.y);
    }, 10);
  };

  // Toggle do dropdown
  const toggleDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Salvar posição atual de scroll
    scrollPositionRef.current = {
      x: window.scrollX,
      y: window.scrollY,
    };

    setIsDropdownOpen(!isDropdownOpen);
  };

  // Manipulador para fechar o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Atualiza a posição do dropdown quando aberto
  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [isDropdownOpen]);

  // Restaurar a posição de scroll ao abrir o dropdown
  useEffect(() => {
    if (isDropdownOpen) {
      const timeoutId = setTimeout(() => {
        window.scrollTo(
          scrollPositionRef.current.x,
          scrollPositionRef.current.y
        );
      }, 10);

      return () => clearTimeout(timeoutId);
    }
  }, [isDropdownOpen]);

  // PONTO CRÍTICO: Atualizar o país quando a prop DDI mudar
  useEffect(() => {
    if (ddi && !isInternalChangeRef.current) {
      phoneLogger.log("DDI CHANGED EXTERNALLY", ddi);
      const dialCode = `+${ddi}`;
      const country = countryCodes.find((c) => c.dial_code === dialCode);

      if (
        country &&
        (!selectedCountry || country.dial_code !== selectedCountry.dial_code)
      ) {
        phoneLogger.log("UPDATING COUNTRY FROM NEW DDI", country.name);
        setSelectedCountry(country);
        
        // Reset da flag de seleção do usuário
        userSelectedCountryRef.current = false;

        // Notificar com o novo país
        if (internalPhoneNumber) {
          notifyParentOfChange(country, internalPhoneNumber);
        }
      }
    }
  }, [ddi]);

  // Função para obter URL da bandeira
  const getFlagUrl = (countryCode: string) => {
    return `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
  };

  // Filtra países baseado na busca
  const filteredCountries = searchQuery
    ? countryCodes.filter((country) => {
        const normalizedQuery = normalizeText(searchQuery);
        const normalizedName = normalizeText(country.name);
        return (
          normalizedName.includes(normalizedQuery) ||
          country.dial_code.includes(searchQuery)
        );
      })
    : countryCodes;

  // Handler para evitar reset de scroll no input de busca
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    e.stopPropagation();
  };

  // Handler para evitar scroll no clique do input de busca
  const handleSearchInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  // Renderiza o dropdown em um portal fora da hierarquia DOM
  const renderDropdown = () => {
    if (!isDropdownOpen) return null;

    return createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: "absolute",
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          zIndex: 9999,
          width: "290px",
          backgroundColor: "white",
          borderRadius: "0.5rem",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div className="p-2 border-b border-gray-100">
          <input
            type="text"
            placeholder="Buscar país ou código"
            className="w-full p-2 text-sm border border-gray-200 rounded-md"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onClick={handleSearchInputClick}
          />
        </div>
        <div
          className="max-h-60 overflow-y-auto py-1"
          style={{
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {filteredCountries.map((country) => (
            <button
              key={country.code}
              type="button"
              className="flex items-center w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-100 focus:outline-none transition-colors"
              onClick={(e) => handleCountrySelect(country, e)}
            >
              <img
                src={getFlagUrl(country.code)}
                alt={`Bandeira ${country.name}`}
                className="w-5 h-auto mr-3"
                style={{ border: "1px solid #eaeaea", borderRadius: "2px" }}
              />
              <span className="font-medium text-sm w-12">{country.code}</span>
              <span className="text-sm text-gray-700 font-semibold w-16">
                {country.dial_code}
              </span>
              <span className="text-sm">{country.name}</span>
            </button>
          ))}
          {filteredCountries.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Nenhum país encontrado
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };

  // FUNÇÃO MELHORADA: Formatação visual do número baseada no país
  const formatVisualPhoneNumber = (number: string, countryCode: string) => {
    // Se não tiver número ou país, retornar como está
    if (!number || !countryCode) return number;
    
    // Verificar se temos formatação específica para este país
    if (countryCode in phonePatterns) {
      const pattern = phonePatterns[countryCode as keyof typeof phonePatterns];
      
      // Encontrar o formato apropriado para o tamanho do número
      const format = pattern.formats.find(f => f.length === number.length);
      if (format) {
        return format.format(number);
      }
    }
    
    // Formatação global para países sem definição específica
    return globalPattern.format(number);
  };

  // Versão visual formatada do número para exibição
  const displayNumber = selectedCountry 
    ? formatVisualPhoneNumber(internalPhoneNumber, selectedCountry.code) 
    : internalPhoneNumber;

  // Log de saída para valores de estado atual (útil para debug)
  useEffect(() => {
    if (debug) {
      phoneLogger.log("CURRENT STATE", {
        selectedCountry: selectedCountry?.name,
        dialCode: selectedCountry?.dial_code,
        internalPhoneNumber,
        displayNumber,
        formattedForExport: selectedCountry ? `+${selectedCountry.dial_code.replace(/[+\s]/g, '')} ${internalPhoneNumber}` : "",
        totalCharacters: totalChars,
        exceeding15Limit: isExceeding
      });
    }
  }, [selectedCountry, internalPhoneNumber, displayNumber, debug, totalChars, isExceeding]);

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 font-medium text-gray-700">{label}</label>
      )}
      <div className="flex">
        {/* Seletor de código de país */}
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleDropdown}
          className="flex items-center h-full px-4 py-3 bg-gray-50 border border-gray-200 border-r-0 rounded-l-lg hover:bg-gray-100 transition-colors"
          aria-label="Selecionar código de país"
        >
          {selectedCountry && (
            <>
              <img
                src={getFlagUrl(selectedCountry.code)}
                alt={`Bandeira ${selectedCountry.name}`}
                className="w-5 h-auto mr-2"
                style={{ border: "1px solid #eaeaea", borderRadius: "2px" }}
              />
              <span className="font-medium text-sm">
                {selectedCountry.dial_code}
              </span>
            </>
          )}
          <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
        </button>

        {/* Input para o número de telefone - sem borda vermelha para excedido */}
        <input
          type="tel"
          inputMode="numeric"
          name={name}
          value={displayNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          className={`flex-1 p-3 border border-gray-200 rounded-r-lg text-sm ${className}`}
          aria-label="Número de telefone (sem DDI)"
        />

        {/* Renderiza o dropdown usando portal */}
        {renderDropdown()}
      </div>
      
      {/* Somente exibir informações de debug quando solicitado */}
      {debug && selectedCountry && internalPhoneNumber && (
        <div className="mt-1 text-xs text-gray-600">
          Formato salvo: +{selectedCountry.dial_code.replace(/[+\s]/g, '')} {internalPhoneNumber}
          <br/>
          Caracteres: {totalChars}/15
        </div>
      )}
    </div>
  );
};

export default PhoneInput;