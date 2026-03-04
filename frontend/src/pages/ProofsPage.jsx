import React, { useMemo, useState } from 'react';
import { useMyProofs } from '../hooks/useQueries';

const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'pending', label: 'En attente' },
  { key: 'approved', label: 'Approuvees' },
  { key: 'rejected', label: 'Rejetees' }
];

function statusChip(status) {
  if (status === 'approved') return 'chip chip-success';
  if (status === 'pending') return 'chip chip-warning';
  return 'chip';
}

function statusLabel(status) {
  if (status === 'approved') return 'Approuvee';
  if (status === 'pending') return 'En attente';
  if (status === 'rejected') return 'Rejetee';
  return status;
}

export default function ProofsPage() {
  const { data: proofs, isLoading } = useMyProofs();
  const [filter, setFilter] = useState('all');
  const list = proofs || [];

  const filtered = useMemo(() => {
    if (filter === 'all') return list;
    return list.filter((p) => p.status === filter);
  }, [list, filter]);

  if (isLoading) return <div className="page-loading">Chargement...</div>;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">Mes preuves</h1>
        <p className="page-subtitle">Suivez le statut de toutes vos soumissions.</p>
      </div>

      <div className="proof-filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`proof-filter-btn ${filter === f.key ? 'proof-filter-btn-active' : ''}`}
          >
            {f.label}
            {f.key === 'all' ? ` (${list.length})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <section className="surface-card">
          <p className="cell-muted">Aucune preuve trouvee pour ce filtre.</p>
        </section>
      ) : (
        <section className="proof-grid">
          {filtered.map((proof) => (
            <article key={proof.id} className="proof-card">
              <div className="proof-card-head">
                <h3>{proof.title}</h3>
                <span className={statusChip(proof.status)}>{statusLabel(proof.status)}</span>
              </div>

              <div className="mission-tags">
                <span className="chip">{proof.images_count} image(s)</span>
                <span className="chip">{new Date(proof.created_at).toLocaleDateString('fr-FR')}</span>
                {proof.reviewed_at && <span className="chip">Revise: {new Date(proof.reviewed_at).toLocaleDateString('fr-FR')}</span>}
              </div>

              {proof.reject_reason && (
                <div className="proof-reason">
                  <strong>Motif:</strong> {proof.reject_reason}
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
