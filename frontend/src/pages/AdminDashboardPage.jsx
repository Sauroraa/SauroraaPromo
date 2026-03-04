import React from 'react';
import { useAdminStats, useAdminProofs } from '../hooks/useQueries';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: proofs } = useAdminProofs('all', 5);

  if (statsLoading) return <div className="text-center text-slate-400 py-8">Chargement...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">📊 Dashboard Admin</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-slate-400 text-sm">Promoteurs</p>
          <p className="text-3xl font-bold text-purple-400 mt-2">{stats?.total_promoters || 0}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Preuves aujourd'hui</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">{stats?.proofs_today || 0}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Points distribués</p>
          <p className="text-3xl font-bold text-green-400 mt-2">{stats?.points_distributed_today || 0}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">En attente</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">{stats?.pending_proofs || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Missions actives */}
        <div className="card">
          <h3 className="text-white font-bold text-lg mb-4">Missions actives</h3>
          <p className="text-4xl font-bold text-blue-400">{stats?.active_missions || 0}</p>
        </div>

        {/* Promoteurs actifs */}
        <div className="card">
          <h3 className="text-white font-bold text-lg mb-4">Actifs aujourd'hui</h3>
          <p className="text-4xl font-bold text-green-400">{stats?.active_promoters_today || 0}</p>
        </div>

        {/* Quick actions */}
        <div className="card">
          <h3 className="text-white font-bold text-lg mb-4">Actions rapides</h3>
          <div className="space-y-2">
            <a href="/admin/proofs" className="block btn btn-primary text-center">
              Valider preuves
            </a>
            <a href="/admin/missions" className="block btn btn-secondary text-center">
              Créer mission
            </a>
          </div>
        </div>
      </div>

      {/* Recent proofs */}
      {proofs?.proofs?.length > 0 && (
        <div className="card mt-8">
          <h3 className="text-white font-bold text-lg mb-4">Dernières preuves</h3>
          <div className="space-y-2">
            {proofs.proofs.slice(0, 5).map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 bg-slate-700 rounded">
                <div>
                  <p className="text-white">{p.insta_username} - {p.title}</p>
                  <p className="text-xs text-slate-400">{p.images_count} images</p>
                </div>
                <span className={`badge ${
                  p.status === 'approved' ? 'badge-success' :
                  p.status === 'pending' ? 'badge-pending' :
                  'badge-rejected'
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
