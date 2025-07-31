// Hook para Tipo de Encerramento
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TiposEncerramentoService } from '@/services/EncerramentoService'

export const useTiposEncerramento = (page: number = 1, limit: number = 10, search: string = '') => {
  return useQuery({
    queryKey: ['tiposEncerramento', page, limit, search],
    queryFn: () => TiposEncerramentoService.getAllPaginated(page, limit, search),
    staleTime: 1000 * 60 * 5,
  })
}

export const useTipoEncerramento = (id: number) => {
  return useQuery({
    queryKey: ['tipoEncerramento', id],
    queryFn: () => TiposEncerramentoService.getById(id),
    enabled: !!id,
  })
}

export const useCreateTipoEncerramento = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (descricao: string) => TiposEncerramentoService.create(descricao),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiposEncerramento'] }),
  })
}

export const useUpdateTipoEncerramento = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, descricao }: { id: number, descricao: string }) => 
      TiposEncerramentoService.update(id, descricao),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tiposEncerramento'] })
      queryClient.invalidateQueries({ queryKey: ['tipoEncerramento', variables.id] })
    },
  })
}

export const useDeleteTipoEncerramento = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => TiposEncerramentoService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiposEncerramento'] }),
  })
}

export const useCheckTipoEncerramentoExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      TiposEncerramentoService.checkExisting(descricao, excludeId),
  })
}
