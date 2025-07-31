import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HabilitacaoService } from '@/services/HabilitacaoService'

export const useHabilitacoes = (page: number = 1, limit: number = 10, search: string = '') => {
  return useQuery({
    queryKey: ['habilitacoes', page, limit, search],
    queryFn: () => HabilitacaoService.getAllPaginated(page, limit, search) as Promise<{
      data: any[];
      meta: {
        total: number;
        totalPages: number;
        page: number;
      };
    }>,
    staleTime: 1000 * 60 * 5,
  })
}

export const useHabilitacao = (id: number) => {
  return useQuery({
    queryKey: ['habilitacao', id],
    queryFn: () => HabilitacaoService.getById(id),
    enabled: !!id,
  })
}

export const useCreateHabilitacao = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { codigo: string, descricao: string }) => HabilitacaoService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habilitacoes'] }),
  })
}

export const useUpdateHabilitacao = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: { codigo: string, descricao: string } }) => 
      HabilitacaoService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['habilitacoes'] })
      queryClient.invalidateQueries({ queryKey: ['habilitacao', variables.id] })
    },
  })
}

export const useDeleteHabilitacao = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => HabilitacaoService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habilitacoes'] }),
  })
}

export const useCheckHabilitacaoCodigoExisting = () => {
  return useMutation({
    mutationFn: ({ codigo, excludeId }: { codigo: string, excludeId?: number }) =>
      HabilitacaoService.checkExistingCodigo(codigo, excludeId),
  })
}

export const useCheckHabilitacaoDescricaoExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      HabilitacaoService.checkExistingDescricao(descricao, excludeId),
  })
}
