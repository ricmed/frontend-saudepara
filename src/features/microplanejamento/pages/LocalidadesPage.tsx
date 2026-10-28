import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi } from '../api';
import { numero, texto, useMpFiltro } from '../useMp';
import { Aviso, Botao, BotaoSecundario, Campo, Cartao, Celula, Formulario, inputClass, Linha, Tabela } from '../ui';

const ESTRATEGIAS = ['ROTINA', 'INTENSIFICACAO', 'CAMPANHA', 'MULTIVACINACAO', 'BLOQUEIO'];

export function LocalidadesPage() {
  const { cicloId, estabelecimentoId, municipioId, setFiltro } = useMpFiltro();
  const queryClient = useQueryClient();
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const localidades = useQuery({
    queryKey: ['mp-localidades', estabelecimentoId],
    enabled: Boolean(estabelecimentoId),
    queryFn: () => microplanejamentoApi.localidades({ estabelecimentoId, limit: 100 }),
  });
  const doCiclo = useQuery({
    queryKey: ['mp-localidades-ciclo', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.localidadesCiclo(cicloId!, estabelecimentoId),
  });
  const sala = useQuery({
    queryKey: ['mp-sala', estabelecimentoId],
    enabled: Boolean(estabelecimentoId),
    queryFn: () => microplanejamentoApi.sala(estabelecimentoId!),
  });

  function ok(textoOk: string) {
    setErro('');
    setMensagem(textoOk);
  }

  const criarCiclo = useMutation({
    mutationFn: (body: unknown) => microplanejamentoApi.criarCiclo(body),
    onSuccess: (ciclo: { id: number }) => {
      ok('Ciclo gravado.');
      setFiltro('cicloId', String(ciclo.id));
      queryClient.invalidateQueries({ queryKey: ['mp-ciclos'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const criarLocalidade = useMutation({
    mutationFn: (body: unknown) => microplanejamentoApi.criarLocalidade(body),
    onSuccess: () => {
      ok('Localidade gravada.');
      queryClient.invalidateQueries({ queryKey: ['mp-localidades'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const vincular = useMutation({
    mutationFn: (vars: { localidadeId: number; body: unknown }) =>
      microplanejamentoApi.salvarLocalidadeCiclo(cicloId!, vars.localidadeId, vars.body),
    onSuccess: () => {
      ok('População e prioridade atualizadas. O percentual de aporte é calculado no servidor.');
      queryClient.invalidateQueries({ queryKey: ['mp-localidades-ciclo'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const salvarSala = useMutation({
    mutationFn: (body: unknown) => microplanejamentoApi.salvarSala(estabelecimentoId!, body),
    onSuccess: () => {
      ok('Sala de vacina atualizada.');
      queryClient.invalidateQueries({ queryKey: ['mp-sala'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const inativar = useMutation({
    mutationFn: (id: number) => microplanejamentoApi.inativar('localidades', id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mp-localidades'] }),
    onError: (error) => setErro(apiErrorMessage(error)),
  });

  function onCiclo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!municipioId) return setErro('Selecione o município.');
    const form = new FormData(event.currentTarget);
    criarCiclo.mutate({
      ano: numero(form.get('ano'), new Date().getFullYear()),
      estrategia: String(form.get('estrategia')),
      tipo_municipio_id: municipioId,
      nome: String(form.get('nome') || '').trim(),
      data_inicio: texto(form.get('data_inicio')),
      data_fim: texto(form.get('data_fim')),
      dias_operacionais: numero(form.get('dias'), 22),
    });
    event.currentTarget.reset();
  }

  function onLocalidade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!estabelecimentoId) return setErro('Selecione a UBS.');
    const form = new FormData(event.currentTarget);
    criarLocalidade.mutate({
      estabelecimento_id: estabelecimentoId,
      nome: String(form.get('nome') || '').trim(),
      bairro: texto(form.get('bairro')),
      zona: texto(form.get('zona')),
      tipo_territorio: texto(form.get('tipo_territorio')),
      domicilios: form.get('domicilios') ? numero(form.get('domicilios')) : null,
      escolas: texto(form.get('escolas')),
      dificuldade_acesso: form.get('dificuldade') === 'on',
      descricao_acesso: texto(form.get('descricao_acesso')),
    });
    event.currentTarget.reset();
  }

  function onSala(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    salvarSala.mutate({
      possui_sala_vacina: form.get('possui') === 'on',
      horario_sala: texto(form.get('horario')),
      telefone: texto(form.get('telefone')),
      email: texto(form.get('email')) ?? '',
      responsavel: texto(form.get('responsavel')),
    });
  }

  return (
    <div className="space-y-4">
      {mensagem && <Aviso tipo="ok">{mensagem}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Cartao titulo="Ciclo">
        <Formulario onSubmit={onCiclo}>
          <Campo label="Nome"><input name="nome" required className={inputClass} /></Campo>
          <Campo label="Ano"><input name="ano" type="number" required className={inputClass} defaultValue={new Date().getFullYear()} /></Campo>
          <Campo label="Estratégia">
            <select name="estrategia" className={inputClass}>{ESTRATEGIAS.map((item) => <option key={item}>{item}</option>)}</select>
          </Campo>
          <Campo label="Dias operacionais"><input name="dias" type="number" min={1} max={31} defaultValue={22} className={inputClass} /></Campo>
          <Campo label="Início"><input name="data_inicio" type="date" className={inputClass} /></Campo>
          <Campo label="Fim"><input name="data_fim" type="date" className={inputClass} /></Campo>
          <div className="md:col-span-2"><Botao type="submit" disabled={criarCiclo.isPending}>Gravar ciclo</Botao></div>
        </Formulario>
      </Cartao>

      <Cartao titulo="Sala de vacina">
        {!estabelecimentoId ? <p className="text-sm text-gray-500">Selecione a UBS.</p> : (
          <Formulario onSubmit={onSala}>
            <Campo label="Possui sala"><input name="possui" type="checkbox" defaultChecked={sala.data?.possui_sala_vacina} /></Campo>
            <Campo label="Horário"><input name="horario" className={inputClass} defaultValue={sala.data?.horario_sala ?? ''} /></Campo>
            <Campo label="Telefone"><input name="telefone" className={inputClass} defaultValue={sala.data?.telefone ?? ''} /></Campo>
            <Campo label="E-mail"><input name="email" type="email" className={inputClass} defaultValue={sala.data?.email ?? ''} /></Campo>
            <Campo label="Responsável"><input name="responsavel" className={inputClass} defaultValue={sala.data?.responsavel ?? ''} /></Campo>
            <div className="md:col-span-2"><Botao type="submit">Gravar sala</Botao></div>
          </Formulario>
        )}
      </Cartao>

      <Cartao titulo="Localidade da UBS">
        <Formulario onSubmit={onLocalidade}>
          <Campo label="Nome"><input name="nome" required className={inputClass} /></Campo>
          <Campo label="Bairro ou comunidade"><input name="bairro" className={inputClass} /></Campo>
          <Campo label="Zona">
            <select name="zona" className={inputClass}><option value="">—</option><option>URBANA</option><option>RURAL</option></select>
          </Campo>
          <Campo label="Tipo de território"><input name="tipo_territorio" className={inputClass} /></Campo>
          <Campo label="Domicílios"><input name="domicilios" type="number" min={0} className={inputClass} /></Campo>
          <Campo label="Escolas e instituições"><input name="escolas" className={inputClass} /></Campo>
          <Campo label="Dificuldade de acesso"><input name="dificuldade" type="checkbox" /></Campo>
          <Campo label="Descrição do acesso"><input name="descricao_acesso" className={inputClass} /></Campo>
          <div className="md:col-span-2"><Botao type="submit">Gravar localidade</Botao></div>
        </Formulario>
        {localidades.isLoading && <p className="text-sm text-gray-500">Carregando localidades…</p>}
        {(localidades.data?.data.length ?? 0) === 0 && estabelecimentoId && !localidades.isLoading && <p className="text-sm text-gray-500">Nenhuma localidade nesta UBS.</p>}
        <Tabela colunas={['Nome', 'Zona', '']}>
          {(localidades.data?.data ?? []).map((item) => (
            <Linha key={item.id}>
              <Celula>{item.nome}</Celula>
              <Celula>{item.zona ?? '—'}</Celula>
              <Celula><BotaoSecundario onClick={() => inativar.mutate(item.id)}>Inativar</BotaoSecundario></Celula>
            </Linha>
          ))}
        </Tabela>
      </Cartao>

      <Cartao titulo="Aporte no ciclo">
        {!cicloId ? <p className="text-sm text-gray-500">Selecione o ciclo.</p> : (
          <Tabela colunas={['Localidade', 'População', 'Prioridade', '% aporte', '']}>
            {(doCiclo.data?.data ?? []).map((item) => (
              <Linha key={item.localidade_id}>
                <Celula>{item.localidade.nome}</Celula>
                <Celula>
                  <form
                    className="flex flex-wrap gap-2 items-center"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      const prioridade = form.get('prioridade');
                      vincular.mutate({
                        localidadeId: item.localidade_id,
                        body: {
                          populacao_alvo: numero(form.get('populacao')),
                          fonte: texto(form.get('fonte')),
                          prioridade: prioridade ? Number(prioridade) : null,
                        },
                      });
                    }}
                  >
                    <input name="populacao" type="number" min={0} defaultValue={item.populacao_alvo} className="w-24 rounded border px-2 py-1" />
                    <input name="fonte" defaultValue={item.fonte ?? ''} placeholder="Fonte" className="w-32 rounded border px-2 py-1" />
                    <select name="prioridade" defaultValue={item.prioridade ?? ''} className="rounded border px-2 py-1">
                      <option value="">—</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                    <span className="text-gray-700">{item.percentual.toFixed(2)}%</span>
                    <Botao type="submit">Salvar</Botao>
                  </form>
                </Celula>
                <Celula>{item.prioridade ?? '—'}</Celula>
                <Celula>{item.percentual.toFixed(2)}</Celula>
                <Celula />
              </Linha>
            ))}
          </Tabela>
        )}
        {cicloId && estabelecimentoId && (localidades.data?.data ?? []).filter((item) => !(doCiclo.data?.data ?? []).some((linha) => linha.localidade_id === item.id)).map((item) => (
          <form
            key={item.id}
            className="flex flex-wrap gap-2 items-end border-t pt-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              vincular.mutate({
                localidadeId: item.id,
                body: {
                  populacao_alvo: numero(form.get('populacao')),
                  fonte: texto(form.get('fonte')),
                  prioridade: form.get('prioridade') ? Number(form.get('prioridade')) : null,
                },
              });
            }}
          >
            <span className="text-sm">{item.nome}</span>
            <input name="populacao" type="number" min={0} required placeholder="População" className={inputClass + ' w-28'} />
            <input name="fonte" placeholder="Fonte" className={inputClass + ' w-40'} />
            <select name="prioridade" className={inputClass + ' w-24'}><option value="">Prioridade</option><option value="1">1</option><option value="2">2</option><option value="3">3</option></select>
            <Botao type="submit">Incluir no ciclo</Botao>
          </form>
        ))}
      </Cartao>
    </div>
  );
}
