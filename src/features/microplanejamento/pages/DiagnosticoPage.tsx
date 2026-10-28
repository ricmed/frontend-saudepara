import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi, type Fofa } from '../api';
import { numero, texto, useMpFiltro } from '../useMp';
import { Aviso, Botao, Campo, CampoCheck, Cartao, Formulario, inputClass } from '../ui';

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

export function DiagnosticoPage() {
  const { cicloId, estabelecimentoId } = useMpFiltro();
  const queryClient = useQueryClient();
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const riscos = useQuery({
    queryKey: ['mp-riscos', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.riscos(cicloId!),
  });
  const fofa = useQuery({
    queryKey: ['mp-fofa', cicloId, estabelecimentoId],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.fofa(cicloId!, estabelecimentoId),
  });
  const localidades = useQuery({
    queryKey: ['mp-localidades', estabelecimentoId],
    enabled: Boolean(estabelecimentoId),
    queryFn: () => microplanejamentoApi.localidades({ estabelecimentoId, limit: 100 }),
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

  function onRisco(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cicloId || !estabelecimentoId) return setErro('Selecione ciclo e UBS.');
    const form = new FormData(event.currentTarget);
    const localidade_ids = (localidades.data?.data ?? [])
      .filter((item) => form.get(`loc-${item.id}`) === 'on')
      .map((item) => item.id);
    const body: Record<string, unknown> = {
      ciclo_id: cicloId,
      estabelecimento_id: estabelecimentoId,
      pop_urbana: numero(form.get('pop_urbana')),
      pop_rural: numero(form.get('pop_rural')),
      localidade_ids,
    };
    for (const [chave] of VUL) body[chave] = form.get(chave) === 'on';
    for (const [chave] of IND) {
      const valor = String(form.get(chave) || '');
      body[chave] = valor === '' ? null : valor === 'sim';
    }
    salvarRisco.mutate(body);
  }

  const atual = (riscos.data?.data ?? []).find((item) => item.estabelecimento_id === estabelecimentoId);

  return (
    <div className="space-y-4">
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Cartao titulo="Risco da UBS">
        {atual && <p className="text-sm">Pontos {atual.pontos} · faixa {atual.faixa ?? '—'}</p>}
        <Formulario onSubmit={onRisco}>
          <Campo label="População urbana"><input name="pop_urbana" type="number" min={0} required className={inputClass} defaultValue={atual?.pop_urbana ?? 0} /></Campo>
          <Campo label="População rural"><input name="pop_rural" type="number" min={0} required className={inputClass} defaultValue={atual?.pop_rural ?? 0} /></Campo>
          {VUL.map(([chave, rotulo]) => <CampoCheck key={chave} label={rotulo}><input name={chave} type="checkbox" /></CampoCheck>)}
          {IND.map(([chave, rotulo]) => (
            <Campo key={chave} label={rotulo}>
              <select name={chave} className={inputClass}>
                <option value="">Não informado</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </Campo>
          ))}
          <div className="md:col-span-2 space-y-1">
            <p className="text-sm font-medium">Localidades vinculadas</p>
            {(localidades.data?.data ?? []).map((item) => (
              <CampoCheck key={item.id} label={item.nome}><input type="checkbox" name={`loc-${item.id}`} /></CampoCheck>
            ))}
          </div>
          <div className="md:col-span-2"><Botao type="submit">Calcular e gravar risco</Botao></div>
        </Formulario>
      </Cartao>
      <Cartao titulo="FOFA">
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
        {(fofa.data?.data.length ?? 0) === 0 && <p className="text-sm text-gray-500">Selecione o ciclo para abrir os seis componentes.</p>}
      </Cartao>
    </div>
  );
}

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
      {['forca', 'oportunidade', 'fragilidade', 'ameaca', 'estrategia', 'licao'].map((campo) => (
        <textarea key={campo} name={campo} defaultValue={campos[campo] ?? ''} placeholder={campo} className={inputClass} rows={2} />
      ))}
      <Botao type="submit">Gravar componente</Botao>
    </form>
  );
}
