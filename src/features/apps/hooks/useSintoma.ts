// Hook para Sintoma
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TiposSintomaService } from '@/services/SintomaService'

export const useSintomas = (page: number = 1, limit: number = 10, search: string = '') => {
  return useQuery({
    queryKey: ['sintomas', page, limit, search],
    queryFn: () => TiposSintomaService.getAllPaginated(page, limit, search),
    staleTime: 1000 * 60 * 5,
  })
}

export const useSintoma = (id: number) => {
  return useQuery({
    queryKey: ['sintoma', id],
    queryFn: () => TiposSintomaService.getById(id),
    enabled: !!id,
  })
}

export const useCreateSintoma = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (descricao: string) => TiposSintomaService.create(descricao),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sintomas'] }),
  })
}

export const useUpdateSintoma = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, descricao }: { id: number, descricao: string }) => 
      TiposSintomaService.update(id, descricao),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sintomas'] })
      queryClient.invalidateQueries({ queryKey: ['sintoma', variables.id] })
    },
  })
}

export const useDeleteSintoma = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => TiposSintomaService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sintomas'] }),
  })
}

export const useCheckSintomaExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      TiposSintomaService.checkExisting(descricao, excludeId),
  })
}
