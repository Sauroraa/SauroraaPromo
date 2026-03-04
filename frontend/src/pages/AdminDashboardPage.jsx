import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminProofs, useAdminStats } from '../hooks/useQueries';

function proofStatusLabel(status) {
  if (status === 'approved') return 'Approuvee';
  if (status === 'pending') return 'En attente';
  if (status === 'rejected') return 'Rejetee';
  return status;
}

function proofStatusClass(status) {
  if (status === 'approved') return 'chip chip-success';
  if (status === 'pending') return 'chip chip-warning';
  return 'chip';
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: proofsData } = useAdminProofs('all', 8);
  const proofs = proofsData?.proofs || [];

  if (isLoading) return <div className="page-loading">Chargement...</div>;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">Dashboard Admin</h1>
        <p className="page-subtitle">Pilotage global de la plateforme Promoteam.</p>
      </div>

      <div className="stats-grid">
        <div className="metric-card">
          <span className="metric-label">Promoteurs</span>
          <strong className="metric-value">{stats?.total_promoters || 0}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Preuves aujourd'hui</span>
          <strong className="metric-value">{stats?.proofs_today || 0}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Points distribues</span>
          <strong className="metric-value">{stats?.points_distributed_today || 0}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Preuves en attente</span>
          <strong className="metric-value">{stats?.pending_proofs || 0}</strong>
        </div>
      </div>

      <div className="split-grid">
        <section className="surface-card">
          <h2 className="section-title">Activite</h2>
          <div className="mission-tags">
            <span className="chip">Missions actives: {stats?.active_missions || 0}</span>
            <span className="chip">Actifs aujourd'hui: {stats?.active_promoters_today || 0}</span>
          </div>

          <div className="mission-actions">
            <Link to="/admin/proofs" className="ui-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', textDecoration: 'none' }}>
              Valider les preuves
            </Link>
            <Link to="/admin/missions" className="ui-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', textDecoration: 'none' }}>
              Gerer les missions
            </Link>
            <Link to="/admin/users" className="ui-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', textDecoration: 'none' }}>
              Gerer les utilisateurs
            </Link>
          </div>
        </section>

        <section className="surface-card">
          <h2 className="section-title">Dernieres preuves</h2>
          {proofs.length === 0 ? (
            <p className="cell-muted">Aucune preuve recente.</p>
          ) : (
            <div className="proof-admin-list">
              {proofs.slice(0, 6).map((proof) => (
                <div key={proof.id} className="proof-admin-item">
                  <div>
                    <strong>@{proof.insta_username}</strong>
                    <p>{proof.title}</p>
                  </div>
                  <span className={proofStatusClass(proof.status)}>{proofStatusLabel(proof.status)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
