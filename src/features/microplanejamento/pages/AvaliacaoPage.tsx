import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi } from '../api';
import { numero, texto, useMpFiltro } from '../useMp';
import { Aviso, Botao, BotaoSecundario, Campo, Cartao, Celula, Formulario, inputClass, Linha, Tabela } from '../ui';

export function AvaliacaoPage() {
  const { cicloId } = useMpFiltro();
  const queryClient = useQueryClient();
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const planos = useQuery({
    queryKey: ['mp-planos', cicloId],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.listar<Record<string, unknown>>('planos', { cicloId, limit: 100 }),
  });
  const alertas = useQuery({
    queryKey: ['mp-alertas', cicloId],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.alertas(cicloId!),
  });
  const painel = useQuery({
    queryKey: ['mp-painel', cicloId],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.painel(cicloId!),
  });
  const salvar = useMutation({
    mutationFn: microplanejamentoApi.salvarAvaliacao,
    onSuccess: () => {
      setOk('Avaliação gravada.');
      queryClient.invalidateQueries({ queryKey: ['mp-planos'] });
      queryClient.invalidateQueries({ queryKey: ['mp-alertas'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });
  const atualizar = useMutation({
    mutationFn: (vars: { id: number; status: string }) => microplanejamentoApi.atualizarAlerta(vars.id, vars.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mp-alertas'] }),
    onError: (error) => setErro(apiErrorMessage(error)),
  });

  function onAvaliacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    salvar.mutate({
      plano_id: numero(form.get('plano_id')),
      data_encerramento: texto(form.get('data')),
      meta: numero(form.get('meta')),
      alcance: texto(form.get('alcance')),
      recusas: numero(form.get('recusas')),
      ausentes: numero(form.get('ausentes')),
      perdas: numero(form.get('perdas')),
      motivos: texto(form.get('motivos')),
      licoes: texto(form.get('licoes')),
      recomendacao: texto(form.get('recomendacao')),
      reprogramacao: texto(form.get('reprogramacao')),
    });
  }

  return (
    <div className="space-y-4">
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Cartao titulo="Índice composto">
        {(painel.data?.prioridades.length ?? 0) === 0 ? <p className="text-sm text-gray-500">O índice aparece depois que o ciclo tem localidades e dados de execução.</p> : (
          <Tabela colunas={['Localidade', 'Faixa', 'Índice']}>
            {(painel.data?.prioridades ?? []).map((item, index) => (
              <Linha key={index}>
                <Celula>{item.localidade.nome}</Celula>
                <Celula>{item.faixa}</Celula>
                <Celula>{item.total}</Celula>
              </Linha>
            ))}
          </Tabela>
        )}
      </Cartao>
      <Cartao titulo="Avaliação do plano">
        <Formulario onSubmit={onAvaliacao}>
          <Campo label="Plano">
            <select name="plano_id" required className={inputClass}>
              {(planos.data?.data ?? []).map((plano) => <option key={String(plano.id)} value={String(plano.id)}>{String(plano.acao)}</option>)}
            </select>
          </Campo>
          <Campo label="Encerramento"><input name="data" type="date" className={inputClass} /></Campo>
          <Campo label="Meta"><input name="meta" type="number" min={0} required className={inputClass} /></Campo>
          <Campo label="Alcance"><input name="alcance" className={inputClass} /></Campo>
          <Campo label="Recusas"><input name="recusas" type="number" min={0} className={inputClass} /></Campo>
          <Campo label="Ausentes"><input name="ausentes" type="number" min={0} className={inputClass} /></Campo>
          <Campo label="Perdas"><input name="perdas" type="number" min={0} className={inputClass} /></Campo>
          <Campo label="Motivos"><input name="motivos" className={inputClass} /></Campo>
          <Campo label="Lições"><input name="licoes" className={inputClass} /></Campo>
          <Campo label="Recomendação"><input name="recomendacao" className={inputClass} /></Campo>
          <Campo label="Reprogramação"><input name="reprogramacao" className={inputClass} /></Campo>
          <div className="md:col-span-2"><Botao type="submit">Gravar avaliação</Botao></div>
        </Formulario>
        <p className="text-sm text-gray-600">O realizado, quando omitido, é lido da execução. Encerrar o plano exige esta ficha, local, responsável e período.</p>
      </Cartao>
      <Cartao titulo="Alertas">
        {(alertas.data?.data.length ?? 0) === 0 && <p className="text-sm text-gray-500">Nenhum alerta neste ciclo.</p>}
        <Tabela colunas={['Código', 'Texto', 'Status', '']}>
          {(alertas.data?.data ?? []).map((alerta) => (
            <Linha key={alerta.id}>
              <Celula>{alerta.codigo}</Celula>
              <Celula>{alerta.texto}</Celula>
              <Celula>{alerta.status}</Celula>
              <Celula>
                <div className="flex gap-1">
                  {['EM_ANALISE', 'TRATADO', 'ENCERRADO'].map((status) => (
                    <BotaoSecundario key={status} onClick={() => atualizar.mutate({ id: alerta.id, status })}>{status}</BotaoSecundario>
                  ))}
                </div>
              </Celula>
            </Linha>
          ))}
        </Tabela>
      </Cartao>
    </div>
  );
}
