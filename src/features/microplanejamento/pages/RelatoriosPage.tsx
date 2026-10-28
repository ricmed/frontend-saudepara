import { PainelAcompanhamento } from '../PainelAcompanhamento';
import { Aviso } from '../ui';
import { useMpFiltro } from '../useMp';

export function RelatoriosPage() {
  const { cicloId, estabelecimentoId } = useMpFiltro();
  if (!cicloId) return <Aviso tipo="info">Selecione o ciclo para ver o acompanhamento.</Aviso>;
  return <PainelAcompanhamento cicloId={cicloId} estabelecimentoId={estabelecimentoId} />;
}
