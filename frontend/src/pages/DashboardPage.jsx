import React from 'react';
import { Link } from 'react-router-dom';
import { useMissions, useMyProfile } from '../hooks/useQueries';

export default function DashboardPage() {
  const { data: missions, isLoading: missionsLoading } = useMissions();
  const { data: profile, isLoading: profileLoading } = useMyProfile();

  const isLoading = missionsLoading || profileLoading;

  if (isLoading) return <div className="text-center text-slate-400 py-8">Chargement...</div>;

  const stats = profile?.stats;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Bonjour, {profile?.user?.first_name} !
        </h1>
        <p className="text-slate-400 mt-1">@{profile?.user?.insta_username}</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="text-slate-400 text-sm">Points totaux</p>
          <p className="text-4xl font-bold text-green-400 mt-2">
            {profile?.user?.points_total ?? 0}
          </p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Preuves envoyées</p>
          <p className="text-4xl font-bold text-blue-400 mt-2">
            {stats?.proofs_submitted ?? 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {stats?.proofs_approved ?? 0} approuvées
          </p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Classement</p>
          <p className="text-4xl font-bold text-purple-400 mt-2">
            #{stats?.rank ?? '—'}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-bold text-lg">
            Missions disponibles ({missions?.length ?? 0})
          </h2>
          <Link to="/missions" className="text-blue-400 text-sm hover:underline">
            Voir toutes
          </Link>
        </div>

        {missions && missions.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {missions.slice(0, 4).map(mission => (
              <Link
                key={mission.id}
                to={`/mission/${mission.id}/upload`}
                className="p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition block"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-slate-600 px-2 py-0.5 rounded text-slate-300 uppercase">
                    {mission.action_type}
                  </span>
                </div>
                <h3 className="text-white font-medium">{mission.title}</h3>
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{mission.description}</p>
                <p className="text-green-400 font-bold mt-3">+{mission.points_per_proof} pt par preuve</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-8">Aucune mission disponible pour le moment</p>
        )}
      </div>

      {profile?.recentPoints && profile.recentPoints.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-white font-bold text-lg mb-4">Derniers points gagnés</h2>
          <div className="space-y-2">
            {profile.recentPoints.map(p => (
              <div key={p.id} className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                <div>
                  <p className="text-white text-sm">{p.reason}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(p.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <p className="text-green-400 font-bold">+{p.points}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
