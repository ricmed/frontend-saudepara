import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi, type Ciclo, type Localidade } from '../api';
import { CampoUbs } from '../FiltrosTerritorio';
import { FormularioCiclo, type DadosCiclo } from '../FormularioCiclo';
import { numero, texto, useEstabelecimentoSelecionado, useMpFiltro, useUbsDoCiclo } from '../useMp';
import { Aviso, Botao, BotaoSecundario, Campo, CampoCheck, Cartao, Celula, Formulario, inputClass, Linha, Modal, Tabela } from '../ui';

type AbaUbs = 'sala' | 'localidade' | 'aporte';
type ModalLocalidade = { modo: 'criar' } | { modo: 'ver' | 'editar'; localidade: Localidade };

const ZONA_ROTULO: Record<string, string> = { URBANA: 'Urbana', RURAL: 'Rural' };

function FormularioLocalidade({
  modo,
  localidade,
  onSubmit,
  onEditar,
  pending,
}: {
  modo: 'criar' | 'editar' | 'ver';
  localidade?: Localidade;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEditar?: () => void;
  pending?: boolean;
}) {
  const leitura = modo === 'ver';
  return (
    <Formulario onSubmit={leitura ? (event) => event.preventDefault() : onSubmit}>
      <Campo label="Nome"><input name="nome" required className={inputClass} defaultValue={localidade?.nome ?? ''} disabled={leitura} readOnly={leitura} /></Campo>
      <Campo label="Bairro ou comunidade"><input name="bairro" className={inputClass} defaultValue={localidade?.bairro ?? ''} disabled={leitura} readOnly={leitura} /></Campo>
      <Campo label="Zona">
        <select name="zona" className={inputClass} defaultValue={localidade?.zona ?? ''} disabled={leitura}>
          <option value="">—</option>
          <option value="URBANA">Urbana</option>
          <option value="RURAL">Rural</option>
        </select>
      </Campo>
      <Campo label="Tipo de território"><input name="tipo_territorio" className={inputClass} defaultValue={localidade?.tipo_territorio ?? ''} disabled={leitura} readOnly={leitura} /></Campo>
      <Campo label="Domicílios"><input name="domicilios" type="number" min={0} className={inputClass} defaultValue={localidade?.domicilios ?? ''} disabled={leitura} readOnly={leitura} /></Campo>
      <Campo label="Escolas e instituições"><input name="escolas" className={inputClass} defaultValue={localidade?.escolas ?? ''} disabled={leitura} readOnly={leitura} /></Campo>
      <CampoCheck label="Dificuldade de acesso">
        <input name="dificuldade" type="checkbox" defaultChecked={localidade?.dificuldade_acesso} disabled={leitura} />
      </CampoCheck>
      <Campo label="Descrição do acesso"><input name="descricao_acesso" className={inputClass} defaultValue={localidade?.descricao_acesso ?? ''} disabled={leitura} readOnly={leitura} /></Campo>
      <div className="md:col-span-2 flex flex-wrap gap-2">
        {leitura ? (
          <Botao type="button" onClick={onEditar}>Editar</Botao>
        ) : (
          <Botao type="submit" disabled={pending}>{modo === 'criar' ? 'Gravar localidade' : 'Salvar localidade'}</Botao>
        )}
      </div>
    </Formulario>
  );
}

