import React, { useState } from 'react';
import { useAdminProofDetail, useAdminProofs, useApproveProof, useRejectProof } from '../hooks/useQueries';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

function RejectModal({ onCancel, onConfirm }) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="surface-card reject-modal">
        <h3 className="section-title">Raison du rejet</h3>
        <textarea
          className="ui-input ui-textarea"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Expliquez la raison du rejet (optionnel)"
        />
        <div className="mission-actions">
          <button className="ui-btn-ghost" onClick={onCancel}>
            Annuler
          </button>
          <button className="ui-btn-danger" onClick={() => onConfirm(reason)}>
            Confirmer le rejet
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProofReviewPanel() {
  const [status, setStatus] = useState('pending');
  const [selectedId, setSelectedId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data: listData, isLoading: listLoading } = useAdminProofs(status);
  const { data: detail, isLoading: detailLoading } = useAdminProofDetail(selectedId);
  const { mutate: approveProof, isPending: isApproving } = useApproveProof();
  const { mutate: rejectProof, isPending: isRejecting } = useRejectProof();

  const proofs = listData?.proofs || [];

  const approve = () => {
    if (!selectedId) return;
    approveProof(selectedId, {
      onSuccess: (res) => {
        toast.success(`Preuve approuvee (+${res.data?.pointsAwarded || 0} pts)`);
        setSelectedId(null);
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Erreur approbation')
    });
  };

  const reject = (reason) => {
    setShowRejectModal(false);
    if (!selectedId) return;
    rejectProof(
      { id: selectedId, reason },
      {
        onSuccess: () => {
          toast.success('Preuve rejetee');
          setSelectedId(null);
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Erreur rejet')
      }
    );
  };

  return (
    <>
      {showRejectModal && <RejectModal onCancel={() => setShowRejectModal(false)} onConfirm={reject} />}

      <div className="proof-review-layout">
        <section className="surface-card proof-list-panel">
          <div className="proof-filter-bar">
            <button
              className={`proof-filter-btn ${status === 'pending' ? 'proof-filter-btn-active' : ''}`}
              onClick={() => {
                setStatus('pending');
                setSelectedId(null);
              }}
            >
              En attente ({status === 'pending' ? proofs.length : ''})
            </button>
            <button
              className={`proof-filter-btn ${status === 'approved' ? 'proof-filter-btn-active' : ''}`}
              onClick={() => {
                setStatus('approved');
                setSelectedId(null);
              }}
            >
              Approuvees
            </button>
            <button
              className={`proof-filter-btn ${status === 'rejected' ? 'proof-filter-btn-active' : ''}`}
              onClick={() => {
                setStatus('rejected');
                setSelectedId(null);
              }}
            >
              Rejetees
            </button>
          </div>

          {listLoading ? (
            <p className="cell-muted">Chargement...</p>
          ) : proofs.length === 0 ? (
            <p className="cell-muted">Aucune preuve a afficher.</p>
          ) : (
            <div className="proof-admin-list">
              {proofs.map((proof) => (
                <button
                  key={proof.id}
                  className={`proof-admin-item ${selectedId === proof.id ? 'proof-admin-item-active' : ''}`}
                  onClick={() => setSelectedId(proof.id)}
                >
                  <div>
                    <strong>@{proof.insta_username}</strong>
                    <p>{proof.title}</p>
                  </div>
                  <span className="chip">{proof.images_count} img</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="surface-card">
          {!selectedId ? (
            <p className="cell-muted">Selectionnez une preuve pour afficher le detail.</p>
          ) : detailLoading ? (
            <p className="cell-muted">Chargement detail...</p>
          ) : !detail ? (
            <p className="cell-muted">Detail indisponible.</p>
          ) : (
            <div>
              <div className="proof-card-head">
                <h3>@{detail.insta_username}</h3>
                <span className="chip">{detail.status}</span>
              </div>
              <p className="cell-muted">{detail.title}</p>
              <div className="mission-tags">
                <span className="chip">{detail.images_count} image(s)</span>
                <span className="chip">{detail.points_per_proof} pts / image</span>
                <span className="chip">{new Date(detail.created_at).toLocaleDateString('fr-FR')}</span>
              </div>

              <div className="proof-admin-images">
                {(detail.images || []).map((img) => (
                  <a
                    key={img.id}
                    href={`${API_URL}/uploads/proofs/${detail.user_id}/${img.image_path}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={`${API_URL}/uploads/proofs/${detail.user_id}/${img.image_path}`}
                      alt="preuve"
                      className="proof-admin-image"
                    />
                  </a>
                ))}
              </div>

              {status === 'pending' && (
                <div className="mission-actions">
                  <button className="ui-btn-primary" onClick={approve} disabled={isApproving || isRejecting}>
                    {isApproving ? 'Approbation...' : 'Approuver'}
                  </button>
                  <button
                    className="ui-btn-danger"
                    onClick={() => setShowRejectModal(true)}
                    disabled={isApproving || isRejecting}
                  >
                    Rejeter
                  </button>
                </div>
              )}

              {detail.status === 'rejected' && detail.reject_reason && (
                <div className="proof-reason">
                  <strong>Raison du rejet:</strong> {detail.reject_reason}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
