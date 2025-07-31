// Hook para Qualificação
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TipoQualificacaoService } from '@/services/TipoQualificacaoService'

export const useQualificacoes = (page: number = 1, limit: number = 10, search: string = '') => {
  return useQuery({
    queryKey: ['qualificacoes', page, limit, search],
    queryFn: () => TipoQualificacaoService.getAllPaginated(page, limit, search),
    staleTime: 1000 * 60 * 5,
  })
}

export const useQualificacao = (id: number) => {
  return useQuery({
    queryKey: ['qualificacao', id],
    queryFn: () => TipoQualificacaoService.getById(id),
    enabled: !!id,
  })
}

export const useCreateQualificacao = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ descricao, idcomponente }: { descricao: string, idcomponente: number }) => 
      TipoQualificacaoService.create({ descricao, idcomponente }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qualificacoes'] }),
  })
}

export const useUpdateQualificacao = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, descricao, idcomponente }: { id: number, descricao: string, idcomponente: number }) => 
      TipoQualificacaoService.update(id, { descricao, idcomponente }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['qualificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['qualificacao', variables.id] })
    },
  })
}

export const useDeleteQualificacao = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => TipoQualificacaoService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qualificacoes'] }),
  })
}

export const useCheckQualificacaoExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId: number }) =>
      TipoQualificacaoService.checkExisting(descricao, excludeId),
  })
}
