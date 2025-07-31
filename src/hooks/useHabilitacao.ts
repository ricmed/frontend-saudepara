import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HabilitacaoService } from '../services/HabilitacaoService';

interface TipoHabilitacao {
  idtipo_habilitacao: number;
  codigo: string;
  descricao: string;
}

interface HabilitacaoData {
  codigo: string;
  descricao: string;
}

interface PaginationData {
  data: TipoHabilitacao[];
  meta: {
    total: number;
    totalPages: number;
    page: number;
  };
}

// Query para buscar todas as habilitações
export const useHabilitacoes = () => {
  return useQuery({
    queryKey: ['habilitacoes'],
    queryFn: () => HabilitacaoService.getAll(),
  });
};

// Query para buscar habilitações paginadas
export const useHabilitacoesPaginated = (page: number, limit: number, searchTerm?: string) => {
  return useQuery({
    queryKey: ['habilitacoes-paginated', page, limit, searchTerm],
    queryFn: () => HabilitacaoService.getAllPaginated(page, limit, searchTerm),
  });
};

// Query para buscar uma habilitação específica
export const useHabilitacao = (id: number) => {
  return useQuery({
    queryKey: ['habilitacao', id],
    queryFn: () => HabilitacaoService.getById(id),
    enabled: !!id,
  });
};

// Mutation para criar habilitação
export const useCreateHabilitacao = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: HabilitacaoData) => HabilitacaoService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habilitacoes'] });
      queryClient.invalidateQueries({ queryKey: ['habilitacoes-paginated'] });
    },
  });
};

// Mutation para atualizar habilitação
export const useUpdateHabilitacao = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & HabilitacaoData) => 
      HabilitacaoService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habilitacoes'] });
      queryClient.invalidateQueries({ queryKey: ['habilitacoes-paginated'] });
    },
  });
};

// Mutation para deletar habilitação
export const useDeleteHabilitacao = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => HabilitacaoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habilitacoes'] });
      queryClient.invalidateQueries({ queryKey: ['habilitacoes-paginated'] });
    },
  });
};

// Mutation para verificar se código já existe
export const useCheckHabilitacaoCodigoExisting = () => {
  return useMutation({
    mutationFn: (codigo: string) => HabilitacaoService.checkExistingCodigo(codigo),
  });
};

// Mutation para verificar se descrição já existe
export const useCheckHabilitacaoDescricaoExisting = () => {
  return useMutation({
    mutationFn: (descricao: string) => HabilitacaoService.checkExistingDescricao(descricao),
  });
};
