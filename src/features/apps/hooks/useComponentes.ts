import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ComponentsService } from '@/services/ComponentsService'

// Tipos
interface Componente {
  idcomponente: number;
  descricao: string;
}

interface PaginatedResponse {
  data: Componente[];
  meta: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

// Hook para listar componentes com paginação
export const useComponentes = (
  page: number = 1, 
  limit: number = 10, 
  search: string = ''
) => {
  return useQuery({
    queryKey: ['componentes', page, limit, search],
    queryFn: () => ComponentsService.getAllPaginated(page, limit, search) as Promise<PaginatedResponse>,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para buscar componente por ID
export const useComponente = (id: number) => {
  return useQuery({
    queryKey: ['componente', id],
    queryFn: () => ComponentsService.getById(id),
    enabled: !!id, // Só executa se tem ID
  })
}

// Hook para criar componente
export const useCreateComponente = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (descricao: string) => ComponentsService.create(descricao),
    onSuccess: () => {
      // Invalidar todas as consultas de componentes para recarregar automaticamente
      queryClient.invalidateQueries({ queryKey: ['componentes'] })
    },
  })
}

// Hook para atualizar componente
export const useUpdateComponente = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, descricao }: { id: number, descricao: string }) => 
      ComponentsService.update(id, descricao),
    onSuccess: (data, variables) => {
      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['componentes'] })
      queryClient.invalidateQueries({ queryKey: ['componente', variables.id] })
    },
  })
}

// Hook para deletar componente
export const useDeleteComponente = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => ComponentsService.delete(id),
    onSuccess: () => {
      // Invalidar consultas de componentes
      queryClient.invalidateQueries({ queryKey: ['componentes'] })
    },
  })
}

// Hook para verificar se componente já existe (para validação)
export const useCheckComponenteExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      ComponentsService.checkExisting(descricao, excludeId),
  })
}