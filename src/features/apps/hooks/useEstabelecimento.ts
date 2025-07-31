// Hook para Estabelecimento
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EstabelecimentoService } from '@/services/EstabelecimentoService'

export const useEstabelecimentos = (page: number = 1, limit: number = 10, search: string = '') => {
  return useQuery({
    queryKey: ['estabelecimentos', page, limit, search],
    queryFn: () => EstabelecimentoService.getAllPaginated(page, limit, search),
    staleTime: 1000 * 60 * 5,
  })
}

export const useEstabelecimento = (id: number) => {
  return useQuery({
    queryKey: ['estabelecimento', id],
    queryFn: () => EstabelecimentoService.getById(id),
    enabled: !!id,
  })
}

export const useCreateEstabelecimento = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (descricao: string) => EstabelecimentoService.create({ descricao }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['estabelecimentos'] }),
  })
}

export const useUpdateEstabelecimento = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, descricao }: { id: number, descricao: string }) => 
      EstabelecimentoService.update(id, { descricao }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estabelecimentos'] })
      queryClient.invalidateQueries({ queryKey: ['estabelecimento', variables.id] })
    },
  })
}

export const useDeleteEstabelecimento = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => EstabelecimentoService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['estabelecimentos'] }),
  })
}

export const useCheckEstabelecimentoExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      EstabelecimentoService.checkExisting(descricao, excludeId),
  })
}
