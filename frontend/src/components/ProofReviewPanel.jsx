import React, { useState } from 'react';
import { useAdminProofs, useApproveProof, useRejectProof } from '../hooks/useQueries';
import toast from 'react-hot-toast';

export default function ProofReviewPanel() {
  const [status, setStatus] = useState('pending');
  const [selectedProof, setSelectedProof] = useState(null);
  
  const { data, isLoading } = useAdminProofs(status);
  const { mutate: approve, isPending: isApproving } = useApproveProof();
  const { mutate: reject, isPending: isRejecting } = useRejectProof();

  const handleApprove = (proofId) => {
    approve(proofId, {
      onSuccess: () => {
        toast.success('Preuve approuvée');
        setSelectedProof(null);
      },
      onError: () => toast.error('Erreur lors de l\'approbation')
    });
  };

  const handleReject = (proofId) => {
    const reason = prompt('Raison du rejet:');
    if (reason) {
      reject({ id: proofId, reason }, {
        onSuccess: () => {
          toast.success('Preuve rejetée');
          setSelectedProof(null);
        },
        onError: () => toast.error('Erreur lors du rejet')
      });
    }
  };

  if (isLoading) return <div className="text-center text-slate-400">Chargement...</div>;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="mb-4 flex gap-2">
          {['pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-2 rounded font-medium transition ${
                status === s ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              {s === 'pending' && `⏳ En attente (${data?.proofs?.length || 0})`}
              {s === 'approved' && '✅ Approuvées'}
              {s === 'rejected' && '❌ Rejetées'}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {data?.proofs?.map(proof => (
            <div
              key={proof.id}
              onClick={() => setSelectedProof(proof)}
              className={`p-3 rounded-lg cursor-pointer transition ${
                selectedProof?.id === proof.id
                  ? 'bg-blue-600'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              <p className="font-medium text-white">{proof.insta_username}</p>
              <p className="text-xs text-slate-400">{proof.title}</p>
              <p className="text-xs text-slate-500">{proof.images_count} images</p>
            </div>
          ))}
        </div>
      </div>

      {selectedProof && (
        <div className="card">
          <h3 className="text-white font-bold mb-4">
            {selectedProof.insta_username} - {selectedProof.title}
          </h3>

          <div className="mb-4">
            <p className="text-slate-400 text-sm mb-2">Images soumises:</p>
            <div className="grid grid-cols-2 gap-2">
              {selectedProof.images?.map(img => (
                <img
                  key={img.id}
                  src={`/uploads/proofs/${selectedProof.user_id}/${img.image_path}`}
                  alt="proof"
                  className="w-full rounded"
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {status === 'pending' && (
              <>
                <button
                  onClick={() => handleApprove(selectedProof.id)}
                  disabled={isApproving}
                  className="btn btn-success flex-1"
                >
                  ✅ Approuver
                </button>
                <button
                  onClick={() => handleReject(selectedProof.id)}
                  disabled={isRejecting}
                  className="btn btn-danger flex-1"
                >
                  ❌ Rejeter
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
