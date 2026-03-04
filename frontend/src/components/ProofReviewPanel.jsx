import React, { useState } from 'react';
import {
  useAdminProofs,
  useAdminProofDetail,
  useApproveProof,
  useRejectProof
} from '../hooks/useQueries';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

function RejectModal({ onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-white font-bold text-lg mb-4">Raison du rejet</h3>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Optionnel — explique pourquoi la preuve est refusée..."
          className="input w-full h-28 resize-none mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn btn-secondary flex-1">Annuler</button>
          <button
            onClick={() => onConfirm(reason)}
            className="btn btn-danger flex-1"
          >
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

  const { mutate: approve, isPending: isApproving } = useApproveProof();
  const { mutate: reject, isPending: isRejecting } = useRejectProof();

  const proofs = listData?.proofs ?? [];

  const handleApprove = () => {
    approve(selectedId, {
      onSuccess: (res) => {
        toast.success(`Preuve approuvée — +${res.data?.pointsAwarded ?? 0} points`);
        setSelectedId(null);
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Erreur lors de l\'approbation')
    });
  };

  const handleRejectConfirm = (reason) => {
    setShowRejectModal(false);
    reject({ id: selectedId, reason }, {
      onSuccess: () => {
        toast.success('Preuve rejetée');
        setSelectedId(null);
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Erreur lors du rejet')
    });
  };

  const statusLabels = {
    pending: `⏳ En attente${status === 'pending' ? ` (${proofs.length})` : ''}`,
    approved: '✅ Approuvées',
    rejected: '❌ Rejetées'
  };

  return (
    <>
      {showRejectModal && (
        <RejectModal
          onConfirm={handleRejectConfirm}
          onCancel={() => setShowRejectModal(false)}
        />
      )}

      <div className="grid grid-cols-5 gap-6">
        {/* Liste des preuves */}
        <div className="col-span-2">
          <div className="mb-4 flex gap-2 flex-wrap">
            {Object.entries(statusLabels).map(([s, label]) => (
              <button
                key={s}
                onClick={() => { setStatus(s); setSelectedId(null); }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  status === s ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {listLoading ? (
            <p className="text-slate-400 text-sm text-center py-4">Chargement...</p>
          ) : proofs.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Aucune preuve</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {proofs.map(proof => (
                <div
                  key={proof.id}
                  onClick={() => setSelectedId(proof.id)}
                  className={`p-3 rounded-lg cursor-pointer transition border ${
                    selectedId === proof.id
                      ? 'bg-blue-600 border-blue-500'
                      : 'bg-slate-700 hover:bg-slate-600 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-white text-sm">@{proof.insta_username}</p>
                    <p className="text-xs text-slate-400">{proof.images_count} img</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{proof.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(proof.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Détail de la preuve */}
        <div className="col-span-3">
          {!selectedId ? (
            <div className="flex items-center justify-center h-64 text-slate-500">
              Sélectionne une preuve pour la reviewer
            </div>
          ) : detailLoading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              Chargement...
            </div>
          ) : detail ? (
            <div>
              <div className="mb-4">
                <h3 className="text-white font-bold text-lg">@{detail.insta_username}</h3>
                <p className="text-slate-400 text-sm">{detail.title}</p>
                <div className="flex gap-3 mt-2 text-sm">
                  <span className="text-blue-400">{detail.images_count} image(s)</span>
                  <span className="text-green-400">{detail.points_per_proof} pt/img</span>
                  <span className="text-slate-500">
                    Soumis le {new Date(detail.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 max-h-96 overflow-y-auto">
                {detail.images?.map(img => (
                  <a
                    key={img.id}
                    href={`${API_URL}/uploads/proofs/${detail.user_id}/${img.image_path}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={`${API_URL}/uploads/proofs/${detail.user_id}/${img.image_path}`}
                      alt="preuve"
                      className="w-full rounded-lg object-cover hover:opacity-90 transition"
                    />
                  </a>
                ))}
              </div>

              {status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={isApproving || isRejecting}
                    className="btn btn-success flex-1"
                  >
                    {isApproving ? 'Approbation...' : '✅ Approuver tout'}
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={isApproving || isRejecting}
                    className="btn btn-danger flex-1"
                  >
                    ❌ Rejeter
                  </button>
                </div>
              )}

              {detail.status === 'rejected' && detail.reject_reason && (
                <div className="mt-3 p-3 bg-red-900 bg-opacity-30 border border-red-800 rounded-lg">
                  <p className="text-red-400 text-sm font-medium">Raison du rejet :</p>
                  <p className="text-red-300 text-sm mt-1">{detail.reject_reason}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
