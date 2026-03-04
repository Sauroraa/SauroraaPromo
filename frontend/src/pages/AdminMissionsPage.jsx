import React, { useMemo, useState } from 'react';
import {
  useAdminMissions,
  useCreateMission,
  useDeleteMission,
  useUpdateMission
} from '../hooks/useQueries';
import toast from 'react-hot-toast';

const ACTION_OPTIONS = [
  { value: 'like', label: 'Like' },
  { value: 'comment', label: 'Commentaire' },
  { value: 'share', label: 'Partage' },
  { value: 'story', label: 'Story' },
  { value: 'post', label: 'Post' },
  { value: 'follow', label: 'Follow' }
];

const EMPTY_FORM = {
  title: '',
  description: '',
  action_type: 'like',
  points_per_proof: 1,
  max_per_user: 10,
  deadline: '',
  active: true
};

function normalizeMissionToForm(mission) {
  return {
    title: mission.title || '',
    description: mission.description || '',
    action_type: mission.action_type || 'like',
    points_per_proof: mission.points_per_proof || 1,
    max_per_user: mission.max_per_user || 10,
    deadline: mission.deadline ? new Date(mission.deadline).toISOString().slice(0, 16) : '',
    active: mission.active === 1 || mission.active === true
  };
}

export default function AdminMissionsPage() {
  const { data, isLoading } = useAdminMissions();
  const { mutate: createMission, isPending: isCreating } = useCreateMission();
  const { mutate: updateMission, isPending: isUpdating } = useUpdateMission();
  const { mutate: deleteMission, isPending: isDeleting } = useDeleteMission();

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [query, setQuery] = useState('');

  const missions = data?.missions || [];
  const activeCount = missions.filter((m) => m.active === 1 || m.active === true).length;
  const expiredCount = missions.filter((m) => m.deadline && new Date(m.deadline) < new Date()).length;
  const totalPoints = missions.reduce((sum, m) => sum + Number(m.points_per_proof || 0), 0);

  const filteredMissions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return missions;
    return missions.filter((m) => {
      const text = `${m.title || ''} ${m.description || ''} ${m.action_type || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [missions, query]);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      points_per_proof: Number(form.points_per_proof) || 1,
      max_per_user: Number(form.max_per_user) || 1
    };

    if (editingId) {
      updateMission(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast.success('Mission mise a jour');
            resetForm();
          },
          onError: (err) => toast.error(err.response?.data?.error || 'Erreur de mise a jour')
        }
      );
      return;
    }

    createMission(payload, {
      onSuccess: () => {
        toast.success('Mission creee');
        resetForm();
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Erreur de creation')
    });
  };

  const startEdit = (mission) => {
    setEditingId(mission.id);
    setForm(normalizeMissionToForm(mission));
  };

  const removeMission = (missionId) => {
    const ok = window.confirm('Supprimer cette mission ? Cette action est irreversible.');
    if (!ok) return;
    deleteMission(missionId, {
      onSuccess: () => toast.success('Mission supprimee'),
      onError: (err) => toast.error(err.response?.data?.error || 'Erreur de suppression')
    });
  };

  if (isLoading) return <div className="page-loading">Chargement...</div>;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">Gestion des missions</h1>
        <p className="page-subtitle">Creation, pilotage et moderation des missions marketing.</p>
      </div>

      <div className="stats-grid mission-stats">
        <div className="metric-card">
          <span className="metric-label">Total missions</span>
          <strong className="metric-value">{missions.length}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Missions actives</span>
          <strong className="metric-value">{activeCount}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Echeances depassees</span>
          <strong className="metric-value">{expiredCount}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Points cumules</span>
          <strong className="metric-value">{totalPoints}</strong>
        </div>
      </div>

      <div className="split-grid mission-layout">
        <section className="surface-card">
          <h2 className="section-title">{editingId ? 'Modifier la mission' : 'Nouvelle mission'}</h2>
          <form className="invite-form" onSubmit={submit}>
            <input
              className="ui-input"
              placeholder="Titre"
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              required
            />
            <textarea
              className="ui-input ui-textarea"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            />

            <div className="form-grid-2">
              <select
                className="ui-select"
                value={form.action_type}
                onChange={(e) => setForm((s) => ({ ...s, action_type: e.target.value }))}
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                className="ui-input"
                type="number"
                min={1}
                value={form.points_per_proof}
                onChange={(e) => setForm((s) => ({ ...s, points_per_proof: e.target.value }))}
                placeholder="Points / preuve"
                required
              />
            </div>

            <div className="form-grid-2">
              <input
                className="ui-input"
                type="number"
                min={1}
                value={form.max_per_user}
                onChange={(e) => setForm((s) => ({ ...s, max_per_user: e.target.value }))}
                placeholder="Max / utilisateur"
                required
              />
              <input
                className="ui-input"
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm((s) => ({ ...s, deadline: e.target.value }))}
              />
            </div>

            <label className="check-row">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))}
              />
              Mission active
            </label>

            <button className="ui-btn-primary" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? 'Enregistrement...' : editingId ? 'Mettre a jour' : 'Creer la mission'}
            </button>

            {editingId && (
              <button type="button" className="ui-btn-ghost" onClick={resetForm}>
                Annuler la modification
              </button>
            )}
          </form>
        </section>

        <section className="surface-card">
          <div className="section-head">
            <h2>Toutes les missions</h2>
            <input
              className="ui-input"
              placeholder="Filtrer par titre, type, description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="mission-list">
            {filteredMissions.length === 0 && <p className="cell-muted">Aucune mission trouvee.</p>}
            {filteredMissions.map((mission) => {
              const isActive = mission.active === 1 || mission.active === true;
              return (
                <article className="mission-item" key={mission.id}>
                  <div className="mission-item-head">
                    <div>
                      <h3>{mission.title}</h3>
                      <p>{mission.description || 'Sans description'}</p>
                    </div>
                    <span className={isActive ? 'chip chip-success' : 'chip'}>{isActive ? 'Active' : 'Inactive'}</span>
                  </div>

                  <div className="mission-tags">
                    <span className="chip">{mission.action_type}</span>
                    <span className="chip">{mission.points_per_proof} pts / preuve</span>
                    <span className="chip">Max {mission.max_per_user}</span>
                    {mission.deadline && (
                      <span className="chip">
                        Echeance: {new Date(mission.deadline).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>

                  <div className="mission-actions">
                    <button className="ui-btn-ghost" onClick={() => startEdit(mission)}>
                      Modifier
                    </button>
                    <button className="ui-btn-danger" onClick={() => removeMission(mission.id)} disabled={isDeleting}>
                      Supprimer
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
