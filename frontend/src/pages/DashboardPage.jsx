import React from 'react';
import { useMissions } from '../hooks/useQueries';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { data: missions, isLoading } = useMissions();

  if (isLoading) return <div className="text-center text-slate-400 py-8">Chargement...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Mon Dashboard</h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="text-slate-400 text-sm">Points totaux</p>
          <p className="text-4xl font-bold text-green-400 mt-2">0</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Preuves envoyées</p>
          <p className="text-4xl font-bold text-blue-400 mt-2">0</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Missions actives</p>
          <p className="text-4xl font-bold text-purple-400 mt-2">{missions?.length || 0}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-white font-bold text-lg mb-4">Missions disponibles</h2>
        
        {missions && missions.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {missions.map(mission => (
              <Link
                key={mission.id}
                to={`/mission/${mission.id}/upload`}
                className="p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
              >
                <h3 className="text-white font-medium">{mission.title}</h3>
                <p className="text-sm text-slate-400 mt-1">{mission.description}</p>
                <p className="text-blue-400 font-bold mt-3">+{mission.points_per_proof} points par preuve</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">Aucune mission disponible</p>
        )}
      </div>
    </div>
  );
}
