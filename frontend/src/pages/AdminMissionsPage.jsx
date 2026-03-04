import React, { useState } from 'react';
import { useAdminMissions, useCreateMission, useUpdateMission, useDeleteMission } from '../hooks/useQueries';
import toast from 'react-hot-toast';

const ACTION_LABELS = {
  like: 'Like', comment: 'Commentaire', share: 'Partage',
  story: 'Story', post: 'Post', follow: 'Follow'
};

const EMPTY_FORM = {
  title: '', description: '', action_type: 'like',
  points_per_proof: 1, max_per_user: 10, deadline: '', active: true
};

function MissionForm({ initial = EMPTY_FORM, onSubmit, isPending, submitLabel }) {
  const [form, setForm] = useState(initial);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked
        : ['points_per_proof', 'max_per_user'].includes(name) ? parseInt(value) || 1
        : value
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h3 className="text-white font-bold text-lg">
        {submitLabel === 'Créer' ? 'Nouvelle mission' : 'Modifier la mission'}
      </h3>

      <input type="text" name="title" placeholder="Titre" value={form.title}
        onChange={handle} className="input" required />

      <textarea name="description" placeholder="Description" value={form.description}
        onChange={handle} className="input h-20 resize-none" />

      <select name="action_type" value={form.action_type} onChange={handle} className="input">
        {Object.entries(ACTION_LABELS).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 text-xs">Points par preuve</label>
          <input type="number" name="points_per_proof" value={form.points_per_proof}
            onChange={handle} className="input mt-1" min="1" required />
        </div>
        <div>
          <label className="text-slate-400 text-xs">Max par utilisateur</label>
          <input type="number" name="max_per_user" value={form.max_per_user}
            onChange={handle} className="input mt-1" min="1" required />
        </div>
      </div>

      <div>
        <label className="text-slate-400 text-xs">Deadline (optionnel)</label>
        <input type="datetime-local" name="deadline" value={form.deadline}
          onChange={handle} className="input mt-1" />
      </div>

      {submitLabel !== 'Créer' && (
        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
          <input type="checkbox" name="active" checked={form.active} onChange={handle}
            className="w-4 h-4 accent-blue-500" />
          Mission active
        </label>
      )}

      <button type="submit" disabled={isPending} className="btn btn-primary w-full">
        {isPending ? 'Enregistrement...' : submitLabel}
      </button>
    </form>
  );
}

export default function AdminMissionsPage() {
  const { data, isLoading } = useAdminMissions();
  const { mutate: create, isPending: isCreating } = useCreateMission();
  const { mutate: update, isPending: isUpdating } = useUpdateMission();
  const { mutate: deleteMission, isPending: isDeleting } = useDeleteMission();

  const [editingMission, setEditingMission] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const missions = data?.missions ?? [];

  const handleCreate = (form) => {
    create(form, {
      onSuccess: () => toast.success('Mission créée'),
      onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
    });
  };

  const handleUpdate = (form) => {
    update({ id: editingMission.id, data: form }, {
      onSuccess: () => {
        toast.success('Mission mise à jour');
        setEditingMission(null);
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
    });
  };

  const handleDelete = (id) => {
    deleteMission(id, {
      onSuccess: () => {
        toast.success('Mission supprimée');
        setConfirmDeleteId(null);
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
    });
  };

  if (isLoading) return <div className="text-center text-slate-400 py-8">Chargement...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Gestion des missions</h1>

      {/* Confirm delete modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-white font-bold text-lg mb-2">Supprimer la mission ?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Cette action est irréversible. Toutes les preuves associées seront supprimées.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="btn btn-secondary flex-1">
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={isDeleting}
                className="btn btn-danger flex-1"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left: form */}
        <div className="col-span-1">
          {editingMission ? (
            <div>
              <MissionForm
                initial={{
                  title: editingMission.title,
                  description: editingMission.description || '',
                  action_type: editingMission.action_type,
                  points_per_proof: editingMission.points_per_proof,
                  max_per_user: editingMission.max_per_user,
                  deadline: editingMission.deadline
                    ? new Date(editingMission.deadline).toISOString().slice(0, 16)
                    : '',
                  active: editingMission.active === 1 || editingMission.active === true
                }}
                onSubmit={handleUpdate}
                isPending={isUpdating}
                submitLabel="Modifier"
              />
              <button
                onClick={() => setEditingMission(null)}
                className="btn btn-secondary w-full mt-3"
              >
                Annuler
              </button>
            </div>
          ) : (
            <MissionForm
              onSubmit={handleCreate}
              isPending={isCreating}
              submitLabel="Créer"
            />
          )}
        </div>

        {/* Right: list */}
        <div className="col-span-2 card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-bold text-lg">
              Toutes les missions ({missions.length})
            </h2>
          </div>

          {missions.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Aucune mission créée</p>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
              {missions.map(mission => (
                <div
                  key={mission.id}
                  className={`p-4 rounded-lg border transition ${
                    editingMission?.id === mission.id
                      ? 'bg-blue-900 bg-opacity-30 border-blue-700'
                      : 'bg-slate-700 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium truncate">{mission.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                          mission.active ? 'bg-green-900 text-green-400' : 'bg-slate-600 text-slate-400'
                        }`}>
                          {mission.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {mission.description && (
                        <p className="text-sm text-slate-400 truncate">{mission.description}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="text-blue-400">{ACTION_LABELS[mission.action_type]}</span>
                        <span className="text-green-400">{mission.points_per_proof} pt/preuve</span>
                        <span className="text-purple-400">Max {mission.max_per_user}</span>
                        {mission.deadline && (
                          <span className="text-yellow-400">
                            Expire {new Date(mission.deadline).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-3 flex-shrink-0">
                      <button
                        onClick={() => setEditingMission(mission)}
                        className="btn btn-secondary text-sm px-3 py-1.5"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(mission.id)}
                        className="btn btn-danger text-sm px-3 py-1.5"
                      >
                        Suppr.
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
