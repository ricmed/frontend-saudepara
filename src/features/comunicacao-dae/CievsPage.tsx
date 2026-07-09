import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Menu, Plus, Search, Trash2, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import SideBarMenuAppsAuxiliaresDae from '@/features/apps/components/SideBarMenuAppsAuxiliaresDae';
import CievsService, {
  Cievs,
  CievsPayload,
} from '@/services/CievsService';

const BASE_PATH = '/private/apps/comunicacao-dae/cievs';
const ITEMS_PER_PAGE = 10;

interface FormState {
  nome: string;
  codigo: string;
  municipios_ids: number[];
}

const EMPTY_FORM: FormState = {
  nome: '',
  codigo: '',
  municipios_ids: [],
};

function getErrorMessage(error: unknown): string {
  if (isAxiosError<{ error?: string; message?: string }>(error)) {
    return error.response?.data?.error ?? error.response?.data?.message ?? error.message;
  }
  return error instanceof Error ? error.message : 'Ocorreu um erro inesperado';
}

const CievsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const parsedRouteId = id ? Number(id) : null;
  const routeId =
    parsedRouteId !== null && Number.isInteger(parsedRouteId) && parsedRouteId > 0
      ? parsedRouteId
      : null;
  const [currentPage, setCurrentPage] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showForm, setShowForm] = useState(routeId !== null);
  const [editingId, setEditingId] = useState<number | null>(routeId);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [municipioSearch, setMunicipioSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const cievsQuery = useQuery({
    queryKey: ['cievs', currentPage, ITEMS_PER_PAGE],
    queryFn: () => CievsService.getAll(currentPage, ITEMS_PER_PAGE),
  });

  const detailQuery = useQuery({
    queryKey: ['cievs', routeId],
    queryFn: () => CievsService.getById(routeId as number),
    enabled: routeId !== null && Number.isInteger(routeId) && routeId > 0,
  });

  const municipiosQuery = useQuery({
    queryKey: ['municipios', 'para', 'cievs-select'],
    queryFn: () => CievsService.getMunicipiosPara(),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CievsPayload) => CievsService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cievs'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id: cievsId, payload }: { id: number; payload: CievsPayload }) =>
      CievsService.update(cievsId, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cievs'] }),
        queryClient.invalidateQueries({ queryKey: ['cievs', variables.id] }),
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (cievsId: number) => CievsService.delete(cievsId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cievs'] });
    },
  });

  const beginEdit = useCallback((cievs: Cievs) => {
    setEditingId(cievs.id_cievs);
    setForm({
      nome: cievs.nome,
      codigo: cievs.codigo ?? '',
      municipios_ids: cievs.abrangencia.map(({ municipio }) => municipio.idtipo_municipio),
    });
    setFeedback(null);
    setShowForm(true);
  }, []);

  useEffect(() => {
    if (detailQuery.data) {
      beginEdit(detailQuery.data);
    }
  }, [beginEdit, detailQuery.data]);

  const municipiosFiltrados = useMemo(() => {
    const normalizedSearch = municipioSearch.trim().toLocaleLowerCase('pt-BR');
    if (!normalizedSearch) return municipiosQuery.data ?? [];
    return (municipiosQuery.data ?? []).filter((municipio) =>
      `${municipio.descricao} ${municipio.codigo}`
        .toLocaleLowerCase('pt-BR')
        .includes(normalizedSearch)
    );
  }, [municipioSearch, municipiosQuery.data]);

  const selectedMunicipios = useMemo(
    () => new Set(form.municipios_ids),
    [form.municipios_ids]
  );
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const totalPages = cievsQuery.data?.pagination.pages ?? 0;

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMunicipioSearch('');
    navigate(BASE_PATH);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    const nome = form.nome.trim();
    const codigo = form.codigo.trim();

    if (!nome) {
      setFeedback('Informe o nome do CIEVS.');
      return;
    }
    if (codigo && !/^\d{7}$/.test(codigo)) {
      setFeedback('O CNES da sede deve conter exatamente 7 dígitos.');
      return;
    }

    const payload: CievsPayload = {
      nome,
      codigo: codigo || null,
      municipios_ids: form.municipios_ids,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      resetForm();
    } catch (error) {
      setFeedback(getErrorMessage(error));
    }
  };

  const handleDelete = async (cievs: Cievs) => {
    if (!window.confirm(`Excluir o CIEVS "${cievs.nome}"?`)) return;
    setFeedback(null);
    try {
      await deleteMutation.mutateAsync(cievs.id_cievs);
    } catch (error) {
      setFeedback(getErrorMessage(error));
    }
  };

  const toggleMunicipio = (municipioId: number) => {
    setForm((current) => ({
      ...current,
      municipios_ids: current.municipios_ids.includes(municipioId)
        ? current.municipios_ids.filter((idMunicipio) => idMunicipio !== municipioId)
        : [...current.municipios_ids, municipioId],
    }));
  };

  const selectFilteredMunicipios = () => {
    setForm((current) => ({
      ...current,
      municipios_ids: Array.from(
        new Set([
          ...current.municipios_ids,
          ...municipiosFiltrados.map((municipio) => municipio.idtipo_municipio),
        ])
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-4">
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="rounded-full p-2 transition-colors hover:bg-blue-700"
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/private/apps-auxiliares-dae')}
                className="rounded-full p-2 transition-colors hover:bg-blue-700"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">
                  Centro de Informações Estratégicas em Vigilância em Saúde
                </h1>
                <p className="mt-0.5 text-sm text-blue-100">
                  Gerenciar sedes e abrangência municipal dos CIEVS
                </p>
              </div>
            </div>
            {!showForm && (
              <button
                type="button"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setEditingId(null);
                  setFeedback(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-2 text-blue-600 shadow-md transition-colors hover:bg-gray-100"
              >
                <Plus className="h-5 w-5" />
                Novo CIEVS
              </button>
            )}
          </div>
        </div>
      </header>

      <SideBarMenuAppsAuxiliaresDae
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {(feedback || cievsQuery.error || detailQuery.error || municipiosQuery.error) && (
          <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 p-4 text-red-700">
            <span>
              {feedback ??
                getErrorMessage(
                  cievsQuery.error ?? detailQuery.error ?? municipiosQuery.error
                )}
            </span>
            <button type="button" onClick={() => setFeedback(null)} aria-label="Fechar aviso">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {showForm && (
          <section className="mb-6 rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              {editingId ? 'Editar CIEVS' : 'Novo CIEVS'}
            </h2>

            {detailQuery.isLoading && editingId ? (
              <p className="text-gray-600">Carregando CIEVS...</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="cievs-nome" className="mb-1 block text-sm font-medium text-gray-700">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="cievs-nome"
                      type="text"
                      value={form.nome}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, nome: event.target.value }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={150}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="cievs-cnes" className="mb-1 block text-sm font-medium text-gray-700">
                      CNES da sede
                    </label>
                    <input
                      id="cievs-cnes"
                      type="text"
                      inputMode="numeric"
                      value={form.codigo}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          codigo: event.target.value.replace(/\D/g, '').slice(0, 7),
                        }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="7 dígitos"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      O CNES identifica somente a sede e não define a abrangência do CIEVS.
                    </p>
                  </div>
                </div>

                <fieldset>
                  <legend className="text-sm font-medium text-gray-700">
                    Municípios abrangidos no Pará
                  </legend>
                  <div className="mt-2 rounded-lg border border-gray-300">
                    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 p-3">
                      <div className="relative min-w-64 flex-1">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                          type="search"
                          value={municipioSearch}
                          onChange={(event) => setMunicipioSearch(event.target.value)}
                          className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Buscar município ou código IBGE"
                          aria-label="Buscar município"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={selectFilteredMunicipios}
                        className="rounded-md border border-blue-600 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                      >
                        Selecionar exibidos
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({ ...current, municipios_ids: [] }))
                        }
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Limpar
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto p-3">
                      {municipiosQuery.isLoading ? (
                        <p className="text-sm text-gray-500">Carregando municípios...</p>
                      ) : municipiosFiltrados.length === 0 ? (
                        <p className="text-sm text-gray-500">Nenhum município encontrado.</p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {municipiosFiltrados.map((municipio) => (
                            <label
                              key={municipio.idtipo_municipio}
                              className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-blue-50"
                            >
                              <input
                                type="checkbox"
                                checked={selectedMunicipios.has(municipio.idtipo_municipio)}
                                onChange={() => toggleMunicipio(municipio.idtipo_municipio)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                {municipio.descricao}
                                <span className="ml-1 text-gray-400">({municipio.codigo})</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {form.municipios_ids.length} município(s) selecionado(s).
                  </p>
                  {form.municipios_ids.length === 0 && (
                    <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                      Atenção: sem municípios selecionados, este CIEVS ficará sem abrangência definida.
                    </div>
                  )}
                </fieldset>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || municipiosQuery.isLoading}
                    className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {!showForm && (
          <>
            {cievsQuery.isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
              </div>
            ) : (cievsQuery.data?.data.length ?? 0) === 0 ? (
              <div className="rounded-xl bg-white p-12 text-center shadow-md">
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Nenhum CIEVS encontrado
                </h3>
                <p className="text-sm text-gray-500">Cadastre o primeiro registro.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl bg-white shadow-md">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase text-blue-600">Nome</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase text-blue-600">CNES da sede</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase text-blue-600">Abrangência</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold uppercase text-blue-600">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {cievsQuery.data?.data.map((cievs) => (
                        <tr key={cievs.id_cievs} className="hover:bg-blue-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{cievs.nome}</td>
                          <td className="px-6 py-4 text-gray-600">{cievs.codigo ?? 'Não informado'}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {cievs._count.abrangencia === 0 ? (
                              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                                Sem abrangência definida
                              </span>
                            ) : (
                              <div>
                                <span className="font-medium text-gray-800">
                                  {cievs._count.abrangencia} município(s)
                                </span>
                                <p className="mt-1 max-w-xl truncate text-xs text-gray-500">
                                  {cievs.abrangencia
                                    .map(({ municipio }) => municipio.descricao)
                                    .join(', ')}
                                </p>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  beginEdit(cievs);
                                  navigate(`${BASE_PATH}/${cievs.id_cievs}`);
                                }}
                                className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                                aria-label={`Editar ${cievs.nome}`}
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(cievs)}
                                disabled={deleteMutation.isPending}
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                aria-label={`Excluir ${cievs.nome}`}
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between rounded-lg bg-white px-6 py-4 shadow-md">
                <span className="text-sm text-gray-700">
                  {cievsQuery.data?.pagination.total ?? 0} registros
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CievsPage;
