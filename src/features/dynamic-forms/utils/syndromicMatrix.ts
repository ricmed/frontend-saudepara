export type SyndromicCategory =
  | 'principal'
  | 'comum'
  | 'especifico'
  | 'alarme'
  | 'grave'
  | 'inespecifico'
  | 'possivel';

export interface SyndromicSymptom {
  id: string;
  label: string;
  pesoClinico: number;
  pesoRanqueamento: number;
  categoria: SyndromicCategory;
}

export interface SyndromicAgravo {
  id: string;
  label: string;
  cid10: string[];
  permitirAssintomatico?: boolean;
  sintomas: SyndromicSymptom[];
}

export interface RankedAgravo {
  agravoId: string;
  agravoLabel: string;
  cid10: string[];
  score: number;
  matchedSymptoms: string[];
  missingKeySymptoms: string[];
}

const CATEGORIA_RANK: Record<SyndromicCategory, number> = {
  grave: 7,
  alarme: 6,
  principal: 5,
  especifico: 4,
  comum: 3,
  inespecifico: 2,
  possivel: 1,
};

const RELEVANT_CATEGORIES = new Set<SyndromicCategory>(['principal', 'especifico', 'alarme', 'grave']);

export const SINTOMA_OUTRO_ID = '__outro_especifique__';
export const SINTOMA_ASSINTOMATICO_ID = 'assintomatico';

