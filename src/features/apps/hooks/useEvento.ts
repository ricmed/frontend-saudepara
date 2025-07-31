// Hook para Evento
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TiposEventoService } from '@/services/EventoService'

export const useEventos = (page: number = 1, limit: number = 10, search: string = '') => {
  return useQuery({
    queryKey: ['eventos', page, limit, search],
    queryFn: () => TiposEventoService.getAllPaginated(page, limit, search),
    staleTime: 1000 * 60 * 5,
  })
}

export const useEvento = (id: number) => {
  return useQuery({
    queryKey: ['evento', id],
    queryFn: () => TiposEventoService.getById(id),
    enabled: !!id,
  })
}

export const useCreateEvento = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ descricao, ativo }: { descricao: string, ativo?: string }) => 
      TiposEventoService.create(descricao, ativo || 'S'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['eventos'] }),
  })
}

export const useUpdateEvento = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, descricao, ativo }: { id: number, descricao: string, ativo?: string }) => 
      TiposEventoService.update(id, descricao, ativo || 'S'),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['eventos'] })
      queryClient.invalidateQueries({ queryKey: ['evento', variables.id] })
    },
  })
}

export const useDeleteEvento = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => TiposEventoService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['eventos'] }),
  })
}

export const useCheckEventoExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      TiposEventoService.checkExisting(descricao, excludeId),
  })
}

export const useToggleEventoAtivo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => TiposEventoService.toggleAtivo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['eventos'] }),
  })
}
