// Hook para Trauma
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TiposTraumaService } from '@/services/TraumaService'

export const useTraumas = (page: number = 1, limit: number = 10, search: string = '') => {
  return useQuery({
    queryKey: ['traumas', page, limit, search],
    queryFn: () => TiposTraumaService.getAllPaginated(page, limit, search),
    staleTime: 1000 * 60 * 5,
  })
}

export const useTrauma = (id: number) => {
  return useQuery({
    queryKey: ['trauma', id],
    queryFn: () => TiposTraumaService.getById(id),
    enabled: !!id,
  })
}

export const useCreateTrauma = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (descricao: string) => TiposTraumaService.create(descricao),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['traumas'] }),
  })
}

export const useUpdateTrauma = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, descricao }: { id: number, descricao: string }) => 
      TiposTraumaService.update(id, descricao),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['traumas'] })
      queryClient.invalidateQueries({ queryKey: ['trauma', variables.id] })
    },
  })
}

export const useDeleteTrauma = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => TiposTraumaService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['traumas'] }),
  })
}

export const useCheckTraumaExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      TiposTraumaService.checkExisting(descricao, excludeId),
  })
}
