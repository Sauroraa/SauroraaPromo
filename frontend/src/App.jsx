import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './lib/store';

// Layouts
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import MissionsPage from './pages/MissionsPage';
import MissionUploadPage from './pages/MissionUploadPage';
import ProofsPage from './pages/ProofsPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminProofsPage from './pages/AdminProofsPage';
import AdminMissionsPage from './pages/AdminMissionsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminInvitesPage from './pages/AdminInvitesPage';

import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false }
  }
});

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isLoggedIn, user } = useAuthStore();

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}

function LandingRoute() {
  const { isLoggedIn, user } = useAuthStore();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Promoter Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/missions" element={<ProtectedRoute><MissionsPage /></ProtectedRoute>} />
          <Route path="/mission/:missionId/upload" element={<ProtectedRoute><MissionUploadPage /></ProtectedRoute>} />
          <Route path="/proofs" element={<ProtectedRoute><ProofsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />

          {/* Staff + Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/proofs" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><AdminProofsPage /></ProtectedRoute>} />
          <Route path="/admin/missions" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><AdminMissionsPage /></ProtectedRoute>} />
          <Route path="/admin/invites" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><AdminInvitesPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsersPage /></ProtectedRoute>} />

          {/* Redirects */}
          <Route path="/" element={<LandingRoute />} />
          <Route path="*" element={<LandingRoute />} />
        </Routes>
      </Router>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </QueryClientProvider>
  );
}