const AGRAVOS_MATRIX: SyndromicAgravo[] = [
  {
    id: 'dengue_casos',
    label: 'Dengue - casos',
    cid10: ['A90', 'A91'],
    sintomas: [
      { id: 'febre', label: 'Febre', pesoClinico: 5, pesoRanqueamento: 2, categoria: 'principal' },
      { id: 'mialgia', label: 'Mialgia', pesoClinico: 4, pesoRanqueamento: 3, categoria: 'comum' },
      { id: 'artralgia', label: 'Artralgia', pesoClinico: 3, pesoRanqueamento: 2, categoria: 'comum' },
      { id: 'dor_retro_orbital', label: 'Dor retro-orbital', pesoClinico: 4, pesoRanqueamento: 4, categoria: 'especifico' },
      { id: 'cefaleia', label: 'Cefaleia', pesoClinico: 4, pesoRanqueamento: 2, categoria: 'comum' },
      { id: 'exantema', label: 'Exantema', pesoClinico: 3, pesoRanqueamento: 2, categoria: 'comum' },
      { id: 'nausea', label: 'Nausea', pesoClinico: 3, pesoRanqueamento: 1, categoria: 'comum' },
      { id: 'vomito', label: 'Vomito', pesoClinico: 3, pesoRanqueamento: 1, categoria: 'comum' },
      { id: 'dor_abdominal', label: 'Dor abdominal', pesoClinico: 5, pesoRanqueamento: 5, categoria: 'alarme' },
      { id: 'hemorragia_gengival', label: 'Hemorragia gengival', pesoClinico: 5, pesoRanqueamento: 5, categoria: 'alarme' },
      { id: 'choque', label: 'Choque', pesoClinico: 5, pesoRanqueamento: 8, categoria: 'grave' },
    ],
  },
  {
    id: 'chikungunya',
    label: 'Febre de Chikungunya',
    cid10: ['A92.0'],
    sintomas: [
      { id: 'febre', label: 'Febre', pesoClinico: 5, pesoRanqueamento: 2, categoria: 'principal' },
      { id: 'artralgia', label: 'Artralgia', pesoClinico: 5, pesoRanqueamento: 7, categoria: 'principal' },
      { id: 'artrite', label: 'Artrite', pesoClinico: 5, pesoRanqueamento: 7, categoria: 'especifico' },
      { id: 'mialgia', label: 'Mialgia', pesoClinico: 4, pesoRanqueamento: 3, categoria: 'comum' },
      { id: 'cefaleia', label: 'Cefaleia', pesoClinico: 3, pesoRanqueamento: 2, categoria: 'comum' },
      { id: 'exantema', label: 'Exantema', pesoClinico: 3, pesoRanqueamento: 2, categoria: 'comum' },
      { id: 'edema', label: 'Edema', pesoClinico: 4, pesoRanqueamento: 4, categoria: 'especifico' },
      { id: 'meningoencefalite', label: 'Meningoencefalite', pesoClinico: 5, pesoRanqueamento: 7, categoria: 'grave' },
    ],
  },
  {
    id: 'zika',
    label: 'Doenca aguda pelo virus Zika',
    cid10: ['A92.8'],
    permitirAssintomatico: true,
    sintomas: [
      { id: 'assintomatico', label: 'Assintomatico', pesoClinico: 3, pesoRanqueamento: 1, categoria: 'possivel' },
      { id: 'febre', label: 'Febre', pesoClinico: 2, pesoRanqueamento: 1, categoria: 'comum' },
      { id: 'exantema', label: 'Exantema', pesoClinico: 5, pesoRanqueamento: 5, categoria: 'principal' },
      { id: 'conjuntivite', label: 'Conjuntivite', pesoClinico: 4, pesoRanqueamento: 5, categoria: 'especifico' },
      { id: 'artralgia', label: 'Artralgia', pesoClinico: 3, pesoRanqueamento: 2, categoria: 'comum' },
      { id: 'mialgia', label: 'Mialgia', pesoClinico: 3, pesoRanqueamento: 2, categoria: 'comum' },
      { id: 'edema', label: 'Edema', pesoClinico: 3, pesoRanqueamento: 3, categoria: 'comum' },
      { id: 'sintomas_neurologicos', label: 'Sintomas neurologicos', pesoClinico: 5, pesoRanqueamento: 7, categoria: 'grave' },
    ],
  },
  {
    id: 'oropouche',
    label: 'Febre do Oropouche - casos',
    cid10: ['A93.0'],
    sintomas: [
      { id: 'febre', label: 'Febre', pesoClinico: 5, pesoRanqueamento: 2, categoria: 'principal' },
      { id: 'cefaleia', label: 'Cefaleia', pesoClinico: 4, pesoRanqueamento: 3, categoria: 'comum' },
      { id: 'mialgia', label: 'Mialgia', pesoClinico: 4, pesoRanqueamento: 3, categoria: 'comum' },
      { id: 'artralgia', label: 'Artralgia', pesoClinico: 4, pesoRanqueamento: 3, categoria: 'comum' },
      { id: 'tontura', label: 'Tontura', pesoClinico: 3, pesoRanqueamento: 2, categoria: 'comum' },
      { id: 'nausea', label: 'Nausea', pesoClinico: 3, pesoRanqueamento: 2, categoria: 'comum' },
      { id: 'vomito', label: 'Vomito', pesoClinico: 3, pesoRanqueamento: 2, categoria: 'comum' },
      { id: 'diarreia', label: 'Diarreia', pesoClinico: 3, pesoRanqueamento: 2, categoria: 'comum' },
      { id: 'dor_retro_orbital', label: 'Dor retro-orbital', pesoClinico: 4, pesoRanqueamento: 4, categoria: 'especifico' },
      { id: 'exantema', label: 'Exantema', pesoClinico: 3, pesoRanqueamento: 3, categoria: 'comum' },
      { id: 'epistaxe', label: 'Epistaxe', pesoClinico: 4, pesoRanqueamento: 5, categoria: 'alarme' },
      { id: 'hemorragia_gengival', label: 'Hemorragia gengival', pesoClinico: 4, pesoRanqueamento: 5, categoria: 'alarme' },
      { id: 'petequia', label: 'Petequia', pesoClinico: 4, pesoRanqueamento: 5, categoria: 'alarme' },
      { id: 'meningoencefalite', label: 'Meningoencefalite', pesoClinico: 5, pesoRanqueamento: 7, categoria: 'grave' },
      { id: 'sintomas_neurologicos', label: 'Sintomas neurologicos', pesoClinico: 5, pesoRanqueamento: 7, categoria: 'grave' },
    ],
  },
  {
    id: 'tuberculose',
    label: 'Tuberculose',
    cid10: ['A15', 'A16', 'A17', 'A18', 'A19'],
    sintomas: [
      { id: 'tosse', label: 'Tosse', pesoClinico: 5, pesoRanqueamento: 7, categoria: 'principal' },
      { id: 'tosse_seca', label: 'Tosse seca', pesoClinico: 3, pesoRanqueamento: 3, categoria: 'comum' },
      { id: 'hemoptise', label: 'Hemoptise', pesoClinico: 5, pesoRanqueamento: 8, categoria: 'especifico' },
      { id: 'febre', label: 'Febre', pesoClinico: 4, pesoRanqueamento: 3, categoria: 'comum' },
      { id: 'sudorese', label: 'Sudorese', pesoClinico: 4, pesoRanqueamento: 5, categoria: 'especifico' },
      { id: 'peso_diminuido', label: 'Peso diminuido', pesoClinico: 5, pesoRanqueamento: 6, categoria: 'principal' },
      { id: 'cansaco', label: 'Cansaco', pesoClinico: 3, pesoRanqueamento: 2, categoria: 'comum' },
      { id: 'dor_toracica', label: 'Dor toracica', pesoClinico: 3, pesoRanqueamento: 3, categoria: 'comum' },
    ],
  },
  {
    id: 'leptospirose',
    label: 'Leptospirose',
    cid10: ['A27'],
    permitirAssintomatico: true,
    sintomas: [
      { id: 'assintomatico', label: 'Assintomatico', pesoClinico: 2, pesoRanqueamento: 1, categoria: 'possivel' },
      { id: 'febre', label: 'Febre', pesoClinico: 5, pesoRanqueamento: 3, categoria: 'principal' },
      { id: 'cefaleia', label: 'Cefaleia', pesoClinico: 4, pesoRanqueamento: 3, categoria: 'comum' },
      { id: 'mialgia', label: 'Mialgia', pesoClinico: 5, pesoRanqueamento: 4, categoria: 'principal' },
      { id: 'dor_panturilha', label: 'Dor na panturrilha', pesoClinico: 5, pesoRanqueamento: 7, categoria: 'especifico' },
      { id: 'nausea', label: 'Nausea', pesoClinico: 3, pesoRanqueamento: 1, categoria: 'comum' },
      { id: 'vomito', label: 'Vomito', pesoClinico: 3, pesoRanqueamento: 1, categoria: 'comum' },
      { id: 'ictericia', label: 'Ictericia', pesoClinico: 5, pesoRanqueamento: 6, categoria: 'alarme' },
      { id: 'hemorragia_pulmonar', label: 'Hemorragia pulmonar', pesoClinico: 5, pesoRanqueamento: 8, categoria: 'grave' },
      { id: 'insuficiencia_renal', label: 'Insuficiencia renal', pesoClinico: 5, pesoRanqueamento: 8, categoria: 'grave' },
    ],
  },
  {
    id: 'mpox',
    label: 'Mpox',
    cid10: ['B04'],
    sintomas: [
      { id: 'lesao_cutanea', label: 'Lesao cutanea', pesoClinico: 5, pesoRanqueamento: 6, categoria: 'principal' },
      { id: 'erupcao_cutanea', label: 'Erupcao cutanea', pesoClinico: 5, pesoRanqueamento: 6, categoria: 'principal' },
      { id: 'lesao_oral', label: 'Lesao oral', pesoClinico: 4, pesoRanqueamento: 5, categoria: 'especifico' },
      { id: 'lesao_genital', label: 'Lesao genital', pesoClinico: 5, pesoRanqueamento: 7, categoria: 'especifico' },
      { id: 'lesao_anal', label: 'Lesao anal', pesoClinico: 5, pesoRanqueamento: 7, categoria: 'especifico' },
      { id: 'proctite', label: 'Proctite', pesoClinico: 4, pesoRanqueamento: 6, categoria: 'especifico' },
      { id: 'adenomegalia', label: 'Adenomegalia', pesoClinico: 4, pesoRanqueamento: 4, categoria: 'comum' },
      { id: 'febre', label: 'Febre', pesoClinico: 3, pesoRanqueamento: 1, categoria: 'comum' },
      { id: 'cefaleia', label: 'Cefaleia', pesoClinico: 3, pesoRanqueamento: 1, categoria: 'comum' },
      { id: 'mialgia', label: 'Mialgia', pesoClinico: 3, pesoRanqueamento: 1, categoria: 'comum' },
    ],
  },
  {
    id: 'crianca_exposta_hbv',
    label: 'Crianca exposta ao risco de transmissao vertical da Hepatite B',
    cid10: ['Z20.5'],
    permitirAssintomatico: true,
    sintomas: [
      { id: 'assintomatico', label: 'Assintomatico', pesoClinico: 5, pesoRanqueamento: 6, categoria: 'principal' },
      { id: 'febre', label: 'Febre', pesoClinico: 2, pesoRanqueamento: 1, categoria: 'comum' },
      { id: 'nausea', label: 'Nausea', pesoClinico: 2, pesoRanqueamento: 1, categoria: 'comum' },
      { id: 'vomito', label: 'Vomito', pesoClinico: 2, pesoRanqueamento: 1, categoria: 'comum' },
      { id: 'dor_abdominal', label: 'Dor abdominal', pesoClinico: 2, pesoRanqueamento: 1, categoria: 'comum' },
      { id: 'ictericia', label: 'Ictericia', pesoClinico: 4, pesoRanqueamento: 4, categoria: 'alarme' },
    ],
  },
];

