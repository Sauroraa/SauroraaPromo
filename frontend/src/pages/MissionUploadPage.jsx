import React from 'react';
import { useParams } from 'react-router-dom';
import { useMissionDetail } from '../hooks/useQueries';
import DropzoneUpload from '../components/DropzoneUpload';

export default function MissionUploadPage() {
  const { missionId } = useParams();
  const { data: mission, isLoading, isError } = useMissionDetail(missionId);

  if (isLoading) return <div className="page-loading">Chargement...</div>;
  if (isError) return <div className="page-loading">Impossible de charger la mission pour le moment.</div>;
  if (!mission) return <div className="page-loading">Mission non trouvee</div>;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">{mission.title}</h1>
        <p className="page-subtitle">{mission.description || 'Ajoutez vos preuves pour cette mission.'}</p>
      </div>

      <div className="split-grid mission-layout">
        <section className="surface-card">
          <h2 className="section-title">Details mission</h2>
          <div className="mission-tags">
            <span className="chip">{mission.action_type}</span>
            <span className="chip chip-success">+{mission.points_per_proof} pts / preuve</span>
            <span className="chip">Max {mission.max_per_user}</span>
            {mission.deadline && (
              <span className="chip">Echeance: {new Date(mission.deadline).toLocaleDateString('fr-FR')}</span>
            )}
          </div>
        </section>

        <section className="surface-card">
          <h2 className="section-title">Envoyer des preuves</h2>
          <DropzoneUpload missionId={missionId} />
        </section>
      </div>
    </div>
  );
}
