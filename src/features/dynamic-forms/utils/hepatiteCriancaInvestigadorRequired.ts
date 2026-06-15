export const HEPATITE_INVESTIGADOR_REQUIRED_KEYS = [
  'investigador.municipio_id',
  'investigador.unidade_id',
  'investigador.nome',
  'investigador.funcao',
] as const;

export const HEPATITE_INVESTIGADOR_VISIBLE_KEYS = new Set<string>([
  'investigador.municipio_id',
  'investigador.unidade_id',
]);

export function isHepatiteInvestigadorRequiredKey(key: string): boolean {
  return (HEPATITE_INVESTIGADOR_REQUIRED_KEYS as readonly string[]).includes(key);
}
