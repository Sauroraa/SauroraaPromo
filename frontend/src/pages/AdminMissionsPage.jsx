import React from 'react';
import MissionForm from '../components/MissionForm';
import { useMissions } from '../hooks/useQueries';

export default function AdminMissionsPage() {
  const { data: missions, isLoading, refetch } = useMissions();

  if (isLoading) return <div className="text-center text-slate-400 py-8">Chargement...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Gestion des missions</h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <MissionForm onSuccess={() => refetch()} />
        </div>

        <div className="col-span-2 card">
          <h2 className="text-white font-bold text-lg mb-4">Missions actives ({missions?.length || 0})</h2>
          
          <div className="space-y-3">
            {missions?.map(mission => (
              <div key={mission.id} className="p-4 bg-slate-700 rounded-lg">
                <h3 className="text-white font-medium">{mission.title}</h3>
                <p className="text-sm text-slate-400 mt-1">{mission.description}</p>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-blue-400">📊 {mission.action_type}</span>
                  <span className="text-green-400">⭐ {mission.points_per_proof} pts</span>
                  <span className="text-purple-400">👥 Max {mission.max_per_user}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
