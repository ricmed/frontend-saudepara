import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TipoBairroService } from '@/services/BairroService'

// Tipos
interface TipoBairro {
  idtipo_bairro: number;
  descricao: string;
}

// Hook para listar tipos de bairro com paginação
export const useTiposBairro = (
  page: number = 1, 
  limit: number = 10, 
  search: string = ''
) => {
  return useQuery({
    queryKey: ['tipos-bairro', page, limit, search],
    queryFn: async () => {
      const response = await TipoBairroService.getAllPaginated(page, limit, search);
      // Converter formato para manter compatibilidade
      return {
        data: response.data,
        meta: {
          total: response.pagination.total,
          totalPages: response.pagination.pages,
          page: response.pagination.currentPage,
          limit: response.pagination.perPage
        }
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para buscar tipo de bairro por ID
export const useTipoBairro = (id: number) => {
  return useQuery({
    queryKey: ['tipo-bairro', id],
    queryFn: () => TipoBairroService.getById(id),
    enabled: !!id, // Só executa se tem ID
  })
}

// Hook para criar tipo de bairro
export const useCreateTipoBairro = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (descricao: string) => TipoBairroService.create(descricao),
    onSuccess: () => {
      // Invalidar todas as consultas de tipos de bairro para recarregar automaticamente
      queryClient.invalidateQueries({ queryKey: ['tipos-bairro'] })
    },
  })
}

// Hook para atualizar tipo de bairro
export const useUpdateTipoBairro = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, descricao }: { id: number, descricao: string }) => 
      TipoBairroService.update(id, descricao),
    onSuccess: (_, variables) => {
      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['tipos-bairro'] })
      queryClient.invalidateQueries({ queryKey: ['tipo-bairro', variables.id] })
    },
  })
}

// Hook para deletar tipo de bairro
export const useDeleteTipoBairro = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => TipoBairroService.delete(id),
    onSuccess: () => {
      // Invalidar consultas de tipos de bairro
      queryClient.invalidateQueries({ queryKey: ['tipos-bairro'] })
    },
  })
}

// Hook para verificar se tipo de bairro já existe (para validação)
export const useCheckTipoBairroExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      TipoBairroService.checkExisting(descricao, excludeId),
  })
}
