import { useState } from 'react';
import * as XLSX from 'xlsx';
import { apiErrorMessage, microplanejamentoApi } from '../api';
import { useMpFiltro } from '../useMp';
import { Aviso, Botao, Cartao, inputClass } from '../ui';

const TIPOS = [
  ['localidades', 'Localidades'],
  ['comite', 'Comitê'],
  ['capacitacoes', 'Capacitações'],
  ['profissionais', 'Profissionais'],
  ['liderancas', 'Lideranças'],
  ['riscos', 'Riscos'],
  ['fofas', 'FOFA'],
  ['checklists', 'Checklists'],
  ['inventarios', 'Inventário'],
  ['necessidades', 'Necessidades'],
  ['metas', 'Metas'],
  ['planos', 'Planos'],
  ['comunicacoes', 'Comunicação'],
  ['execucoes', 'Execução'],
  ['mevs', 'MEV'],
  ['avaliacoes', 'Avaliação'],
  ['alertas', 'Alertas'],
  ['prioridades', 'Prioridade composta'],
];

export function RelatoriosPage() {
  const { cicloId } = useMpFiltro();
  const [tipo, setTipo] = useState('localidades');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');

  async function exportar() {
    if (!cicloId) return setErro('Selecione o ciclo.');
    try {
      const relatorio = await microplanejamentoApi.relatorio(tipo, cicloId);
      const planilha = XLSX.utils.json_to_sheet(relatorio.data);
      const livro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(livro, planilha, tipo.slice(0, 31));
      XLSX.writeFile(livro, `microplanejamento-${tipo}.xlsx`);
      setOk(`${relatorio.data.length} linha(s) exportadas.`);
      setErro('');
    } catch (error) {
      setErro(apiErrorMessage(error));
    }
  }

  return (
    <Cartao titulo="Exportação">
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-sm">
          Relatório
          <select className={`${inputClass} mt-1`} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS.map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
          </select>
        </label>
        <Botao onClick={exportar}>Baixar XLSX</Botao>
      </div>
    </Cartao>
  );
}
