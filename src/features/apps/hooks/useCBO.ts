import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CBOService } from '@/services/CBOService'

// Hook para listar CBOs com paginação
export const useCBOs = (
  page: number = 1, 
  limit: number = 10, 
  search: string = ''
) => {
  return useQuery({
    queryKey: ['tipos-cbo', page, limit, search],
    queryFn: () => CBOService.getAllPaginated(page, limit, search) as Promise<{
      data: any[];
      meta: {
        total: number;
        totalPages: number;
        page: number;
      };
    }>,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para buscar CBO por ID
export const useCBO = (id: number) => {
  return useQuery({
    queryKey: ['cbo', id],
    queryFn: () => CBOService.getById(id),
    enabled: !!id, // Só executa se tem ID
  })
}

// Hook para criar CBO
export const useCreateCBO = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: { codigo: string, descricao: string }) => CBOService.create(data),
    onSuccess: () => {
      // Invalidar todas as consultas de CBOs para recarregar automaticamente
      queryClient.invalidateQueries({ queryKey: ['tipos-cbo'] })
    },
  })
}

// Hook para atualizar CBO
export const useUpdateCBO = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: { codigo: string, descricao: string } }) => 
      CBOService.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['tipos-cbo'] })
      queryClient.invalidateQueries({ queryKey: ['cbo', variables.id] })
    },
  })
}

// Hook para deletar CBO
export const useDeleteCBO = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => CBOService.delete(id),
    onSuccess: () => {
      // Invalidar consultas de CBOs usando a mesma queryKey da lista
      queryClient.invalidateQueries({ queryKey: ['tipos-cbo'] })
    },
  })
}

// Hook para verificar se código CBO já existe (para validação)
export const useCheckCBOCodigoExisting = () => {
  return useMutation({
    mutationFn: ({ codigo, excludeId }: { codigo: string, excludeId?: number }) =>
      CBOService.checkExisting(codigo, excludeId),
  })
}

// Hook para verificar se descrição CBO já existe (para validação)
export const useCheckCBODescricaoExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      CBOService.checkExistingDescricao(descricao, excludeId),
  })
}
