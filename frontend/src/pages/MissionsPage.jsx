import React from 'react';
import { Link } from 'react-router-dom';
import { useMissions } from '../hooks/useQueries';

export default function MissionsPage() {
  const { data: missions, isLoading } = useMissions();
  const list = missions || [];

  if (isLoading) return <div className="page-loading">Chargement...</div>;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">Missions disponibles</h1>
        <p className="page-subtitle">Selectionnez une mission et envoyez vos preuves.</p>
      </div>

      {list.length === 0 ? (
        <section className="surface-card">
          <p className="cell-muted">Aucune mission active pour le moment.</p>
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
