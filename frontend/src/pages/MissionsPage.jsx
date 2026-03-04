import React from 'react';
import { useMissions } from '../hooks/useQueries';
import { Link } from 'react-router-dom';

export default function MissionsPage() {
  const { data: missions, isLoading } = useMissions();

  if (isLoading) return <div className="text-center text-slate-400 py-8">Chargement...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">🎯 Missions disponibles</h1>

      {missions && missions.length > 0 ? (
        <div className="grid grid-cols-2 gap-6">
          {missions.map(mission => (
            <Link
              key={mission.id}
              to={`/mission/${mission.id}/upload`}
              className="card hover:border-blue-500 transition cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition">
                  {mission.title}
                </h3>
                <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full font-bold">
                  +{mission.points_per_proof}pts
                </span>
              </div>

              <p className="text-slate-400 mb-4">{mission.description}</p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <p className="text-slate-500 text-xs">Type</p>
                  <p className="text-white font-medium capitalize">{mission.action_type}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Max par utilisateur</p>
                  <p className="text-white font-medium">{mission.max_per_user} preuves</p>
                </div>
              </div>

              <button className="btn btn-primary w-full mt-4">
                Envoyer des preuves →
              </button>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-slate-400 text-lg">Aucune mission disponible pour le moment</p>
        </div>
      )}
    </div>
  );
}
