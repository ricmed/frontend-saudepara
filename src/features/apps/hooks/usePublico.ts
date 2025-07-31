// Hook para Público
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TiposPublicoService } from '@/services/PublicoService'

export const usePublicos = (page: number = 1, limit: number = 10, search: string = '') => {
  return useQuery({
    queryKey: ['publicos', page, limit, search],
    queryFn: () => TiposPublicoService.getAllPaginated(page, limit, search),
    staleTime: 1000 * 60 * 5,
  })
}

export const usePublico = (id: number) => {
  return useQuery({
    queryKey: ['publico', id],
    queryFn: () => TiposPublicoService.getById(id),
    enabled: !!id,
  })
}

export const useCreatePublico = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (descricao: string) => TiposPublicoService.create(descricao),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['publicos'] }),
  })
}

export const useUpdatePublico = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, descricao }: { id: number, descricao: string }) => 
      TiposPublicoService.update(id, descricao),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['publicos'] })
      queryClient.invalidateQueries({ queryKey: ['publico', variables.id] })
    },
  })
}

export const useDeletePublico = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => TiposPublicoService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['publicos'] }),
  })
}

export const useCheckPublicoExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      TiposPublicoService.checkExisting(descricao, excludeId),
  })
}
