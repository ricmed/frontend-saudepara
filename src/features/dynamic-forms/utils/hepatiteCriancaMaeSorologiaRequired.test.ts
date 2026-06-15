import {
  MAE_SOROLOGIA_REAGENTE_HBV_KEY,
  MAE_SOROLOGIA_REAGENTE_HCV_KEY,
  isMaeSorologiaReagentePreenchida,
  isMaeSorologiaReagenteRequired,
} from './hepatiteCriancaMaeSorologiaRequired';

const get =
  (data: Record<string, string>) =>
  (key: string): unknown =>
    data[key];

describe('hepatiteCriancaMaeSorologiaRequired', () => {
  it('exige sorologia HBV quando exposição é HBV ou co-infecção', () => {
    expect(isMaeSorologiaReagenteRequired(MAE_SOROLOGIA_REAGENTE_HBV_KEY, get({ 'notificacao.tipo_exposicao_hepatite': '1' }))).toBe(
      true,
    );
    expect(isMaeSorologiaReagenteRequired(MAE_SOROLOGIA_REAGENTE_HBV_KEY, get({ 'notificacao.tipo_exposicao_hepatite': '3' }))).toBe(
      true,
    );
    expect(isMaeSorologiaReagenteRequired(MAE_SOROLOGIA_REAGENTE_HBV_KEY, get({ 'notificacao.tipo_exposicao_hepatite': '2' }))).toBe(
      false,
    );
  });

  it('exige sorologia HCV quando exposição é HCV ou co-infecção', () => {
    expect(isMaeSorologiaReagenteRequired(MAE_SOROLOGIA_REAGENTE_HCV_KEY, get({ 'notificacao.tipo_exposicao_hepatite': '2' }))).toBe(
      true,
    );
    expect(isMaeSorologiaReagenteRequired(MAE_SOROLOGIA_REAGENTE_HCV_KEY, get({ 'notificacao.tipo_exposicao_hepatite': '3' }))).toBe(
      true,
    );
    expect(isMaeSorologiaReagenteRequired(MAE_SOROLOGIA_REAGENTE_HCV_KEY, get({ 'notificacao.tipo_exposicao_hepatite': '1' }))).toBe(
      false,
    );
  });

  it('aceita Sim ou Não e rejeita vazio', () => {
    const base = { 'notificacao.tipo_exposicao_hepatite': '1' };
    expect(isMaeSorologiaReagentePreenchida(MAE_SOROLOGIA_REAGENTE_HBV_KEY, get({ ...base, [MAE_SOROLOGIA_REAGENTE_HBV_KEY]: '1' }))).toBe(
      true,
    );
    expect(isMaeSorologiaReagentePreenchida(MAE_SOROLOGIA_REAGENTE_HBV_KEY, get({ ...base, [MAE_SOROLOGIA_REAGENTE_HBV_KEY]: '2' }))).toBe(
      true,
    );
    expect(isMaeSorologiaReagentePreenchida(MAE_SOROLOGIA_REAGENTE_HBV_KEY, get(base))).toBe(false);
  });
});
