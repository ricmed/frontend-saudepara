import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi } from '../api';
import { Aviso, Botao, Campo, Cartao, Celula, Formulario, inputClass, Linha, Tabela } from '../ui';

export function ParametrosPage() {
  const queryClient = useQueryClient();
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const parametros = useQuery({ queryKey: ['mp-param'], queryFn: () => microplanejamentoApi.parametros() });
  const auditoria = useQuery({ queryKey: ['mp-aud'], queryFn: () => microplanejamentoApi.auditoria({ limit: 50 }) });
  const publicar = useMutation({
    mutationFn: microplanejamentoApi.publicarParametro,
    onSuccess: () => {
      setOk('Nova versão publicada. A anterior permanece no histórico e deixa de valer.');
      queryClient.invalidateQueries({ queryKey: ['mp-param'] });
      queryClient.invalidateQueries({ queryKey: ['mp-aud'] });
    },
    onError: (error) => setErro(apiErrorMessage(error)),
  });

  function onPublicar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let valor: Record<string, unknown>;
    try {
      valor = JSON.parse(String(form.get('valor') || '{}')) as Record<string, unknown>;
    } catch {
      setErro('O valor precisa ser um JSON.');
      return;
    }
    publicar.mutate({
      chave: String(form.get('chave') || '').trim(),
      vigencia_inicio: String(form.get('vigencia')),
      valor,
    });
  }

  return (
    <div className="space-y-4">
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Cartao titulo="Parâmetros vigentes">
        <Formulario onSubmit={onPublicar}>
          <Campo label="Chave"><input name="chave" required className={inputClass} placeholder="pesos_priorizacao" /></Campo>
          <Campo label="Vigência"><input name="vigencia" type="date" required className={inputClass} /></Campo>
          <Campo label="Valor JSON"><textarea name="valor" required className={inputClass} rows={4} placeholder='{"cobertura":35,"naoVacinados":25,"acesso":15,"capacidade":10,"logistica":10,"comunicacao":5}' /></Campo>
          <div className="md:col-span-2"><Botao type="submit">Publicar versão</Botao></div>
        </Formulario>
        <Tabela colunas={['Chave', 'Versão', 'Valor']}>
          {(parametros.data?.data ?? []).map((item) => (
            <Linha key={item.id}>
              <Celula>{item.chave}</Celula>
              <Celula>{item.versao}</Celula>
              <Celula><code className="text-xs">{JSON.stringify(item.valor)}</code></Celula>
            </Linha>
          ))}
        </Tabela>
      </Cartao>
      <Cartao titulo="Auditoria">
        {(auditoria.data?.data.length ?? 0) === 0 && <p className="text-sm text-gray-500">Nenhum evento no escopo.</p>}
        <Tabela colunas={['Quando', 'Entidade', 'Operação']}>
          {(auditoria.data?.data ?? []).map((item) => (
            <Linha key={item.id}>
              <Celula>{String(item.created_at).slice(0, 19)}</Celula>
              <Celula>{item.entidade} {item.entidade_id}</Celula>
              <Celula>{item.operacao}</Celula>
            </Linha>
          ))}
        </Tabela>
      </Cartao>
    </div>
  );
}
