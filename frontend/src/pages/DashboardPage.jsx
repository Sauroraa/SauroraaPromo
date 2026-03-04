import React from 'react';
import { Link } from 'react-router-dom';
import { useMissions, useMyProfile } from '../hooks/useQueries';

export default function DashboardPage() {
  const { data: missions, isLoading: missionsLoading } = useMissions();
  const { data: profile, isLoading: profileLoading } = useMyProfile();

  const isLoading = missionsLoading || profileLoading;
  if (isLoading) return <div className="page-loading">Chargement...</div>;

  const stats = profile?.stats || {};
  const user = profile?.user || {};
  const missionsList = missions || [];
  const recentPoints = profile?.recentPoints || [];

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">Bonjour, {user.first_name || 'Promoteur'}</h1>
        <p className="page-subtitle">
          @{user.insta_username || 'compte'} · Suivi de vos missions et performances
        </p>
      </div>

      <div className="stats-grid dashboard-kpis">
        <div className="metric-card metric-card-accent-green">
          <span className="metric-label">Points totaux</span>
          <strong className="metric-value">{user.points_total ?? 0}</strong>
          <span className="cell-muted">Progression personnelle</span>
        </div>
        <div className="metric-card metric-card-accent-blue">
          <span className="metric-label">Preuves envoyees</span>
          <strong className="metric-value">{stats.proofs_submitted ?? 0}</strong>
          <span className="cell-muted">{stats.proofs_approved ?? 0} approuvees</span>
        </div>
        <div className="metric-card metric-card-accent-indigo">
          <span className="metric-label">Classement</span>
          <strong className="metric-value">#{stats.rank ?? '-'}</strong>
          <span className="cell-muted">Leaderboard Promoteam</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Missions actives</span>
          <strong className="metric-value">{missionsList.length}</strong>
          <span className="cell-muted">Disponibles pour envoi de preuves</span>
        </div>
      </div>

      <div className="split-grid mission-layout">
        <section className="surface-card">
          <div className="section-head">
            <h2>Missions disponibles ({missionsList.length})</h2>
            <Link to="/missions" className="ui-btn-ghost mission-link-btn">
              Voir toutes les missions
            </Link>
          </div>

          {missionsList.length > 0 ? (
            <div className="mission-grid">
              {missionsList.slice(0, 4).map((mission) => (
                <article key={mission.id} className="mission-card">
                  <div className="mission-item-head">
                    <div>
                      <h3>{mission.title}</h3>
                      <p>{mission.description || 'Mission sans description'}</p>
                    </div>
                    <span className="chip">{mission.action_type}</span>
                  </div>

                  <div className="mission-tags">
                    <span className="chip chip-success">+{mission.points_per_proof} pts / mission</span>
                    <span className="chip">Max: {mission.max_per_user}</span>
                  </div>

                  <Link to={`/mission/${mission.id}/upload`} className="mission-cta">
                    Envoyer une preuve →
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className="cell-muted">Aucune mission disponible pour le moment.</p>
          )}
        </section>

        <section className="surface-card">
          <h2 className="section-title">Derniers points gagnés</h2>
          {recentPoints.length > 0 ? (
            <div className="proof-admin-list" style={{ marginTop: '12px' }}>
              {recentPoints.map((point) => (
                <div key={point.id} className="proof-admin-item">
                  <div>
                    <strong>{point.reason || 'Mission validee'}</strong>
                    <p>{new Date(point.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className="chip chip-success">+{point.points}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="cell-muted" style={{ marginTop: '12px' }}>
              Aucun point recent pour le moment.
            </p>
          )}
        </section>
      </div>

      <section className="surface-card" style={{ marginTop: '14px' }}>
        <div className="section-head">
          <h2>Actions rapides</h2>
          <span className="cell-muted">Navigation directe</span>
        </div>
        <div className="mission-actions">
          <Link to="/proofs" className="ui-btn-primary mission-link-btn">Mes preuves</Link>
          <Link to="/leaderboard" className="ui-btn-ghost mission-link-btn">Classement</Link>
          <Link to="/profile" className="ui-btn-ghost mission-link-btn">Mon profil</Link>
        </div>
      </section>
    </div>
  );
}
