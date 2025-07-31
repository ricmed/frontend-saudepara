import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TiposAtendimentoService } from '@/services/AtendimentoService'

// Tipos
interface TipoAtendimento {
  idtipo_atendimento: number;
  descricao: string;
}

interface PaginatedResponse {
  data: TipoAtendimento[];
  meta: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

// Hook para listar tipos de atendimento com paginação
export const useTiposAtendimento = (
  page: number = 1, 
  limit: number = 10, 
  search: string = ''
) => {
  return useQuery({
    queryKey: ['tipos-atendimento', page, limit, search],
    queryFn: () => TiposAtendimentoService.getAllPaginated(page, limit, search) as Promise<PaginatedResponse>,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para buscar tipo de atendimento por ID
export const useTipoAtendimento = (id: number) => {
  return useQuery({
    queryKey: ['tipo-atendimento', id],
    queryFn: () => TiposAtendimentoService.getById(id),
    enabled: !!id, // Só executa se tem ID
  })
}

// Hook para criar tipo de atendimento
export const useCreateTipoAtendimento = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (descricao: string) => TiposAtendimentoService.create(descricao),
    onSuccess: () => {
      // Invalidar todas as consultas de tipos de atendimento para recarregar automaticamente
      queryClient.invalidateQueries({ queryKey: ['tipos-atendimento'] })
    },
  })
}

// Hook para atualizar tipo de atendimento
export const useUpdateTipoAtendimento = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, descricao }: { id: number, descricao: string }) => 
      TiposAtendimentoService.update(id, descricao),
    onSuccess: (_, variables) => {
      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['tipos-atendimento'] })
      queryClient.invalidateQueries({ queryKey: ['tipo-atendimento', variables.id] })
    },
  })
}

// Hook para deletar tipo de atendimento
export const useDeleteTipoAtendimento = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => TiposAtendimentoService.delete(id),
    onSuccess: () => {
      // Invalidar consultas de tipos de atendimento
      queryClient.invalidateQueries({ queryKey: ['tipos-atendimento'] })
    },
  })
}

// Hook para verificar se tipo de atendimento já existe (para validação)
export const useCheckTipoAtendimentoExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      TiposAtendimentoService.checkExisting(descricao, excludeId),
  })
}
