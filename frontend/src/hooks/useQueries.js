import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as queries from './queries';

// Auth hooks
export function useLogin() {
  return useMutation({
    mutationFn: queries.authApi.login
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: queries.authApi.register
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: queries.authApi.getCurrentUser,
    retry: false
  });
}

// Missions hooks
export function useMissions() {
  return useQuery({
    queryKey: ['missions'],
    queryFn: queries.missionsApi.getAll,
    staleTime: 5 * 60 * 1000
  });
}

export function useMissionDetail(id) {
  return useQuery({
    queryKey: ['mission', id],
    queryFn: () => queries.missionsApi.getById(id),
    enabled: !!id
  });
}

// Proofs hooks
export function useSubmitProof() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: queries.proofsApi.submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProofs'] });
    }
  });
}

export function useMyProofs() {
  return useQuery({
    queryKey: ['myProofs'],
    queryFn: queries.proofsApi.getMyProofs
  });
}

// Users hooks
export function useLeaderboard(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['leaderboard', limit, offset],
    queryFn: () => queries.usersApi.getLeaderboard(limit, offset)
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['myProfile'],
    queryFn: queries.usersApi.getMyProfile
  });
}

// Admin hooks
export function useAdminStats() {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: queries.adminApi.getStats,
    refetchInterval: 60 * 1000
  });
}

export function useAdminProofs(status, limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['adminProofs', status, limit, offset],
    queryFn: () => queries.adminApi.getProofs(status, limit, offset)
  });
}

export function useApproveProof() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: queries.adminApi.approveProof,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProofs'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    }
  });
}

export function useRejectProof() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }) => queries.adminApi.rejectProof(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProofs'] });
    }
  });
}

export function useCreateMission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: queries.adminApi.createMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    }
  });
}
