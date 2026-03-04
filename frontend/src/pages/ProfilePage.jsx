import React from 'react';
import { useMyProfile } from '../hooks/useQueries';

export default function ProfilePage() {
  const { data, isLoading } = useMyProfile();

  if (isLoading) return <div className="text-center text-slate-400 py-8">Chargement...</div>;

  if (!data) return <div className="text-center text-red-400 py-8">Erreur de chargement</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Mon Profil</h1>

      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {data.user.first_name} {data.user.last_name}
            </h2>
            <p className="text-slate-400">@{data.user.insta_username}</p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold text-green-400">{data.user.points_total}</p>
            <p className="text-slate-400 text-sm">Points totaux</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-700">
          <div>
            <p className="text-slate-400 text-sm">Preuves envoyées</p>
            <p className="text-2xl font-bold text-white mt-1">{data.stats.proofs_submitted}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Preuves approuvées</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{data.stats.proofs_approved}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Classement</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">#{data.stats.rank}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-white font-bold text-lg mb-4">Points récents</h3>
        
        {data.recentPoints && data.recentPoints.length > 0 ? (
          <div className="space-y-3">
            {data.recentPoints.map(p => (
              <div key={p.id} className="flex justify-between items-center py-2 border-b border-slate-700">
                <div>
                  <p className="text-white">{p.reason}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(p.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <p className="text-green-400 font-bold">+{p.points}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-400 py-8">Aucun point gagné pour le moment</p>
        )}
      </div>
    </div>
  );
}
