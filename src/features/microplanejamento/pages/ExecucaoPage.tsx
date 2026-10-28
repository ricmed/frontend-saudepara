import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi, type Checklist } from '../api';
import { numero, texto, useMpFiltro } from '../useMp';
import { enfileirar, listarFila, sincronizarFila } from '../offlineQueue';
import { Aviso, Botao, Campo, Cartao, Celula, Formulario, inputClass, Linha, Tabela } from '../ui';

export function ExecucaoPage() {
  const { cicloId, estabelecimentoId } = useMpFiltro();
  const queryClient = useQueryClient();
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [fila, setFila] = useState<Awaited<ReturnType<typeof listarFila>>>([]);
  const [supervisao, setSupervisao] = useState<Checklist | null>(null);
  const vacinas = useQuery({ queryKey: ['mp-cat-vac'], queryFn: () => microplanejamentoApi.catalogo('VACINA') });
  const motivos = useQuery({ queryKey: ['mp-cat-mev'], queryFn: () => microplanejamentoApi.catalogo('MOTIVO_MEV') });
  const localidades = useQuery({
    queryKey: ['mp-localidades', estabelecimentoId],
    enabled: Boolean(estabelecimentoId),
    queryFn: () => microplanejamentoApi.localidades({ estabelecimentoId, limit: 100 }),
  });
  const execucoes = useQuery({
    queryKey: ['mp-exec', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.listar<Record<string, unknown>>('execucoes', { cicloId, estabelecimentoId, limit: 50 }),
  });
  const mevs = useQuery({
    queryKey: ['mp-mev', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.listar<Record<string, unknown>>('mev', { cicloId, estabelecimentoId }),
  });

  useEffect(() => { listarFila().then(setFila).catch(() => setFila([])); }, [ok]);

  const criarExec = useMutation({
    mutationFn: (body: unknown) => microplanejamentoApi.criar('execucoes', body),
    onSuccess: () => {
      setOk('Execução gravada. A meta passa a somar as doses desta execução.');
      queryClient.invalidateQueries({ queryKey: ['mp-exec'] });
      queryClient.invalidateQueries({ queryKey: ['mp-metas'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const criarMev = useMutation({
    mutationFn: (body: unknown) => microplanejamentoApi.criar('mev', body),
    onSuccess: () => {
      setOk('MEV gravada.');
      queryClient.invalidateQueries({ queryKey: ['mp-mev'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });

  async function onExecucao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cicloId || !estabelecimentoId) return setErro('Selecione ciclo e UBS.');
    const form = new FormData(event.currentTarget);
    const body = {
      ciclo_id: cicloId,
      estabelecimento_id: estabelecimentoId,
      localidade_id: form.get('localidade_id') ? numero(form.get('localidade_id')) : null,
      data: String(form.get('data')),
      item_id: numero(form.get('item_id')),
      equipe_texto: texto(form.get('equipe')),
      doses_aplicadas: numero(form.get('doses')),
      pessoas_vacinadas: numero(form.get('pessoas')),
      recusas: numero(form.get('recusas')),
      ausentes: numero(form.get('ausentes')),
      perdas: numero(form.get('perdas')),
      intercorrencia: texto(form.get('intercorrencia')),
      observacoes: texto(form.get('observacoes')),
    };
    if (!navigator.onLine) {
      await enfileirar('execucao', body);
      setOk('Execução ficou na fila offline.');
      setFila(await listarFila());
      return;
    }
    criarExec.mutate(body);
  }

  async function sincronizar() {
    try {
      const resultado = await sincronizarFila();
      setFila(await listarFila());
      setOk(`Sincronizados ${resultado.aceitos.length}. Rejeitados ${resultado.rejeitados.length}.`);
      queryClient.invalidateQueries({ queryKey: ['mp-exec'] });
    } catch (error) {
      setErro(apiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-4">
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Cartao titulo="Fila offline" acoes={<Botao onClick={sincronizar}>Sincronizar</Botao>}>
        {fila.length === 0 ? <p className="text-sm text-gray-500">Nenhum lançamento pendente.</p> : (
          <ul className="text-sm space-y-1">
            {fila.map((item) => <li key={item.clientUuid}>{item.tipo} · {item.status}{item.erro ? ` · ${item.erro}` : ''}</li>)}
          </ul>
        )}
      </Cartao>
      <Cartao titulo="Execução diária">
        <Formulario onSubmit={onExecucao}>
          <Campo label="Data"><input name="data" type="date" required className={inputClass} /></Campo>
          <Campo label="Vacina">
            <select name="item_id" required className={inputClass}>{(vacinas.data?.itens ?? []).map((item) => <option key={item.id} value={item.id}>{item.texto}</option>)}</select>
          </Campo>
          <Campo label="Localidade">
            <select name="localidade_id" className={inputClass}><option value="">—</option>{(localidades.data?.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select>
          </Campo>
          <Campo label="Equipe"><input name="equipe" className={inputClass} /></Campo>
          <Campo label="Doses aplicadas"><input name="doses" type="number" min={0} required className={inputClass} /></Campo>
          <Campo label="Pessoas vacinadas"><input name="pessoas" type="number" min={0} className={inputClass} /></Campo>
          <Campo label="Recusas"><input name="recusas" type="number" min={0} className={inputClass} /></Campo>
          <Campo label="Ausentes"><input name="ausentes" type="number" min={0} className={inputClass} /></Campo>
          <Campo label="Perdas"><input name="perdas" type="number" min={0} className={inputClass} /></Campo>
          <Campo label="Intercorrência ou ESAVI"><input name="intercorrencia" className={inputClass} /></Campo>
          <Campo label="Observações"><input name="observacoes" className={inputClass} /></Campo>
          <div className="md:col-span-2"><Botao type="submit">Lançar execução</Botao></div>
        </Formulario>
        <Tabela colunas={['Data', 'Doses']}>
          {(execucoes.data?.data ?? []).map((item) => (
            <Linha key={String(item.id)}><Celula>{String(item.data).slice(0, 10)}</Celula><Celula>{String(item.doses_aplicadas)}</Celula></Linha>
          ))}
        </Tabela>
      </Cartao>
      <Cartao titulo="MEV / MRV">
        <Formulario onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          if (!cicloId) return setErro('Selecione o ciclo.');
          criarMev.mutate({
            ciclo_id: cicloId,
            data: String(form.get('data')),
            localidade_id: numero(form.get('localidade_id')),
            roteiro: texto(form.get('roteiro')),
            situacao_vacinal: texto(form.get('situacao')),
            motivo_codigo: texto(form.get('motivo')),
            encaminhamento: texto(form.get('encaminhamento')),
            responsavel_nome: texto(form.get('responsavel')),
          });
        }}>
          <Campo label="Data"><input name="data" type="date" required className={inputClass} /></Campo>
          <Campo label="Localidade">
            <select name="localidade_id" required className={inputClass}>{(localidades.data?.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select>
          </Campo>
          <Campo label="Roteiro"><input name="roteiro" className={inputClass} /></Campo>
          <Campo label="Situação vacinal"><input name="situacao" className={inputClass} /></Campo>
          <Campo label="Motivo">
            <select name="motivo" className={inputClass}><option value="">—</option>{(motivos.data?.itens ?? []).map((item) => <option key={item.id} value={item.codigo}>{item.texto}</option>)}</select>
          </Campo>
          <Campo label="Encaminhamento"><input name="encaminhamento" className={inputClass} /></Campo>
          <Campo label="Responsável"><input name="responsavel" className={inputClass} /></Campo>
          <div className="md:col-span-2"><Botao type="submit">Gravar MEV</Botao></div>
        </Formulario>
        <p className="text-sm text-gray-600">{mevs.data?.data.length ?? 0} registros. O formulário MRV usa esta quantidade × 3 na necessidade.</p>
      </Cartao>
      <Cartao titulo="Supervisão" acoes={<Botao onClick={async () => {
        if (!cicloId) return setErro('Selecione o ciclo.');
        try {
          const aberto = await microplanejamentoApi.abrirChecklist({ ciclo_id: cicloId, nivel: estabelecimentoId ? 'UBS' : 'MUNICIPIO', tipo: 'SUPERVISAO', estabelecimento_id: estabelecimentoId ?? null });
          setSupervisao(aberto);
        } catch (error) {
          setErro(apiErrorMessage(error));
        }
      }}>Abrir supervisão</Botao>}>
        {supervisao && (
          <form className="space-y-2" onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const respostas = supervisao.catalogo.itens.map((item) => ({
              item_id: item.id,
              status: (String(form.get(`st-${item.id}`) || '') || null) as 'SIM' | 'PARCIAL' | 'NAO' | 'NA' | null,
            }));
            try {
              const salvo = await microplanejamentoApi.salvarRespostas(supervisao.id, {
                respostas,
                supervisor_nome: texto(form.get('supervisor')),
                supervisionado_nome: texto(form.get('supervisionado')),
                data_referencia: texto(form.get('data')),
                observacao_geral: texto(form.get('geral')),
                recomendacoes: texto(form.get('recomendacoes')),
              });
              setSupervisao(salvo);
              setOk(`Supervisão ${salvo.classificacao ?? ''} · índice ${salvo.indice}`);
            } catch (error) {
              setErro(apiErrorMessage(error));
            }
          }}>
            <Campo label="Supervisor"><input name="supervisor" className={inputClass} /></Campo>
            <Campo label="Supervisionado"><input name="supervisionado" className={inputClass} /></Campo>
            <Campo label="Data"><input name="data" type="date" className={inputClass} /></Campo>
            {supervisao.catalogo.itens.map((item) => (
              <label key={item.id} className="grid md:grid-cols-[1fr_140px] gap-2 text-sm">
                <span>{item.ordem}. {item.texto}</span>
                <select name={`st-${item.id}`} className={inputClass}><option value="">—</option><option>SIM</option><option>PARCIAL</option><option>NAO</option><option>NA</option></select>
              </label>
            ))}
            <textarea name="geral" placeholder="Observação geral" className={inputClass} />
            <textarea name="recomendacoes" placeholder="Recomendações" className={inputClass} />
            <Botao type="submit">Gravar supervisão</Botao>
          </form>
        )}
      </Cartao>
    </div>
  );
}
