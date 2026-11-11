import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi, type Fofa } from '../api';
import { somarPopulacaoUbs } from '../populacaoUbs';
import { texto, useMpFiltro } from '../useMp';
import { Aviso, Botao, Campo, CampoCheck, Cartao, inputClass } from '../ui';

const VUL = [
  ['vul_fronteira', 'Fronteira'],
  ['vul_concentracao', 'Alta concentração'],
  ['vul_seguranca', 'Segurança'],
  ['vul_assentamento', 'Assentamento ou periferia'],
  ['vul_migracao', 'Migração'],
  ['vul_turismo', 'Turismo'],
  ['vul_acesso', 'Dificuldade de acesso'],
  ['vul_polos', 'Polos de circulação'],
] as const;

const IND = [
  ['ind_cobertura_95', 'Cobertura dos esquemas ≥ 95%'],
  ['ind_abandono_penta', 'Abandono da pentavalente ≥ 5%'],
  ['ind_abandono_triplice', 'Abandono da tríplice viral ≥ 5%'],
  ['ind_abandono_polio', 'Abandono da pólio ≥ 5%'],
  ['ind_silencio', 'Silêncio epidemiológico'],
] as const;

function opcaoIndicador(valor: boolean | null | undefined) {
  if (valor === true) return 'sim';
  if (valor === false) return 'nao';
  return '';
}

export function DiagnosticoPage() {
  const { cicloId, estabelecimentoId, localidadeId } = useMpFiltro();
  const queryClient = useQueryClient();
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const riscos = useQuery({
    queryKey: ['mp-riscos', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.riscos(cicloId!),
  });
  const aporte = useQuery({
    queryKey: ['mp-localidades-ciclo', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId && estabelecimentoId),
    queryFn: () => microplanejamentoApi.localidadesCiclo(cicloId!, estabelecimentoId),
  });
  const fofa = useQuery({
    queryKey: ['mp-fofa', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.fofa(cicloId!, estabelecimentoId),
  });
  const salvarRisco = useMutation({
    mutationFn: microplanejamentoApi.salvarRisco,
    onSuccess: () => {
      setOk('Risco calculado e gravado.');
      setErro('');
      queryClient.invalidateQueries({ queryKey: ['mp-riscos'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const salvarFofa = useMutation({
    mutationFn: microplanejamentoApi.salvarFofa,
    onSuccess: () => {
      setOk('FOFA gravada.');
      setErro('');
      queryClient.invalidateQueries({ queryKey: ['mp-fofa'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });

  const atual = (riscos.data?.data ?? []).find((item) => item.estabelecimento_id === estabelecimentoId);
  const populacao = somarPopulacaoUbs((aporte.data?.data ?? [])
    .filter((linha) => !localidadeId || linha.localidade_id === localidadeId)
    .map((linha) => ({ populacao_alvo: linha.populacao_alvo, zona: linha.localidade.zona })));
  const populacaoPronta = Boolean(estabelecimentoId) && aporte.isSuccess;

  function onRisco(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cicloId || !estabelecimentoId) return setErro('Selecione ciclo e UBS.');
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = {
      ciclo_id: cicloId,
      estabelecimento_id: estabelecimentoId,
      pop_urbana: populacaoPronta ? populacao.urbana : (atual?.pop_urbana ?? 0),
      pop_rural: populacaoPronta ? populacao.rural : (atual?.pop_rural ?? 0),
    };
    for (const [chave] of VUL) body[chave] = form.get(chave) === 'on';
    for (const [chave] of IND) {
      const valor = String(form.get(chave) || '');
      body[chave] = valor === '' ? null : valor === 'sim';
    }
    salvarRisco.mutate(body);
  }

  return (
    <div className="space-y-4">
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Cartao titulo="Risco da UBS">
        {atual && <p className="text-sm">Pontos {atual.pontos} · faixa {atual.faixa ?? '—'}</p>}
        <form key={atual ? `${atual.id}-${atual.updated_at}` : 'novo'} onSubmit={onRisco} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {VUL.map(([chave, rotulo]) => (
              <CampoCheck key={chave} label={rotulo}>
                <input name={chave} type="checkbox" defaultChecked={atual?.[chave] === true} />
              </CampoCheck>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {IND.slice(0, 4).map(([chave, rotulo]) => (
              <Campo key={chave} label={rotulo}>
                <select name={chave} className={inputClass} defaultValue={opcaoIndicador(atual?.[chave])}>
                  <option value="">Não informado</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </Campo>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {IND.slice(4).map(([chave, rotulo]) => (
              <Campo key={chave} label={rotulo}>
                <select name={chave} className={inputClass} defaultValue={opcaoIndicador(atual?.[chave])}>
                  <option value="">Não informado</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </Campo>
            ))}
          </div>
          <Botao type="submit">Calcular e gravar risco</Botao>
        </form>
      </Cartao>
      <Cartao titulo="FOFA">
        <div className="grid gap-3 md:grid-cols-2">
          {(fofa.data?.data ?? []).map((linha) => (
            <FofaBloco
              key={linha.id}
              linha={linha}
              componentes={fofa.data?.componentes ?? []}
              cicloId={cicloId}
              estabelecimentoId={estabelecimentoId}
              onSave={(body) => salvarFofa.mutate(body)}
            />
          ))}
        </div>
        {(fofa.data?.data.length ?? 0) === 0 && <p className="text-sm text-gray-500">Selecione o ciclo para abrir os seis componentes.</p>}
      </Cartao>
    </div>
  );
}

const CAMPOS_FOFA = [
  ['forca', 'Força'],
  ['oportunidade', 'Oportunidade'],
  ['fragilidade', 'Fragilidade'],
  ['ameaca', 'Ameaça'],
  ['estrategia', 'Estratégia'],
  ['licao', 'Lição'],
] as const;

function FofaBloco({ linha, componentes, cicloId, estabelecimentoId, onSave }: {
  linha: Fofa;
  componentes: { codigo: string; texto: string }[];
  cicloId?: number;
  estabelecimentoId?: number;
  onSave: (body: unknown) => void;
}) {
  const titulo = componentes.find((item) => item.codigo === linha.componente_codigo)?.texto ?? linha.componente_codigo;
  const campos = linha as unknown as Record<string, string | null>;
  return (
    <form className="border rounded-md p-3 space-y-2" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSave({
        ciclo_id: cicloId,
        estabelecimento_id: estabelecimentoId ?? null,
        componente_codigo: linha.componente_codigo,
        forca: texto(form.get('forca')),
        oportunidade: texto(form.get('oportunidade')),
        fragilidade: texto(form.get('fragilidade')),
        ameaca: texto(form.get('ameaca')),
        estrategia: texto(form.get('estrategia')),
        licao: texto(form.get('licao')),
      });
    }}>
      <h3 className="font-medium">{titulo}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {CAMPOS_FOFA.map(([campo, rotulo]) => (
          <Campo key={campo} label={rotulo}>
            <textarea name={campo} defaultValue={campos[campo] ?? ''} className={inputClass} rows={2} />
          </Campo>
        ))}
      </div>
      <Botao type="submit">Gravar componente</Botao>
    </form>
  );
}
