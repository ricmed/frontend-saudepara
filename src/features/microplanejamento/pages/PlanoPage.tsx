import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi } from '../api';
import { numero, texto, useMpFiltro } from '../useMp';
import { Aviso, Botao, Campo, Cartao, Celula, Formulario, inputClass, Linha, Tabela } from '../ui';

const STATUS = ['RASCUNHO', 'EM_VALIDACAO', 'APROVADO', 'EM_EXECUCAO', 'CONCLUIDA', 'REPROGRAMADA', 'CANCELADA', 'ENCERRADO'];

export function PlanoPage({ modo }: { modo: 'plano' | 'comunicacao' }) {
  const { cicloId, estabelecimentoId } = useMpFiltro();
  const queryClient = useQueryClient();
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [localidadePrioritaria, setLocalidadePrioritaria] = useState<number | ''>('');
  const planos = useQuery({
    queryKey: ['mp-planos', cicloId],
    enabled: Boolean(cicloId) && modo === 'plano',
    queryFn: () => microplanejamentoApi.listar<Record<string, unknown>>('planos', { cicloId, limit: 100 }),
  });
  const comunicacoes = useQuery({
    queryKey: ['mp-com', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId) && modo === 'comunicacao',
    queryFn: () => microplanejamentoApi.listar<Record<string, unknown>>('comunicacoes', { cicloId, estabelecimentoId }),
  });
  const locais = useQuery({
    queryKey: ['mp-localidades-ciclo', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.localidadesCiclo(cicloId!, estabelecimentoId),
  });
  const criar = useMutation({
    mutationFn: (body: unknown) => microplanejamentoApi.criar(modo === 'plano' ? 'planos' : 'comunicacoes', body),
    onSuccess: () => {
      setOk('Registro gravado.');
      setErro('');
      queryClient.invalidateQueries({ queryKey: ['mp-planos'] });
      queryClient.invalidateQueries({ queryKey: ['mp-com'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });

  function usarPrioritaria() {
    const linha = (locais.data?.data ?? []).find((item) => item.prioridade === 1);
    setLocalidadePrioritaria(linha?.localidade_id ?? '');
    if (!linha) setErro('Não há localidade de prioridade 1 neste recorte.');
  }

  function onPlano(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cicloId) return setErro('Selecione o ciclo.');
    const form = new FormData(event.currentTarget);
    const localidadeId = numero(form.get('localidade_id'));
    criar.mutate({
      ciclo_id: cicloId,
      acao: String(form.get('acao') || '').trim(),
      objetivo: texto(form.get('objetivo')),
      publico: texto(form.get('publico')),
      periodo: texto(form.get('periodo')),
      status: String(form.get('status') || 'RASCUNHO'),
      locais: localidadeId ? [{
        localidade_id: localidadeId,
        estabelecimento_id: estabelecimentoId ?? null,
        responsavel_nome: texto(form.get('responsavel')),
        data_inicio: texto(form.get('inicio')),
        data_fim: texto(form.get('fim')),
        resultado: texto(form.get('resultado')),
      }] : [],
    });
  }

  function onComunicacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cicloId) return setErro('Selecione o ciclo.');
    const form = new FormData(event.currentTarget);
    criar.mutate({
      ciclo_id: cicloId,
      estabelecimento_id: estabelecimentoId ?? null,
      atividade: String(form.get('atividade') || '').trim(),
      data_hora: texto(form.get('data_hora')),
      local: texto(form.get('local')),
      objetivo: texto(form.get('objetivo')),
      forma: texto(form.get('forma')),
      publico: texto(form.get('publico')),
      mensagem_chave: texto(form.get('mensagem')),
      responsaveis: texto(form.get('responsaveis')),
      custo: numero(form.get('custo')),
      status: 'RASCUNHO',
    });
  }

  return (
    <div className="space-y-4">
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      {modo === 'plano' ? (
        <Cartao titulo="Plano de ação" acoes={<button type="button" className="text-sm text-blue-700" onClick={usarPrioritaria}>Usar localidade prioritária</button>}>
          <Formulario onSubmit={onPlano}>
            <Campo label="Ação"><input name="acao" required className={inputClass} /></Campo>
            <Campo label="Objetivo"><input name="objetivo" className={inputClass} /></Campo>
            <Campo label="Público"><input name="publico" className={inputClass} /></Campo>
            <Campo label="Período"><input name="periodo" className={inputClass} /></Campo>
            <Campo label="Status">
              <select name="status" className={inputClass}>{STATUS.map((item) => <option key={item}>{item}</option>)}</select>
            </Campo>
            <Campo label="Localidade">
              <select name="localidade_id" className={inputClass} value={localidadePrioritaria} onChange={(e) => setLocalidadePrioritaria(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Selecione</option>
                {(locais.data?.data ?? []).map((item) => <option key={item.localidade_id} value={item.localidade_id}>{item.localidade.nome} · prioridade {item.prioridade ?? '—'}</option>)}
              </select>
            </Campo>
            <Campo label="Responsável"><input name="responsavel" className={inputClass} /></Campo>
            <Campo label="Início do local"><input name="inicio" type="date" className={inputClass} /></Campo>
            <Campo label="Fim do local"><input name="fim" type="date" className={inputClass} /></Campo>
            <Campo label="Resultado mínimo"><input name="resultado" className={inputClass} /></Campo>
            <div className="md:col-span-2"><Botao type="submit">Gravar plano</Botao></div>
          </Formulario>
          <Tabela colunas={['Ação', 'Status']}>
            {(planos.data?.data ?? []).map((plano) => (
              <Linha key={String(plano.id)}><Celula>{String(plano.acao)}</Celula><Celula>{String(plano.status)}</Celula></Linha>
            ))}
          </Tabela>
        </Cartao>
      ) : (
        <Cartao titulo="Comunicação">
          <p className="text-sm">Custo total: {String(comunicacoes.data?.custo_total ?? 0)}</p>
          <Formulario onSubmit={onComunicacao}>
            <Campo label="Atividade"><input name="atividade" required className={inputClass} /></Campo>
            <Campo label="Data e hora"><input name="data_hora" type="datetime-local" className={inputClass} /></Campo>
            <Campo label="Local"><input name="local" className={inputClass} /></Campo>
            <Campo label="Objetivo"><input name="objetivo" className={inputClass} /></Campo>
            <Campo label="Forma"><input name="forma" className={inputClass} /></Campo>
            <Campo label="Público"><input name="publico" className={inputClass} /></Campo>
            <Campo label="Mensagem-chave"><input name="mensagem" className={inputClass} /></Campo>
            <Campo label="Responsáveis"><input name="responsaveis" className={inputClass} /></Campo>
            <Campo label="Custo"><input name="custo" type="number" min={0} step="0.01" className={inputClass} /></Campo>
            <div className="md:col-span-2"><Botao type="submit">Gravar atividade</Botao></div>
          </Formulario>
          <Tabela colunas={['Atividade', 'Custo', 'Status']}>
            {(comunicacoes.data?.data ?? []).map((item) => (
              <Linha key={String(item.id)}>
                <Celula>{String(item.atividade)}</Celula>
                <Celula>{String(item.custo ?? 0)}</Celula>
                <Celula>{String(item.status ?? '')}</Celula>
              </Linha>
            ))}
          </Tabela>
        </Cartao>
      )}
    </div>
  );
}
