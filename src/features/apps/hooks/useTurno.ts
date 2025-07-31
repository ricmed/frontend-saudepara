// Hook para Turno
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TurnoService } from '@/services/TurnoService'

export const useTurnos = (page: number = 1, limit: number = 10, search: string = '') => {
  return useQuery({
    queryKey: ['turnos', page, limit, search],
    queryFn: () => TurnoService.getAllPaginated(page, limit, search),
    staleTime: 1000 * 60 * 5,
  })
}

export const useTurno = (id: number) => {
  return useQuery({
    queryKey: ['turno', id],
    queryFn: () => TurnoService.getById(id),
    enabled: !!id,
  })
}

export const useCreateTurno = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (descricao: string) => TurnoService.create(descricao),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['turnos'] }),
  })
}

export const useUpdateTurno = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, descricao }: { id: number, descricao: string }) => 
      TurnoService.update(id, descricao),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] })
      queryClient.invalidateQueries({ queryKey: ['turno', variables.id] })
    },
  })
}

export const useDeleteTurno = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => TurnoService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['turnos'] }),
  })
}

export const useCheckTurnoExisting = () => {
  return useMutation({
    mutationFn: ({ descricao, excludeId }: { descricao: string, excludeId?: number }) =>
      TurnoService.checkExisting(descricao, excludeId),
  })
}
