import React, { useMemo, useState } from 'react';
import { useAdminUsers, useAdminInvites, useCreateInvite, useUpdateUserStatus } from '../hooks/useQueries';
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
  const { data: invitesData } = useAdminInvites();
  const { mutate: updateStatus } = useUpdateUserStatus();
  const { mutate: createInvite, isPending: inviteSubmitting } = useCreateInvite();

  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    email: '',
    role: 'promoter'
  });

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      String(u.insta_username || '').toLowerCase().includes(q) ||
      String(u.email || '').toLowerCase().includes(q) ||
      `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(q)
    );
  }, [users, search]);

  const invites = invitesData?.invites || [];

  const handleStatusChange = (userId, status) => {
    updateStatus(
      { id: userId, status },
      {
        onSuccess: () => toast.success('Statut utilisateur mis à jour'),
        onError: (err) => toast.error(err.response?.data?.error || 'Erreur de mise à jour')
      }
    );
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    createInvite(form, {
      onSuccess: (res) => {
        const invite = res?.data?.invite;
        toast.success('Invitation envoyée');
        if (invite?.token) {
          navigator.clipboard?.writeText(`https://promoteam.sauroraa.be/register?token=${invite.token}`);
        }
        setForm({
          email: '',
          role: 'promoter'
        });
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Erreur d’invitation')
    });
  };

  if (isLoading) return <div className="page-loading">Chargement...</div>;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">Gestion des Utilisateurs</h1>
        <p className="page-subtitle">Administration promoteurs, staff et invitations.</p>
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
          <span className="metric-label">Invitations</span>
          <strong className="metric-value">{invites.length}</strong>
        </div>
      </div>

      <div className="split-grid">
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
                  <th>Action</th>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface-card">
          <h2 className="section-title">Inviter un Utilisateur</h2>
          <p className="cell-muted">Saisissez seulement l'email. Le lien d'inscription expire automatiquement en 7 jours.</p>
          <form className="invite-form" onSubmit={handleInviteSubmit}>
            <input
              className="ui-input"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              required
            />
            <select
              className="ui-select"
              value={form.role}
              onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
            >
              <option value="promoter">Promoteur</option>
              <option value="staff">Staff</option>
            </select>
            <button className="ui-btn-primary" type="submit" disabled={inviteSubmitting}>
              {inviteSubmitting ? 'Envoi...' : 'Envoyer l’invitation'}
            </button>
          </form>

          <div className="invite-list">
            <h3>Dernières invitations</h3>
            {invites.slice(0, 6).map((inv) => (
              <div className="invite-item" key={inv.id}>
                <div>
                  <strong>{inv.first_name || inv.last_name ? `${inv.first_name} ${inv.last_name}` : 'Invitation email'}</strong>
                  <p>{inv.email}</p>
                </div>
                <span className={inv.used_at ? 'chip chip-success' : 'chip chip-warning'}>
                  {inv.used_at ? 'Acceptée' : 'En attente'}
                </span>
              </div>
            ))}
            {invites.length === 0 && <p className="cell-muted">Aucune invitation pour le moment.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
