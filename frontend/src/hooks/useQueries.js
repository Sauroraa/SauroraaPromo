import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as queries from '../lib/queries';

// Auth hooks
export function useLogin() {
  return useMutation({ mutationFn: queries.authApi.login });
}

export function useRegister() {
  return useMutation({ mutationFn: queries.authApi.register });
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
    queryFn: () => queries.missionsApi.getAll().then(r => r.data),
    staleTime: 5 * 60 * 1000
  });
}

export function useMissionDetail(id) {
  return useQuery({
    queryKey: ['mission', id],
    queryFn: () => queries.missionsApi.getById(id).then(r => r.data),
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
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    }
  });
}

export function useMyProofs() {
  return useQuery({
    queryKey: ['myProofs'],
    queryFn: () => queries.proofsApi.getMyProofs().then(r => r.data)
  });
}

// Users hooks
export function useLeaderboard(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['leaderboard', limit, offset],
    queryFn: () => queries.usersApi.getLeaderboard(limit, offset).then(r => r.data)
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['myProfile'],
    queryFn: () => queries.usersApi.getMyProfile().then(r => r.data)
  });
}

// Admin hooks
export function useAdminStats() {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: () => queries.adminApi.getStats().then(r => r.data),
    refetchInterval: 60 * 1000
  });
}

export function useAdminProofs(status, limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['adminProofs', status, limit, offset],
    queryFn: () => queries.adminApi.getProofs(status, limit, offset).then(r => r.data)
  });
}

export function useAdminProofDetail(id) {
  return useQuery({
    queryKey: ['adminProofDetail', id],
    queryFn: () => queries.adminApi.getProofDetail(id).then(r => r.data),
    enabled: !!id
  });
}

export function useApproveProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => queries.adminApi.approveProof(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProofs'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminProofDetail'] });
    }
  });
}

export function useRejectProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => queries.adminApi.rejectProof(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProofs'] });
      queryClient.invalidateQueries({ queryKey: ['adminProofDetail'] });
    }
  });
}

export function useAdminMissions() {
  return useQuery({
    queryKey: ['adminMissions'],
    queryFn: () => queries.adminApi.getMissions().then(r => r.data)
  });
}

export function useCreateMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => queries.adminApi.createMission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['adminMissions'] });
    }
  });
}

export function useUpdateMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => queries.adminApi.updateMission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['adminMissions'] });
    }
  });
}

export function useDeleteMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => queries.adminApi.deleteMission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['adminMissions'] });
    }
  });
}

export function useAdminUsers(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['adminUsers', limit, offset],
    queryFn: () => queries.adminApi.getUsers(limit, offset).then(r => r.data)
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => queries.adminApi.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    }
  });
}

export function useGenerateInvites() {
  return useMutation({
    mutationFn: ({ count, expiresIn }) => queries.adminApi.generateInvites(count, expiresIn)
  });
}

export function useAdminInvites() {
  return useQuery({
    queryKey: ['adminInvites'],
    queryFn: () => queries.adminApi.getInvites().then(r => r.data)
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => queries.adminApi.createInvite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInvites'] });
    }
  });
}
