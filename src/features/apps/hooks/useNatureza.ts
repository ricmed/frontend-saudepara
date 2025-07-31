// Hook para Natureza
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NaturezaService } from '@/services/NaturezaService'

export const useNaturezas = (page: number = 1, limit: number = 10, search: string = '') => {
  return useQuery({
    queryKey: ['naturezas', page, limit, search],
    queryFn: () => NaturezaService.getAllPaginated(page, limit, search),
    staleTime: 1000 * 60 * 5,
  })
}

export const useNatureza = (id: number) => {
  return useQuery({
    queryKey: ['natureza', id],
    queryFn: () => NaturezaService.getById(id),
    enabled: !!id,
  })
}

export const useCreateNatureza = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (descricao: string) => NaturezaService.create(descricao),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['naturezas'] }),
  })
}

export const useUpdateNatureza = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, descricao }: { id: number, descricao: string }) => 
      NaturezaService.update(id, descricao),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['naturezas'] })
      queryClient.invalidateQueries({ queryKey: ['natureza', variables.id] })
    },
  })
}

export const useDeleteNatureza = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => NaturezaService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['naturezas'] }),
  })
}

export const useCheckNaturezaExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      NaturezaService.checkExisting(descricao, excludeId),
  })
}
