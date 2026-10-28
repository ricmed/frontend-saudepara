import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi } from '../api';
import { numero, texto, useMpFiltro } from '../useMp';
import { Aviso, Botao, BotaoSecundario, Campo, Cartao, Celula, Formulario, inputClass, Linha, Tabela } from '../ui';

type Aba = 'comite' | 'capacitacoes' | 'profissionais' | 'liderancas';

export function GovernancaPage() {
  const { cicloId, estabelecimentoId, municipioId } = useMpFiltro();
  const [aba, setAba] = useState<Aba>('comite');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const queryClient = useQueryClient();
  const params = { cicloId, estabelecimentoId, limit: 100 };

  const comite = useQuery({ queryKey: ['mp-comite', cicloId], enabled: Boolean(cicloId), queryFn: () => microplanejamentoApi.listar<Record<string, unknown>>('comite', params) });
  const capacitacoes = useQuery({ queryKey: ['mp-cap', cicloId, estabelecimentoId], enabled: Boolean(cicloId), queryFn: () => microplanejamentoApi.listar<Record<string, unknown>>('capacitacoes', params) });
  const profissionais = useQuery({ queryKey: ['mp-prof', estabelecimentoId], enabled: Boolean(estabelecimentoId), queryFn: () => microplanejamentoApi.listar<Record<string, unknown>>('profissionais', { estabelecimentoId, limit: 100 }) });
  const liderancas = useQuery({ queryKey: ['mp-lid', estabelecimentoId], queryFn: () => microplanejamentoApi.listar<Record<string, unknown>>('liderancas', { estabelecimentoId, limit: 100 }) });
  const localidades = useQuery({ queryKey: ['mp-localidades', estabelecimentoId], enabled: Boolean(estabelecimentoId), queryFn: () => microplanejamentoApi.localidades({ estabelecimentoId, limit: 100 }) });

  const criar = useMutation({
    mutationFn: (vars: { recurso: string; body: unknown }) => microplanejamentoApi.criar(vars.recurso, vars.body),
    onSuccess: () => {
      setErro('');
      setOk('Registro gravado.');
      queryClient.invalidateQueries({ queryKey: ['mp-comite'] });
      queryClient.invalidateQueries({ queryKey: ['mp-cap'] });
      queryClient.invalidateQueries({ queryKey: ['mp-prof'] });
      queryClient.invalidateQueries({ queryKey: ['mp-lid'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const inativar = useMutation({
    mutationFn: (vars: { recurso: string; id: number }) => microplanejamentoApi.inativar(vars.recurso, vars.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mp-comite'] });
      queryClient.invalidateQueries({ queryKey: ['mp-cap'] });
      queryClient.invalidateQueries({ queryKey: ['mp-prof'] });
      queryClient.invalidateQueries({ queryKey: ['mp-lid'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });

  function enviar(recurso: string, body: unknown, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((recurso === 'comite' || recurso === 'capacitacoes') && !cicloId) return setErro('Selecione o ciclo.');
    if (recurso === 'comite' && !municipioId) return setErro('Selecione o município.');
    if (recurso === 'profissionais' && !estabelecimentoId) return setErro('Selecione a UBS.');
    criar.mutate({ recurso, body });
    event.currentTarget.reset();
  }

  const totais = (profissionais.data?.totais ?? {}) as Record<string, number>;
  const semLideranca = (localidades.data?.data ?? []).filter((local) =>
    !(liderancas.data?.data ?? []).some((lider) => Number(lider.localidade_id) === local.id),
  );

  return (
    <div className="space-y-4">
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <div className="flex flex-wrap gap-2">
        {([['comite', 'Comitê'], ['capacitacoes', 'Capacitações'], ['profissionais', 'Equipe'], ['liderancas', 'Lideranças']] as const).map(([id, rotulo]) => (
          <button key={id} type="button" onClick={() => setAba(id)} className={`rounded-full px-3 py-1 text-sm ${aba === id ? 'bg-blue-700 text-white' : 'bg-white border'}`}>{rotulo}</button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-4 text-sm">
        <Cartao titulo="Membros">{comite.data?.pagination?.total ?? comite.data?.data.length ?? 0}</Cartao>
        <Cartao titulo="Capacitações">{capacitacoes.data?.data.length ?? 0}</Cartao>
        <Cartao titulo="Vacinadores">{totais.vacinador ?? 0}</Cartao>
        <Cartao titulo="Sem liderança">{semLideranca.length}</Cartao>
      </div>

      {aba === 'comite' && (
        <Cartao titulo="Comitê">
          <Formulario onSubmit={(event) => {
            const form = new FormData(event.currentTarget);
            enviar('comite', {
              ciclo_id: cicloId,
              tipo_municipio_id: municipioId,
              estabelecimento_id: estabelecimentoId ?? null,
              nome: String(form.get('nome')),
              cargo: String(form.get('cargo')),
              responsabilidades: String(form.get('responsabilidades')),
              email: texto(form.get('email')) ?? '',
              telefone: texto(form.get('telefone')),
            }, event);
          }}>
            <Campo label="Nome"><input name="nome" required className={inputClass} /></Campo>
            <Campo label="Cargo"><input name="cargo" required className={inputClass} /></Campo>
            <Campo label="Responsabilidades"><input name="responsabilidades" required className={inputClass} /></Campo>
            <Campo label="E-mail"><input name="email" type="email" className={inputClass} /></Campo>
            <Campo label="Telefone"><input name="telefone" className={inputClass} /></Campo>
            <div className="md:col-span-2"><Botao type="submit">Incluir membro</Botao></div>
          </Formulario>
          <Lista linhas={comite.data?.data ?? []} colunas={['nome', 'cargo']} recurso="comite" onInativar={(id) => inativar.mutate({ recurso: 'comite', id })} />
        </Cartao>
      )}

      {aba === 'capacitacoes' && (
        <Cartao titulo="Capacitações">
          <Formulario onSubmit={(event) => {
            const form = new FormData(event.currentTarget);
            enviar('capacitacoes', {
              ciclo_id: cicloId,
              estabelecimento_id: estabelecimentoId ?? null,
              data: texto(form.get('data')),
              local: texto(form.get('local')),
              publico: texto(form.get('publico')),
              objetivo: texto(form.get('objetivo')),
              temas: texto(form.get('temas')),
              numero_participantes: form.get('participantes') ? numero(form.get('participantes')) : null,
              responsaveis: texto(form.get('responsaveis')),
              custo: numero(form.get('custo')),
            }, event);
          }}>
            <Campo label="Data"><input name="data" type="date" className={inputClass} /></Campo>
            <Campo label="Local"><input name="local" className={inputClass} /></Campo>
            <Campo label="Público"><input name="publico" className={inputClass} /></Campo>
            <Campo label="Objetivo"><input name="objetivo" className={inputClass} /></Campo>
            <Campo label="Temas"><input name="temas" className={inputClass} /></Campo>
            <Campo label="Participantes"><input name="participantes" type="number" min={0} className={inputClass} /></Campo>
            <Campo label="Responsáveis"><input name="responsaveis" className={inputClass} /></Campo>
            <Campo label="Custo"><input name="custo" type="number" min={0} step="0.01" className={inputClass} /></Campo>
            <div className="md:col-span-2"><Botao type="submit">Incluir capacitação</Botao></div>
          </Formulario>
          <Lista linhas={capacitacoes.data?.data ?? []} colunas={['data', 'local', 'publico']} recurso="capacitacoes" onInativar={(id) => inativar.mutate({ recurso: 'capacitacoes', id })} />
        </Cartao>
      )}

      {aba === 'profissionais' && (
        <Cartao titulo="Equipe">
          <p className="text-sm text-gray-600">Anotadores {totais.anotador ?? 0} · ACS {totais.acs ?? 0} · voluntários {totais.voluntario ?? 0} · MEV {totais.participa_mev ?? 0}</p>
          <Formulario onSubmit={(event) => {
            const form = new FormData(event.currentTarget);
            enviar('profissionais', {
              estabelecimento_id: estabelecimentoId,
              nome: String(form.get('nome')),
              lotacao: texto(form.get('lotacao')),
              telefone: texto(form.get('telefone')),
              email: texto(form.get('email')) ?? '',
              vacinador: form.get('vacinador') === 'on',
              anotador: form.get('anotador') === 'on',
              acs: form.get('acs') === 'on',
              voluntario: form.get('voluntario') === 'on',
              participa_mev: form.get('mev') === 'on',
            }, event);
          }}>
            <Campo label="Nome"><input name="nome" required className={inputClass} /></Campo>
            <Campo label="Lotação"><input name="lotacao" className={inputClass} /></Campo>
            <Campo label="Telefone"><input name="telefone" className={inputClass} /></Campo>
            <Campo label="E-mail"><input name="email" type="email" className={inputClass} /></Campo>
            <Campo label="Vacinador"><input name="vacinador" type="checkbox" /></Campo>
            <Campo label="Anotador"><input name="anotador" type="checkbox" /></Campo>
            <Campo label="ACS"><input name="acs" type="checkbox" /></Campo>
            <Campo label="Voluntário"><input name="voluntario" type="checkbox" /></Campo>
            <Campo label="Participa da MEV"><input name="mev" type="checkbox" /></Campo>
            <div className="md:col-span-2"><Botao type="submit">Incluir profissional</Botao></div>
          </Formulario>
          <Lista linhas={profissionais.data?.data ?? []} colunas={['nome', 'lotacao']} recurso="profissionais" onInativar={(id) => inativar.mutate({ recurso: 'profissionais', id })} />
        </Cartao>
      )}

      {aba === 'liderancas' && (
        <Cartao titulo="Lideranças">
          {semLideranca.length > 0 && <Aviso tipo="info">{semLideranca.length} localidade(s) sem liderança.</Aviso>}
          <Formulario onSubmit={(event) => {
            const form = new FormData(event.currentTarget);
            const tipos = ['COMUNITARIA', 'POLITICA', 'RELIGIOSA', 'OUTRA'].filter((tipo) => form.get(tipo) === 'on');
            if (tipos.length === 0) {
              event.preventDefault();
              return setErro('Marque ao menos um tipo de liderança.');
            }
            enviar('liderancas', {
              localidade_id: numero(form.get('localidade_id')),
              nome: String(form.get('nome')),
              tipos,
              telefone: texto(form.get('telefone')),
              email: texto(form.get('email')) ?? '',
              disponibilidade: texto(form.get('disponibilidade')),
              observacoes: texto(form.get('observacoes')),
            }, event);
          }}>
            <Campo label="Localidade">
              <select name="localidade_id" required className={inputClass}>
                <option value="">Selecione</option>
                {(localidades.data?.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </Campo>
            <Campo label="Nome"><input name="nome" required className={inputClass} /></Campo>
            {['COMUNITARIA', 'POLITICA', 'RELIGIOSA', 'OUTRA'].map((tipo) => <Campo key={tipo} label={tipo}><input name={tipo} type="checkbox" /></Campo>)}
            <Campo label="Telefone"><input name="telefone" className={inputClass} /></Campo>
            <Campo label="E-mail"><input name="email" type="email" className={inputClass} /></Campo>
            <Campo label="Disponibilidade"><input name="disponibilidade" className={inputClass} /></Campo>
            <Campo label="Observações"><input name="observacoes" className={inputClass} /></Campo>
            <div className="md:col-span-2"><Botao type="submit">Incluir liderança</Botao></div>
          </Formulario>
          <Lista linhas={liderancas.data?.data ?? []} colunas={['nome']} recurso="liderancas" onInativar={(id) => inativar.mutate({ recurso: 'liderancas', id })} />
        </Cartao>
      )}
    </div>
  );
}

function Lista({ linhas, colunas, onInativar }: { linhas: Record<string, unknown>[]; colunas: string[]; recurso: string; onInativar: (id: number) => void }) {
  if (linhas.length === 0) return <p className="text-sm text-gray-500">Nenhum registro.</p>;
  return (
    <Tabela colunas={[...colunas, '']}>
      {linhas.map((linha) => (
        <Linha key={String(linha.id)}>
          {colunas.map((coluna) => <Celula key={coluna}>{String(linha[coluna] ?? '—')}</Celula>)}
          <Celula><BotaoSecundario onClick={() => onInativar(Number(linha.id))}>Inativar</BotaoSecundario></Celula>
        </Linha>
      ))}
    </Tabela>
  );
}
