import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi, type Ciclo } from '../api';
import { FormularioCiclo, type DadosCiclo } from '../FormularioCiclo';
import { numero, texto, useMpFiltro } from '../useMp';
import { Aviso, Botao, BotaoSecundario, Campo, CampoCheck, Cartao, Celula, Formulario, inputClass, Linha, Tabela } from '../ui';

type Aba = 'ciclo' | 'sala' | 'localidade' | 'aporte';

export function LocalidadesPage() {
  const { cicloId, estabelecimentoId } = useMpFiltro();
  const queryClient = useQueryClient();
  const [aba, setAba] = useState<Aba>('ciclo');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const ciclo = useQuery({
    queryKey: ['mp-ciclos', 'detalhe', cicloId],
    enabled: Boolean(cicloId),
    queryFn: async () => {
      const resposta = await microplanejamentoApi.ciclos({ cicloId, limit: 1 });
      return resposta.data[0] as Ciclo | undefined;
    },
  });
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

  const atualizarCiclo = useMutation({
    mutationFn: (body: unknown) => microplanejamentoApi.atualizarCiclo(cicloId!, body),
    onSuccess: () => {
      ok('Ciclo atualizado.');
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

  function onCiclo(dados: DadosCiclo) {
    atualizarCiclo.mutate({
      nome: dados.nome,
      data_inicio: dados.data_inicio,
      data_fim: dados.data_fim,
      dias_operacionais: dados.dias_operacionais,
    });
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

  const abas = [
    ['ciclo', 'Ciclo'],
    ['sala', 'Sala de vacina'],
    ['localidade', 'Localidade da UBS'],
    ['aporte', 'Aporte no ciclo'],
  ] as const;

  return (
    <div className="space-y-4">
      {mensagem && <Aviso tipo="ok">{mensagem}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <div className="flex flex-wrap gap-2">
        {abas.map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id)}
            className={`rounded-full px-3 py-1 text-sm ${aba === id ? 'bg-blue-700 text-white' : 'bg-white border'}`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {aba === 'ciclo' && (
        <Cartao titulo="Ciclo">
          {ciclo.isLoading && <p className="text-sm text-gray-500">Carregando ciclo…</p>}
          {ciclo.isError && <Aviso tipo="erro">{apiErrorMessage(ciclo.error)}</Aviso>}
          {ciclo.data && (
            <FormularioCiclo
              key={ciclo.data.id}
              modo="editar"
              ciclo={ciclo.data}
              onSubmit={onCiclo}
              pending={atualizarCiclo.isPending}
            />
          )}
          {ciclo.isSuccess && !ciclo.data && <Aviso tipo="erro">Ciclo não encontrado.</Aviso>}
        </Cartao>
      )}

      {aba === 'sala' && (
        <Cartao titulo="Sala de vacina">
          {!estabelecimentoId ? <p className="text-sm text-gray-500">Selecione a UBS.</p> : (
            <Formulario onSubmit={onSala}>
              <CampoCheck label="Possui sala"><input name="possui" type="checkbox" defaultChecked={sala.data?.possui_sala_vacina} /></CampoCheck>
              <Campo label="Horário"><input name="horario" className={inputClass} defaultValue={sala.data?.horario_sala ?? ''} /></Campo>
              <Campo label="Telefone"><input name="telefone" className={inputClass} defaultValue={sala.data?.telefone ?? ''} /></Campo>
              <Campo label="E-mail"><input name="email" type="email" className={inputClass} defaultValue={sala.data?.email ?? ''} /></Campo>
              <Campo label="Responsável"><input name="responsavel" className={inputClass} defaultValue={sala.data?.responsavel ?? ''} /></Campo>
              <div className="md:col-span-2"><Botao type="submit">Gravar sala</Botao></div>
            </Formulario>
          )}
        </Cartao>
      )}

      {aba === 'localidade' && (
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
            <CampoCheck label="Dificuldade de acesso"><input name="dificuldade" type="checkbox" /></CampoCheck>
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
      )}

      {aba === 'aporte' && (
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
      )}
    </div>
  );
}
