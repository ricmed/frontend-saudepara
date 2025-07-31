// Hook para Hipótese Diagnóstica
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TiposHipoteseDiagService } from '@/services/HipoteseDiagService'

export const useHipotesesDiag = (page: number = 1, limit: number = 10, search: string = '') => {
  return useQuery({
    queryKey: ['hipoteses-diag', page, limit, search],
    queryFn: () => TiposHipoteseDiagService.getAllPaginated(page, limit, search),
    staleTime: 1000 * 60 * 5,
  })
}

export const useHipoteseDiag = (id: number) => {
  return useQuery({
    queryKey: ['hipotese-diag', id],
    queryFn: () => TiposHipoteseDiagService.getById(id),
    enabled: !!id,
  })
}

export const useCreateHipoteseDiag = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (descricao: string) => TiposHipoteseDiagService.create(descricao),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hipoteses-diag'] }),
  })
}

export const useUpdateHipoteseDiag = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, descricao }: { id: number, descricao: string }) => 
      TiposHipoteseDiagService.update(id, descricao),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hipoteses-diag'] })
      queryClient.invalidateQueries({ queryKey: ['hipotese-diag', variables.id] })
    },
  })
}

export const useDeleteHipoteseDiag = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => TiposHipoteseDiagService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hipoteses-diag'] }),
  })
}

export const useCheckHipoteseDiagExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      TiposHipoteseDiagService.checkExisting(descricao, excludeId),
  })
}
