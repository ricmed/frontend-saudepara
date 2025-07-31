// Hook para Raça
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RacaService } from '@/services/RacaService'

export const useRacas = (page: number = 1, limit: number = 10, search: string = '') => {
  return useQuery({
    queryKey: ['racas', page, limit, search],
    queryFn: () => RacaService.getAllPaginated(page, limit, search),
    staleTime: 1000 * 60 * 5,
  })
}

export const useRaca = (id: number) => {
  return useQuery({
    queryKey: ['raca', id],
    queryFn: () => RacaService.getById(id),
    enabled: !!id,
  })
}

export const useCreateRaca = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (descricao: string) => RacaService.create(descricao),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['racas'] }),
  })
}

export const useUpdateRaca = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, descricao }: { id: number, descricao: string }) => 
      RacaService.update(id, descricao),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['racas'] })
      queryClient.invalidateQueries({ queryKey: ['raca', variables.id] })
    },
  })
}

export const useDeleteRaca = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => RacaService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['racas'] }),
  })
}

export const useCheckRacaExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      RacaService.checkExisting(descricao, excludeId),
  })
}
