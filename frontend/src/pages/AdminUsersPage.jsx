import React, { useMemo, useState } from 'react';
import {
  useAdminUsers,
  useUpdateUserStatus,
  useUpdateUserPoints
} from '../hooks/useQueries';
import toast from 'react-hot-toast';

const statusLabel = {
  active: 'Actif',
  suspended: 'Suspendu',
  inactive: 'Inactif'
};

function statusClass(status) {
  if (status === 'active') return 'chip chip-success';
  if (status === 'suspended') return 'chip chip-warning';
  return 'chip';
}

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useAdminUsers();
  const { mutate: updateStatus } = useUpdateUserStatus();
  const { mutate: updatePoints, isPending: pointsUpdating } = useUpdateUserPoints();

  const [search, setSearch] = useState('');
  const [pointsDrafts, setPointsDrafts] = useState({});

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      String(u.insta_username || '').toLowerCase().includes(q) ||
      String(u.email || '').toLowerCase().includes(q) ||
      `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(q)
    );
  }, [users, search]);

  const getDraftPoints = (userId) => pointsDrafts[userId] ?? '';

  const handleStatusChange = (userId, status) => {
    updateStatus(
      { id: userId, status },
      {
        onSuccess: () => toast.success('Statut utilisateur mis à jour'),
        onError: (err) => toast.error(err.response?.data?.error || 'Erreur de mise à jour')
      }
    );
  };

  const handlePointsChange = (userId, value) => {
    setPointsDrafts((prev) => ({ ...prev, [userId]: value }));
  };

  const handlePointsApply = (userId, username) => {
    const raw = String(getDraftPoints(userId)).trim();
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || Math.trunc(parsed) !== parsed || parsed === 0) {
      toast.error('Entrez un entier non nul (ex: 50 ou -20)');
      return;
    }

    updatePoints(
      { id: userId, points: parsed, reason: 'Ajustement manuel admin' },
      {
        onSuccess: (res) => {
          const total = res?.data?.points_total ?? '?';
          toast.success(`Points mis a jour pour @${username} (total: ${total})`);
          setPointsDrafts((prev) => ({ ...prev, [userId]: '' }));
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Erreur mise a jour points')
      }
    );
  };

  if (isLoading) return <div className="page-loading">Chargement...</div>;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">Gestion des Utilisateurs</h1>
        <p className="page-subtitle">Administration promoteurs/staff et ajustement des points.</p>
      </div>

      <div className="stats-grid">
        <div className="metric-card">
          <span className="metric-label">Promoteurs</span>
          <strong className="metric-value">{users.filter((u) => u.role === 'promoter').length}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Actifs</span>
          <strong className="metric-value">{users.filter((u) => u.status === 'active').length}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Suspendus</span>
          <strong className="metric-value">{users.filter((u) => u.status === 'suspended').length}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Total points</span>
          <strong className="metric-value">{users.reduce((sum, u) => sum + Number(u.points_total || 0), 0)}</strong>
        </div>
      </div>

      <section className="surface-card">
        <div className="section-head">
          <h2>Utilisateurs</h2>
          <input
            type="text"
            placeholder="Rechercher pseudo, email, nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ui-input"
          />
        </div>

        <div className="table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Points</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Inscrit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-empty">Aucun résultat</td>
                </tr>
              )}
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="table-user">
                      <strong>@{u.insta_username}</strong>
                      <span>{u.first_name} {u.last_name}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.points_total}</td>
                  <td><span className="chip">{u.role}</span></td>
                  <td><span className={statusClass(u.status)}>{statusLabel[u.status] || u.status}</span></td>
                  <td>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <div className="admin-user-actions">
                      {u.role === 'admin' ? (
                        <span className="cell-muted">Locked</span>
                      ) : (
                        <select
                          className="ui-select-sm"
                          value={u.status}
                          onChange={(e) => handleStatusChange(u.id, e.target.value)}
                        >
                          <option value="active">Actif</option>
                          <option value="suspended">Suspendu</option>
                          <option value="inactive">Inactif</option>
                        </select>
                      )}

                      <div className="points-editor">
                        <input
                          className="ui-input"
                          type="number"
                          placeholder="+50 / -20"
                          value={getDraftPoints(u.id)}
                          onChange={(e) => handlePointsChange(u.id, e.target.value)}
                        />
                        <button
                          type="button"
                          className="ui-btn-ghost"
                          onClick={() => handlePointsApply(u.id, u.insta_username)}
                          disabled={pointsUpdating}
                        >
                          Appliquer
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