export function getSyndromicAgravoOptions(): Array<{ value: string; label: string }> {
  return AGRAVOS_MATRIX.map((agravo) => ({ value: agravo.id, label: agravo.label }));
}

export function getSyndromicSymptomsForAgravos(
  agravoIds: string[],
): Array<{ value: string; label: string }> {
  const selectedSet = new Set(agravoIds.filter(Boolean));
  const sourceAgravos =
    selectedSet.size > 0
      ? AGRAVOS_MATRIX.filter((agravo) => selectedSet.has(agravo.id))
      : AGRAVOS_MATRIX;

  const merged = new Map<
    string,
    { label: string; bestWeight: number; bestCategoryRank: number }
  >();

  sourceAgravos.forEach((agravo) => {
    agravo.sintomas.forEach((sintoma) => {
      const current = merged.get(sintoma.id);
      const categoryRank = CATEGORIA_RANK[sintoma.categoria];
      if (!current) {
        merged.set(sintoma.id, {
          label: sintoma.label,
          bestWeight: sintoma.pesoRanqueamento,
          bestCategoryRank: categoryRank,
        });
        return;
      }
      merged.set(sintoma.id, {
        label: current.label,
        bestWeight: Math.max(current.bestWeight, sintoma.pesoRanqueamento),
        bestCategoryRank: Math.max(current.bestCategoryRank, categoryRank),
      });
    });
  });

  return Array.from(merged.entries())
    .sort((a, b) => {
      if (b[1].bestCategoryRank !== a[1].bestCategoryRank) {
        return b[1].bestCategoryRank - a[1].bestCategoryRank;
      }
      if (b[1].bestWeight !== a[1].bestWeight) {
        return b[1].bestWeight - a[1].bestWeight;
      }
      return a[1].label.localeCompare(b[1].label, 'pt-BR');
    })
    .map(([id, data]) => ({ value: id, label: data.label }));
}

