export interface TipoEstabelecimentoConfig {
  sigla: string;
  cor: string;
  textColor: string;
}

const PALETTE = [
  '#1d4ed8', '#15803d', '#b45309', '#7c3aed',
  '#be185d', '#0e7490', '#b91c1c', '#0f766e',
  '#6d28d9', '#c2410c', '#0369a1', '#4d7c0f',
];

const TIPOS_CONHECIDOS: Array<{ pattern: RegExp; sigla: string; cor: string }> = [
  { pattern: /hospital/i,                        sigla: 'HOSP', cor: '#1d4ed8' },
  { pattern: /ubs|unidade.b[aá]sica/i,           sigla: 'UBS',  cor: '#15803d' },
  { pattern: /upa|pronto.atend/i,                sigla: 'UPA',  cor: '#c2410c' },
  { pattern: /policl[ií]nica/i,                  sigla: 'POL',  cor: '#0e7490' },
  { pattern: /caps|psicossocial/i,               sigla: 'CAPS', cor: '#6d28d9' },
  { pattern: /laborat[oó]rio/i,                  sigla: 'LAB',  cor: '#b45309' },
  { pattern: /farm[aá]cia/i,                     sigla: 'FAR',  cor: '#047857' },
  { pattern: /pronto.socorro/i,                  sigla: 'PS',   cor: '#b91c1c' },
  { pattern: /cl[ií]nica/i,                      sigla: 'CLIN', cor: '#be185d' },
  { pattern: /centro.de.sa[uú]de/i,              sigla: 'CS',   cor: '#0f766e' },
  { pattern: /centro.de.refer[eê]ncia/i,         sigla: 'CR',   cor: '#4338ca' },
  { pattern: /ambulat[oó]rio/i,                  sigla: 'AMB',  cor: '#7c3aed' },
  { pattern: /cop.?30|cop30/i,                   sigla: 'COP',  cor: '#059669' },
  { pattern: /unidade.de.sa[uú]de/i,             sigla: 'US',   cor: '#2563eb' },
  { pattern: /posto.de.sa[uú]de|posto.de.aten/i, sigla: 'POS',  cor: '#16a34a' },
  { pattern: /usina.da.paz/i,                    sigla: 'UP',   cor: '#0891b2' },
  { pattern: /sa[uú]de.da.fam[ií]lia|esf/i,     sigla: 'ESF',  cor: '#166534' },
  { pattern: /central.de.reg/i,                  sigla: 'REG',  cor: '#9333ea' },
  { pattern: /servi[cç]o.de.atend/i,             sigla: 'SAMU', cor: '#dc2626' },
];

const STOP_WORDS = new Set([
  'de', 'do', 'da', 'dos', 'das', 'e', 'em', 'para', 'com', 'a', 'o', 'as', 'os',
  'no', 'na', 'nos', 'nas', 'um', 'uma',
]);

const gerarSigla = (nome: string): string => {
  const letras = nome
    .split(/[\s\-\/()]+/)
    .filter(p => p.length > 1 && !STOP_WORDS.has(p.toLowerCase()))
    .map(p => p[0].toUpperCase());

  if (letras.length === 0) return nome.slice(0, 3).toUpperCase();
  return letras.slice(0, 4).join('');
};

const hashString = (str: string): number => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) % PALETTE.length;
  }
  return Math.abs(h);
};

export const getTipoEstabelecimentoConfig = (tipo: string | undefined): TipoEstabelecimentoConfig => {
  const nome = (tipo || '').trim();
  if (!nome || nome === 'Não informado') {
    return { sigla: '?', cor: '#6b7280', textColor: '#FFFFFF' };
  }

  for (const { pattern, sigla, cor } of TIPOS_CONHECIDOS) {
    if (pattern.test(nome)) {
      return { sigla, cor, textColor: '#FFFFFF' };
    }
  }

  return {
    sigla: gerarSigla(nome),
    cor: PALETTE[hashString(nome)],
    textColor: '#FFFFFF',
  };
};

/** Extrai os tipos únicos presentes nos lugares e retorna com config. */
export const getTiposUnicos = (
  places: Array<{ tipoEstabelecimento?: string }>,
): Array<{ tipo: string } & TipoEstabelecimentoConfig> => {
  const vistos = new Map<string, TipoEstabelecimentoConfig>();

  for (const p of places) {
    const tipo = (p.tipoEstabelecimento || '').trim() || 'Não informado';
    if (!vistos.has(tipo)) {
      vistos.set(tipo, getTipoEstabelecimentoConfig(p.tipoEstabelecimento));
    }
  }

  return Array.from(vistos.entries())
    .map(([tipo, config]) => ({ tipo, ...config }))
    .sort((a, b) => a.tipo.localeCompare(b.tipo, 'pt-BR'));
};
