export type LinhaPopulacaoUbs = {
  populacao_alvo: number;
  zona?: 'URBANA' | 'RURAL' | null;
};

export type PopulacaoUbs = {
  total: number;
  urbana: number;
  rural: number;
  semZona: number;
};

export function somarPopulacaoUbs(linhas: LinhaPopulacaoUbs[]): PopulacaoUbs {
  let total = 0;
  let urbana = 0;
  let rural = 0;
  for (const linha of linhas) {
    const populacao = Number.isFinite(linha.populacao_alvo) ? linha.populacao_alvo : 0;
    total += populacao;
    if (linha.zona === 'URBANA') urbana += populacao;
    else if (linha.zona === 'RURAL') rural += populacao;
  }
  return { total, urbana, rural, semZona: total - urbana - rural };
}
