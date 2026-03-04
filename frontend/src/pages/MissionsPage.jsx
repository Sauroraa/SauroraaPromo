import React from 'react';
import { Link } from 'react-router-dom';
import { useMissions } from '../hooks/useQueries';

export default function MissionsPage() {
  const { data: missions, isLoading, isError } = useMissions();
  const list = missions || [];

  if (isLoading) return <div className="page-loading">Chargement...</div>;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">Missions disponibles</h1>
        <p className="page-subtitle">Selectionnez une mission et envoyez vos preuves.</p>
      </div>

      <div className="stats-grid dashboard-kpis">
        <div className="metric-card metric-card-accent-indigo">
          <span className="metric-label">Missions actives</span>
          <strong className="metric-value">{list.length}</strong>
          <span className="cell-muted">Disponibles maintenant</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Type de missions</span>
          <strong className="metric-value">{new Set(list.map((m) => m.action_type)).size || 0}</strong>
          <span className="cell-muted">Actions differentes</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Points max / preuve</span>
          <strong className="metric-value">
            {list.length ? Math.max(...list.map((m) => Number(m.points_per_proof || 0))) : 0}
          </strong>
          <span className="cell-muted">Potentiel de gain</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Action rapide</span>
          <Link to="/proofs" className="mission-cta" style={{ marginTop: '6px' }}>
            Voir mes preuves →
          </Link>
        </div>
      </div>

      {isError ? (
        <section className="surface-card">
          <div className="empty-block">
            <h3>Impossible de charger les missions</h3>
            <p>Le serveur est temporairement indisponible. Reessayez dans quelques secondes.</p>
          </div>
        </section>
      ) : list.length === 0 ? (
        <section className="surface-card">
          <div className="empty-block">
            <h3>Aucune mission active pour le moment</h3>
            <p>Les missions apparaitront ici des qu'un staff/admin en publie une.</p>
            <div className="mission-actions">
              <Link to="/dashboard" className="ui-btn-ghost mission-link-btn">
                Retour dashboard
              </Link>
              <Link to="/proofs" className="ui-btn-primary mission-link-btn">
                Voir mes preuves
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="mission-grid">
          {list.map((mission) => (
            <Link key={mission.id} to={`/mission/${mission.id}/upload`} className="mission-card">
              <div className="mission-item-head">
                <div>
                  <h3>{mission.title}</h3>
                  <p>{mission.description || 'Sans description'}</p>
                </div>
                <span className="chip chip-success">+{mission.points_per_proof} pts</span>
              </div>

              <div className="mission-tags">
                <span className="chip">{mission.action_type}</span>
                <span className="chip">Max {mission.max_per_user}</span>
                {mission.deadline && (
                  <span className="chip">Echeance: {new Date(mission.deadline).toLocaleDateString('fr-FR')}</span>
                )}
              </div>

              <span className="mission-cta">Uploader mes preuves</span>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
