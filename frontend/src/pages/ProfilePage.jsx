import React, { useEffect, useState } from 'react';
import { useMyProfile, useUpdateProfile } from '../hooks/useQueries';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { data, isLoading } = useMyProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    instaUsername: ''
  });

  useEffect(() => {
    if (!data?.user) return;
    setForm({
      firstName: data.user.first_name || '',
      lastName: data.user.last_name || '',
      email: data.user.email || '',
      phone: data.user.phone || '',
      instaUsername: data.user.insta_username || ''
    });
  }, [data]);

  if (isLoading) return <div className="page-loading">Chargement...</div>;
  if (!data?.user) return <div className="page-loading">Erreur de chargement du profil</div>;

  const submit = (e) => {
    e.preventDefault();
    updateProfile(form, {
      onSuccess: () => toast.success('Profil mis a jour'),
      onError: (err) => toast.error(err.response?.data?.error || 'Erreur de mise a jour')
    });
  };

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">Mon profil</h1>
        <p className="page-subtitle">Gerez vos informations personnelles et suivez votre activite.</p>
      </div>

      <div className="split-grid profile-layout">
        <section className="surface-card">
          <h2 className="section-title">Informations du compte</h2>
          <form className="invite-form" onSubmit={submit}>
            <div className="form-grid-2">
              <input
                className="ui-input"
                placeholder="Prenom"
                value={form.firstName}
                onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))}
                required
              />
              <input
                className="ui-input"
                placeholder="Nom"
                value={form.lastName}
                onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))}
                required
              />
            </div>
            <input
              className="ui-input"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              required
            />
            <input
              className="ui-input"
              placeholder="Telephone"
              value={form.phone}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
            />
            <input
              className="ui-input"
              placeholder="Pseudo Instagram"
              value={form.instaUsername}
              onChange={(e) => setForm((s) => ({ ...s, instaUsername: e.target.value }))}
              required
            />

            <button type="submit" className="ui-btn-primary" disabled={isPending}>
              {isPending ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </form>
        </section>

        <section className="surface-card">
          <h2 className="section-title">Performance</h2>
          <div className="stats-grid profile-stats">
            <div className="metric-card">
              <span className="metric-label">Points</span>
              <strong className="metric-value">{data.user.points_total || 0}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">Preuves envoyees</span>
              <strong className="metric-value">{data.stats?.proofs_submitted || 0}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">Preuves approuvees</span>
              <strong className="metric-value">{data.stats?.proofs_approved || 0}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">Classement</span>
              <strong className="metric-value">#{data.stats?.rank || '-'}</strong>
            </div>
          </div>

          <div className="invite-list">
            <h3>Historique points</h3>
            {(data.recentPoints || []).length === 0 && <p className="cell-muted">Aucun historique pour le moment.</p>}
            {(data.recentPoints || []).map((p) => (
              <div className="invite-item" key={p.id}>
                <div>
                  <strong>{p.reason || 'Points attribues'}</strong>
                  <p>{new Date(p.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <span className="chip chip-success">+{p.points}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