export function rankSyndromicAgravosBySymptoms(
  symptomIds: string[],
  options?: { candidateAgravoIds?: string[]; top?: number },
): RankedAgravo[] {
  const selected = new Set(symptomIds.filter((id) => id && id !== SINTOMA_OUTRO_ID));
  if (selected.size === 0) return [];

  const candidateSet = new Set(options?.candidateAgravoIds?.filter(Boolean) ?? []);
  const candidates =
    candidateSet.size > 0
      ? AGRAVOS_MATRIX.filter((agravo) => candidateSet.has(agravo.id))
      : AGRAVOS_MATRIX;

  const ranked = candidates
    .map((agravo): RankedAgravo => {
      let numerator = 0;
      let denominator = 0;
      let denominatorFallback = 0;
      const matchedSymptoms: string[] = [];
      const missingKeySymptoms: string[] = [];

      agravo.sintomas.forEach((sintoma) => {
        const relevant = RELEVANT_CATEGORIES.has(sintoma.categoria);
        if (relevant) denominator += sintoma.pesoRanqueamento;
        denominatorFallback += sintoma.pesoRanqueamento;
        if (selected.has(sintoma.id)) {
          numerator += sintoma.pesoRanqueamento;
          matchedSymptoms.push(sintoma.label);
        } else if (relevant) {
          missingKeySymptoms.push(sintoma.label);
        }
      });

      const base = denominator > 0 ? denominator : denominatorFallback;
      const score = base > 0 ? Math.min(1, numerator / base) : 0;

      return {
        agravoId: agravo.id,
        agravoLabel: agravo.label,
        cid10: agravo.cid10,
        score,
        matchedSymptoms,
        missingKeySymptoms,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const top = options?.top ?? 5;
  return ranked.slice(0, top);
}

