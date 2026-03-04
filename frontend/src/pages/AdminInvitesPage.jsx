import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAdminInvites, useCreateInvite, useDeleteInvite, useResendInvite } from '../hooks/useQueries';

export default function AdminInvitesPage() {
  const { data: invitesData, isLoading } = useAdminInvites();
  const { mutate: createInvite, isPending: creating } = useCreateInvite();
  const { mutate: resendInvite, isPending: resending } = useResendInvite();
  const { mutate: deleteInvite, isPending: deleting } = useDeleteInvite();

  const [form, setForm] = useState({ email: '', role: 'promoter' });
  const invites = invitesData?.invites || [];

  const submit = (e) => {
    e.preventDefault();
    createInvite(form, {
      onSuccess: (res) => {
        const invite = res?.data?.invite;
        if (invite?.emailSent) toast.success('Invitation envoyee');
        else toast.error('Invitation creee mais email non envoye (SMTP)');
        setForm({ email: '', role: 'promoter' });
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Erreur creation invitation')
    });
  };

  const handleResend = (inviteId) => {
    resendInvite(inviteId, {
      onSuccess: (res) => {
        if (res?.data?.invite?.emailSent) toast.success('Invitation renvoyee');
        else toast.error('Invitation renvoyee mais email non envoye (SMTP)');
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Erreur renvoi invitation')
    });
  };

  const handleDelete = (inviteId) => {
    if (!window.confirm('Supprimer cette invitation ?')) return;
    deleteInvite(inviteId, {
      onSuccess: () => toast.success('Invitation supprimee'),
      onError: (err) => toast.error(err.response?.data?.error || 'Erreur suppression invitation')
    });
  };

  if (isLoading) return <div className="page-loading">Chargement...</div>;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">Invitations</h1>
        <p className="page-subtitle">Creer, renvoyer et supprimer les invitations.</p>
      </div>

      <div className="split-grid">
        <section className="surface-card">
          <h2 className="section-title">Nouvelle invitation</h2>
          <p className="cell-muted">Saisissez uniquement l'email. Le lien expire en 7 jours.</p>
          <form className="invite-form" onSubmit={submit}>
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
            <button type="submit" className="ui-btn-primary" disabled={creating}>
              {creating ? 'Envoi...' : 'Envoyer l\'invitation'}
            </button>
          </form>
        </section>

        <section className="surface-card">
          <h2 className="section-title">Historique ({invites.length})</h2>
          <div className="invite-list" style={{ marginTop: 8, borderTop: 0, paddingTop: 0 }}>
            {invites.length === 0 && <p className="cell-muted">Aucune invitation pour le moment.</p>}
            {invites.map((inv) => (
              <div className="invite-item" key={inv.id}>
                <div>
                  <strong>{inv.email}</strong>
                  <p className="cell-muted">
                    Role: {inv.role} • Expire: {new Date(inv.expires_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
                  <span className={inv.used_at ? 'chip chip-success' : 'chip chip-warning'}>
                    {inv.used_at ? 'Acceptee' : 'En attente'}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {!inv.used_at && (
                      <button
                        type="button"
                        className="ui-btn-ghost"
                        style={{ height: 30, padding: '0 10px' }}
                        disabled={resending}
                        onClick={() => handleResend(inv.id)}
                      >
                        Renvoyer
                      </button>
                    )}
                    <button
                      type="button"
                      className="ui-btn-danger"
                      style={{ height: 30, padding: '0 10px' }}
                      disabled={deleting}
                      onClick={() => handleDelete(inv.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
