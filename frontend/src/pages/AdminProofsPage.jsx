import React from 'react';
import ProofReviewPanel from '../components/ProofReviewPanel';
import { useAdminStats } from '../hooks/useQueries';

export default function AdminProofsPage() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) return <div className="text-center text-slate-400 py-8">Chargement...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Gestion des preuves</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-slate-400 text-sm">Preuves aujourd'hui</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">{stats?.proofs_today || 0}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Preuves en attente</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">{stats?.pending_proofs || 0}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Points distribués</p>
          <p className="text-3xl font-bold text-green-400 mt-2">{stats?.points_distributed_today || 0}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Promoteurs actifs</p>
          <p className="text-3xl font-bold text-purple-400 mt-2">{stats?.active_promoters_today || 0}</p>
        </div>
      </div>

      <div className="card">
        <ProofReviewPanel />
      </div>
    </div>
  );
}
