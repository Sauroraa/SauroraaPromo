import React from 'react';
import { useParams } from 'react-router-dom';
import { useMissionDetail } from '../hooks/useQueries';
import DropzoneUpload from '../components/DropzoneUpload';

export default function MissionUploadPage() {
  const { missionId } = useParams();
  const { data: mission, isLoading } = useMissionDetail(missionId);

  if (isLoading) return <div className="text-center text-slate-400 py-8">Chargement...</div>;

  if (!mission) return <div className="text-center text-red-400 py-8">Mission non trouvée</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">{mission.title}</h1>
        <p className="text-slate-400 mb-4">{mission.description}</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-slate-400 text-sm">Type d'action</p>
            <p className="text-white font-medium capitalize">{mission.action_type}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Points par preuve</p>
            <p className="text-green-400 font-bold">+{mission.points_per_proof}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-white font-bold text-lg mb-4">Envoyer des preuves</h2>
        <DropzoneUpload missionId={missionId} />
      </div>
    </div>
  );
}
