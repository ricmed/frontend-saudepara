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

export function mensagemPopulacaoAlvo(populacao: number, totalUbs: number): string | null {
  if (!(totalUbs > 0)) return 'Cadastre a população da UBS antes de gravar a meta.';
  if (!Number.isInteger(populacao) || populacao < 1) return 'Informe a população-alvo.';
  if (populacao > totalUbs) return `A população-alvo não pode passar de ${totalUbs}.`;
  return null;
}

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
