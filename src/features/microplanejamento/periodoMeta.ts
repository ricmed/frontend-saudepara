type DataCalendario = { ano: number; mes: number; dia: number };

function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

function parseDataIso(valor: string): DataCalendario | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!match) return null;
  const ano = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > diasNoMes(ano, mes)) return null;
  return { ano, mes, dia };
}

function comparar(a: DataCalendario, b: DataCalendario): number {
  if (a.ano !== b.ano) return a.ano - b.ano;
  if (a.mes !== b.mes) return a.mes - b.mes;
  return a.dia - b.dia;
}

function adicionarMeses(data: DataCalendario, meses: number): DataCalendario {
  const indice = data.ano * 12 + (data.mes - 1) + meses;
  const ano = Math.floor(indice / 12);
  const mes = (indice % 12) + 1;
  return { ano, mes, dia: Math.min(data.dia, diasNoMes(ano, mes)) };
}

export function mensagemPeriodoMeta(inicio: string, fim: string): string | null {
  const a = parseDataIso(inicio);
  const b = parseDataIso(fim);
  if (!a || !b) return 'Informe datas válidas.';
  if (comparar(a, b) > 0) return 'A data início não pode ser posterior à data fim.';
  if (comparar(b, adicionarMeses(a, 12)) > 0) return 'O período não pode passar de 12 meses.';
  return null;
}

export function dataCurta(valor?: string | null): string {
  const iso = valor?.slice(0, 10) ?? '';
  const [ano, mes, dia] = iso.split('-');
  if (!ano || !mes || !dia) return '';
  return `${dia}/${mes}/${ano}`;
}
