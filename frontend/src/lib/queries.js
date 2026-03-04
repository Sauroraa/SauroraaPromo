import api from './api';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  getInvite: (token) => api.get(`/invite/${token}`),
  acceptInvite: (data) => api.post('/invite/accept', data)
};

export const missionsApi = {
  getAll: () => api.get('/missions'),
  getById: (id) => api.get(`/missions/${id}`),
  getStats: (id) => api.get(`/missions/${id}/stats`)
};

export const proofsApi = {
  submit: (formData) => api.post('/proofs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyProofs: () => api.get('/proofs/my'),
  getDetails: (id) => api.get(`/proofs/${id}`)
};

export const usersApi = {
  getProfile: (id) => api.get(`/users/${id}`),
  getMyProfile: () => api.get('/users/me'),
  getMyNotifications: (limit = 20) => api.get(`/users/me/notifications?limit=${limit}`),
  getLeaderboard: (limit = 20, offset = 0) => 
    api.get(`/users/leaderboard?limit=${limit}&offset=${offset}`),
  updateProfile: (data) => api.patch('/users/me', data)
};

export const adminApi = {
  getProofs: (status, limit = 50, offset = 0) => {
    const params = new URLSearchParams({ limit, offset });
    if (status) params.set('status', status);
    return api.get(`/admin/proofs?${params}`);
  },
  getMissions: (limit = 100, offset = 0) =>
    api.get(`/admin/missions?limit=${limit}&offset=${offset}`),
  getProofDetail: (id) => api.get(`/admin/proofs/${id}`),
  approveProof: (id) => api.post(`/admin/proofs/${id}/approve`),
  rejectProof: (id, reason) => api.post(`/admin/proofs/${id}/reject`, { reason }),
  
  createMission: (data) => api.post('/admin/missions', data),
  updateMission: (id, data) => api.patch(`/admin/missions/${id}`, data),
  deleteMission: (id) => api.delete(`/admin/missions/${id}`),
  
  getStats: () => api.get('/admin/stats'),
  getActivity: (days = 7) => api.get(`/admin/activity?days=${days}`),
  getTopPromoters: (limit = 10) => api.get(`/admin/top-promoters?limit=${limit}`),
  
  getUsers: (limit = 50, offset = 0) => api.get(`/admin/users?limit=${limit}&offset=${offset}`),
  updateUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),

  getInvites: () => api.get('/admin/invites'),
  createInvite: (data) => api.post('/admin/invite', data),
  resendInvite: (id) => api.post(`/admin/invites/${id}/resend`),
  deleteInvite: (id) => api.delete(`/admin/invites/${id}`),
  generateInvites: (count, expiresIn) => api.post('/admin/invites', { count, expiresIn })
};
