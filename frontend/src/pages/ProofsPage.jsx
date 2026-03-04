import React, { useState } from 'react';
import { useMyProofs } from '../hooks/useQueries';

export default function ProofsPage() {
  const { data: proofs, isLoading } = useMyProofs();
  const [filter, setFilter] = useState('all');

  if (isLoading) return <div className="text-center text-slate-400 py-8">Chargement...</div>;

  const filtered = proofs?.filter(p => filter === 'all' || p.status === filter) || [];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Mes preuves</h1>

      <div className="mb-6 flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {s === 'all' && `Tous (${proofs?.length || 0})`}
            {s === 'pending' && '⏳ En attente'}
            {s === 'approved' && '✅ Approuvées'}
            {s === 'rejected' && '❌ Rejetées'}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.length > 0 ? (
          filtered.map(proof => (
            <div key={proof.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-bold text-lg">{proof.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{proof.images_count} image(s)</p>
                  <p className="text-slate-500 text-xs mt-2">
                    Envoyé: {new Date(proof.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`badge ${
                    proof.status === 'approved' ? 'badge-success' :
                    proof.status === 'pending' ? 'badge-pending' :
                    'badge-rejected'
                  }`}>
                    {proof.status === 'approved' && '✅ Approuvée'}
                    {proof.status === 'pending' && '⏳ En attente'}
                    {proof.status === 'rejected' && '❌ Rejetée'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-slate-400 py-8">Aucune preuve trouvée</p>
        )}
      </div>
    </div>
  );
}
