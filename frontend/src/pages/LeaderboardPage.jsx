import React from 'react';
import { useLeaderboard } from '../hooks/useQueries';

export default function LeaderboardPage() {
  const { data, isLoading } = useLeaderboard();

  if (isLoading) return <div className="text-center text-slate-400 py-8">Chargement...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">🏆 Classement</h1>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-slate-400">#</th>
              <th className="text-left py-3 px-4 text-slate-400">Promoteur</th>
              <th className="text-center py-3 px-4 text-slate-400">Points</th>
              <th className="text-center py-3 px-4 text-slate-400">Preuves</th>
            </tr>
          </thead>
          <tbody>
            {data?.leaderboard?.map((user, idx) => (
              <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700 transition">
                <td className="py-3 px-4 text-white font-bold">
                  {idx === 0 && '🥇'}
                  {idx === 1 && '🥈'}
                  {idx === 2 && '🥉'}
                  {idx > 2 && `#${idx + 1}`}
                </td>
                <td className="py-3 px-4 text-white">{user.insta_username}</td>
                <td className="py-3 px-4 text-center text-green-400 font-bold">{user.points_total}</td>
                <td className="py-3 px-4 text-center text-blue-400">{user.approved_proofs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
