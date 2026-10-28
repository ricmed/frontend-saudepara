import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, microplanejamentoApi, type Ciclo } from '../api';
import { FormularioCiclo, type DadosCiclo } from '../FormularioCiclo';
import { useMpFiltro } from '../useMp';
import { Aviso, Botao, BotaoSecundario, Cartao, Celula, Linha, Modal, Tabela } from '../ui';

const LIMITE = 50;

const ESTRATEGIA: Record<string, string> = {
  ROTINA: 'Rotina',
  INTENSIFICACAO: 'Intensificação',
  CAMPANHA: 'Campanha',
  MULTIVACINACAO: 'Multivacinação',
  BLOQUEIO: 'Bloqueio',
};

const STATUS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  EM_VALIDACAO: 'Em validação',
  APROVADO: 'Aprovado',
  EM_EXECUCAO: 'Em execução',
  ENCERRADO: 'Encerrado',
};

function rotulo(mapa: Record<string, string>, valor: string) {
  return mapa[valor] ?? valor;
}

function dataBr(valor?: string | null) {
  if (!valor) return '—';
  const iso = String(valor).slice(0, 10);
  const [ano, mes, dia] = iso.split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

export function InicioPage() {
  const { cicloId, estabelecimentoId, municipioId, irParaCiclo } = useMpFiltro();
  const queryClient = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [municipioModal, setMunicipioModal] = useState<number | undefined>(municipioId);
  const [erroModal, setErroModal] = useState('');

  useEffect(() => {
    setPagina(1);
  }, [municipioId, estabelecimentoId, cicloId]);

  const health = useQuery({
    queryKey: ['mp-health'],
    queryFn: () => microplanejamentoApi.health(),
  });
  const ciclos = useQuery({
    queryKey: ['mp-ciclos', municipioId, estabelecimentoId, cicloId, pagina],
    queryFn: () =>
      microplanejamentoApi.ciclos({
        municipioId,
        estabelecimentoId,
        cicloId,
        page: pagina,
        limit: LIMITE,
      }),
  });

  const lista = ciclos.data?.data ?? [];
  const paginacao = ciclos.data?.pagination;
  const total = paginacao?.total ?? lista.length;
  const paginas = paginacao?.pages ?? 1;

  const criarCiclo = useMutation({
    mutationFn: (body: unknown) => microplanejamentoApi.criarCiclo(body),
    onSuccess: (ciclo: Ciclo) => {
      queryClient.invalidateQueries({ queryKey: ['mp-ciclos'] });
      setModalAberto(false);
      setErroModal('');
      irParaCiclo(ciclo);
    },
    onError: (error) => setErroModal(apiErrorMessage(error)),
  });

  function abrirModal() {
    setMunicipioModal(municipioId);
    setErroModal('');
    setModalAberto(true);
  }

  function onCriar(dados: DadosCiclo) {
    criarCiclo.mutate(dados);
  }

  return (
    <div className="space-y-4">
      {health.isError && <Aviso tipo="erro">{apiErrorMessage(health.error)}</Aviso>}
      {ciclos.isError && <Aviso tipo="erro">{apiErrorMessage(ciclos.error)}</Aviso>}

      <Cartao
        titulo="Ciclos cadastrados"
        acoes={(
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{total} registro{total === 1 ? '' : 's'}</span>
            <Botao onClick={abrirModal}>Novo ciclo</Botao>
          </div>
        )}
      >
        {ciclos.isLoading ? (
          <p className="text-sm text-gray-500">Carregando ciclos…</p>
        ) : lista.length === 0 ? (
          <Aviso tipo="info">Nenhum ciclo encontrado para os filtros selecionados. Use Novo ciclo para cadastrar.</Aviso>
        ) : (
          <>
            <Tabela colunas={['Ano', 'Nome', 'Estratégia', 'Município', 'Status', 'Início', 'Fim', 'Dias', '']}>
              {lista.map((ciclo) => (
                <Linha key={ciclo.id}>
                  <Celula>{ciclo.ano}</Celula>
                  <Celula>{ciclo.nome}</Celula>
                  <Celula>{rotulo(ESTRATEGIA, ciclo.estrategia)}</Celula>
                  <Celula>{ciclo.tipo_municipio?.descricao ?? '—'}</Celula>
                  <Celula>{rotulo(STATUS, ciclo.status)}</Celula>
                  <Celula>{dataBr(ciclo.data_inicio)}</Celula>
                  <Celula>{dataBr(ciclo.data_fim)}</Celula>
                  <Celula>{ciclo.dias_operacionais}</Celula>
                  <Celula>
                    <BotaoSecundario onClick={() => irParaCiclo(ciclo)}>Editar</BotaoSecundario>
                  </Celula>
                </Linha>
              ))}
            </Tabela>
            {paginas > 1 && (
              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-sm text-gray-500">Página {pagina} de {paginas}</p>
                <div className="flex gap-2">
                  <BotaoSecundario disabled={pagina <= 1} onClick={() => setPagina((atual) => Math.max(1, atual - 1))}>
                    Anterior
                  </BotaoSecundario>
                  <BotaoSecundario disabled={pagina >= paginas} onClick={() => setPagina((atual) => atual + 1)}>
                    Próxima
                  </BotaoSecundario>
                </div>
              </div>
            )}
          </>
        )}
      </Cartao>

      {modalAberto && (
        <Modal titulo="Novo ciclo" onFechar={() => setModalAberto(false)}>
          {erroModal && <Aviso tipo="erro">{erroModal}</Aviso>}
          <FormularioCiclo
            modo="criar"
            municipioId={municipioModal}
            onMunicipio={(id) => setMunicipioModal(id ?? undefined)}
            onSubmit={onCriar}
            pending={criarCiclo.isPending}
          />
        </Modal>
      )}
    </div>
  );
}
