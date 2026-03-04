import React from 'react';
import { useAdminStats } from '../hooks/useQueries';
import ProofReviewPanel from '../components/ProofReviewPanel';

export default function AdminProofsPage() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) return <div className="page-loading">Chargement...</div>;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">Validation des preuves</h1>
        <p className="page-subtitle">Moderez les preuves envoyees par les promoteurs.</p>
      </div>

      <div className="stats-grid">
        <div className="metric-card">
          <span className="metric-label">Preuves aujourd'hui</span>
          <strong className="metric-value">{stats?.proofs_today || 0}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Preuves en attente</span>
          <strong className="metric-value">{stats?.pending_proofs || 0}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Points distribues</span>
          <strong className="metric-value">{stats?.points_distributed_today || 0}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Promoteurs actifs</span>
          <strong className="metric-value">{stats?.active_promoters_today || 0}</strong>
        </div>
      </div>

      <ProofReviewPanel />
    </div>
  );
}
