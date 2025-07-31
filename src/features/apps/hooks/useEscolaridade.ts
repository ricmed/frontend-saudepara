import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EscolaridadeService } from '@/services/EscolaridadeService'

// Hook para listar escolaridades com paginação
export const useEscolaridades = (
  page: number = 1, 
  limit: number = 10, 
  search: string = ''
) => {
  return useQuery({
    queryKey: ['escolaridades', page, limit, search],
    queryFn: () => EscolaridadeService.getAllPaginated(page, limit, search),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para buscar escolaridade por ID
export const useEscolaridade = (id: number) => {
  return useQuery({
    queryKey: ['escolaridade', id],
    queryFn: () => EscolaridadeService.getById(id),
    enabled: !!id, // Só executa se tem ID
  })
}

// Hook para criar escolaridade
export const useCreateEscolaridade = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (descricao: string) => EscolaridadeService.create(descricao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escolaridades'] })
    },
  })
}

// Hook para atualizar escolaridade
export const useUpdateEscolaridade = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, descricao }: { id: number, descricao: string }) => 
      EscolaridadeService.update(id, descricao),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['escolaridades'] })
      queryClient.invalidateQueries({ queryKey: ['escolaridade', variables.id] })
    },
  })
}

// Hook para deletar escolaridade
export const useDeleteEscolaridade = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => EscolaridadeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escolaridades'] })
    },
  })
}

// Hook para verificar se escolaridade já existe
export const useCheckEscolaridadeExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      EscolaridadeService.checkExisting(descricao, excludeId),
  })
}