export function LocalidadesPage() {
  const { cicloId, estabelecimentoId, setFiltro } = useMpFiltro();
  const queryClient = useQueryClient();
  const [aba, setAba] = useState<AbaUbs>('localidade');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [modal, setModal] = useState<ModalLocalidade | null>(null);

  const ciclo = useQuery({
    queryKey: ['mp-ciclos', 'detalhe', cicloId],
    enabled: Boolean(cicloId),
    queryFn: async () => {
      const resposta = await microplanejamentoApi.ciclos({ cicloId, limit: 1 });
      return resposta.data[0] as Ciclo | undefined;
    },
  });
  const { ubs, isLoading: carregandoUbs } = useUbsDoCiclo(cicloId);
  const ubsSelecionada = useEstabelecimentoSelecionado(estabelecimentoId);
  const localidades = useQuery({
    queryKey: ['mp-localidades', estabelecimentoId],
    enabled: Boolean(estabelecimentoId),
    queryFn: () => microplanejamentoApi.localidades({ estabelecimentoId, limit: 100 }),
  });
  const doCiclo = useQuery({
    queryKey: ['mp-localidades-ciclo', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId && estabelecimentoId),
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

  function escolherUbs(id: number | null) {
    setFiltro('estabelecimentoId', id ? String(id) : '');
    if (id) setAba('localidade');
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
      setModal(null);
      queryClient.invalidateQueries({ queryKey: ['mp-localidades'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const atualizarLocalidade = useMutation({
    mutationFn: (vars: { id: number; body: unknown }) => microplanejamentoApi.atualizarLocalidade(vars.id, vars.body),
    onSuccess: () => {
      ok('Localidade atualizada.');
      setModal(null);
      queryClient.invalidateQueries({ queryKey: ['mp-localidades'] });
      queryClient.invalidateQueries({ queryKey: ['mp-localidades-ciclo'] });
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
    onSuccess: () => {
      ok('Localidade excluída.');
      queryClient.invalidateQueries({ queryKey: ['mp-localidades'] });
      queryClient.invalidateQueries({ queryKey: ['mp-localidades-ciclo'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });

  function onCiclo(dados: DadosCiclo) {
    atualizarCiclo.mutate({
      nome: dados.nome,
      status: dados.status,
      data_inicio: dados.data_inicio,
      data_fim: dados.data_fim,
      dias_operacionais: dados.dias_operacionais,
    });
  }

  function corpoLocalidade(form: FormData) {
    return {
      estabelecimento_id: estabelecimentoId,
      nome: String(form.get('nome') || '').trim(),
      bairro: texto(form.get('bairro')),
      zona: texto(form.get('zona')),
      tipo_territorio: texto(form.get('tipo_territorio')),
      domicilios: form.get('domicilios') ? numero(form.get('domicilios')) : null,
      escolas: texto(form.get('escolas')),
      dificuldade_acesso: form.get('dificuldade') === 'on',
      descricao_acesso: texto(form.get('descricao_acesso')),
    };
  }

  function onLocalidade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!estabelecimentoId) return setErro('Selecione a UBS.');
    const body = corpoLocalidade(new FormData(event.currentTarget));
    if (modal?.modo === 'editar') atualizarLocalidade.mutate({ id: modal.localidade.id, body });
    else criarLocalidade.mutate(body);
  }

  function onExcluir(item: Localidade) {
    if (!window.confirm(`Excluir a localidade “${item.nome}”? Ela deixa de aparecer na listagem.`)) return;
    inativar.mutate(item.id);
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
    ['sala', 'Sala de vacina'],
    ['localidade', 'Localidade da UBS'],
    ['aporte', 'Aporte no ciclo'],
  ] as const;
  const ubsNoCiclo = estabelecimentoId ? ubs.some((item) => item.idestabelecimento === estabelecimentoId) : false;

  return (
    <div className="space-y-4">
      {mensagem && <Aviso tipo="ok">{mensagem}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}

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

      <Cartao titulo="UBSs deste ciclo">
        <CampoUbs
          label="Incluir UBS"
          municipioId={ciclo.data?.tipo_municipio_id}
          selecionado={ubsSelecionada.data}
          onEscolher={escolherUbs}
        />
        {carregandoUbs && <p className="text-sm text-gray-500">Carregando UBSs…</p>}
        {!carregandoUbs && ubs.length === 0 && (
          <p className="text-sm text-gray-500">
            Nenhuma UBS neste ciclo. Inclua uma unidade e grave ao menos uma localidade no aporte.
          </p>
        )}
        {ubs.length > 0 && (
          <Tabela colunas={['Nome', 'CNES', 'Localidades']}>
            {ubs.map((item) => (
              <Linha
                key={item.idestabelecimento}
                selecionada={item.idestabelecimento === estabelecimentoId}
                onClick={() => escolherUbs(item.idestabelecimento)}
              >
                <Celula>{item.nome}</Celula>
                <Celula>{item.cnes ?? '—'}</Celula>
                <Celula>{item.localidades}</Celula>
              </Linha>
            ))}
          </Tabela>
        )}
        {estabelecimentoId && !ubsNoCiclo && (
          <p className="text-sm text-gray-500">
            A UBS entra na lista depois de gravar ao menos uma localidade no ciclo, na aba Aporte.
          </p>
        )}
      </Cartao>

      {estabelecimentoId && (
        <>
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

          {aba === 'sala' && (
            <Cartao titulo="Sala de vacina">
              <Formulario key={estabelecimentoId} onSubmit={onSala}>
                <CampoCheck label="Possui sala"><input name="possui" type="checkbox" defaultChecked={sala.data?.possui_sala_vacina} /></CampoCheck>
                <Campo label="Horário"><input name="horario" className={inputClass} defaultValue={sala.data?.horario_sala ?? ''} /></Campo>
                <Campo label="Telefone"><input name="telefone" className={inputClass} defaultValue={sala.data?.telefone ?? ''} /></Campo>
                <Campo label="E-mail"><input name="email" type="email" className={inputClass} defaultValue={sala.data?.email ?? ''} /></Campo>
                <Campo label="Responsável"><input name="responsavel" className={inputClass} defaultValue={sala.data?.responsavel ?? ''} /></Campo>
                <div className="md:col-span-2"><Botao type="submit">Gravar sala</Botao></div>
              </Formulario>
            </Cartao>
          )}

          {aba === 'localidade' && (
            <>
              <Cartao
                titulo="Localidade da UBS"
                acoes={<Botao onClick={() => { setErro(''); setModal({ modo: 'criar' }); }}>Nova localidade</Botao>}
              >
                {localidades.isLoading ? (
                  <p className="text-sm text-gray-500">Carregando localidades…</p>
                ) : (localidades.data?.data.length ?? 0) === 0 ? (
                  <Aviso tipo="info">Nenhuma localidade nesta UBS. Use Nova localidade para cadastrar.</Aviso>
                ) : (
                  <Tabela colunas={['Nome', 'Bairro', 'Zona', '']}>
                    {(localidades.data?.data ?? []).map((item) => (
                      <Linha key={item.id}>
                        <Celula>{item.nome}</Celula>
                        <Celula>{item.bairro || '—'}</Celula>
                        <Celula>{item.zona ? (ZONA_ROTULO[item.zona] ?? item.zona) : '—'}</Celula>
                        <Celula>
                          <div className="flex flex-wrap gap-2">
                            <BotaoSecundario onClick={() => { setErro(''); setModal({ modo: 'ver', localidade: item }); }}>Ver</BotaoSecundario>
                            <BotaoSecundario onClick={() => { setErro(''); setModal({ modo: 'editar', localidade: item }); }}>Editar</BotaoSecundario>
                            <BotaoSecundario onClick={() => onExcluir(item)} disabled={inativar.isPending}>Excluir</BotaoSecundario>
                          </div>
                        </Celula>
                      </Linha>
                    ))}
                  </Tabela>
                )}
              </Cartao>
              {modal && (
                <Modal
                  titulo={modal.modo === 'ver' ? 'Detalhe da localidade' : modal.modo === 'editar' ? 'Editar localidade' : 'Nova localidade'}
                  onFechar={() => setModal(null)}
                >
                  {erro && <Aviso tipo="erro">{erro}</Aviso>}
                  <FormularioLocalidade
                    key={`${modal.modo}-${modal.modo === 'criar' ? 'novo' : modal.localidade.id}`}
                    modo={modal.modo}
                    localidade={modal.modo === 'criar' ? undefined : modal.localidade}
                    onSubmit={onLocalidade}
                    onEditar={modal.modo === 'ver' ? () => setModal({ modo: 'editar', localidade: modal.localidade }) : undefined}
                    pending={criarLocalidade.isPending || atualizarLocalidade.isPending}
                  />
                </Modal>
              )}
            </>
          )}

          {aba === 'aporte' && (
            <Cartao titulo="Aporte no ciclo">
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
              {(localidades.data?.data ?? []).filter((item) => !(doCiclo.data?.data ?? []).some((linha) => linha.localidade_id === item.id)).map((item) => (
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
        </>
      )}
    </div>
  );
}
