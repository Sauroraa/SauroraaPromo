import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAcceptInvite, useInvite } from '../hooks/useQueries';
import { useAuthStore } from '../lib/store';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const { data: invite, isLoading, isError } = useInvite(token);
  const { mutate: acceptInvite, isPending } = useAcceptInvite();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [instaUsername, setInstaUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('Token d’invitation manquant');
      return;
    }

    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Prénom et nom requis');
      return;
    }

    acceptInvite(
      {
        token,
        inviteToken: token,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
        email: invite?.email,
        instaUsername,
        password
      },
      {
        onSuccess: (res) => {
          localStorage.setItem('token', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          setUser(res.data.user);
          toast.success('Compte créé avec succès');
          navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
        },
        onError: (err) => {
          toast.error(err.response?.data?.error || 'Erreur lors de l’inscription');
        }
      }
    );
  };

  if (!token) {
    return (
      <div className="login-shell">
        <div className="login-card">
          <h1 className="login-title">Invitation invalide</h1>
          <p className="login-subtitle">Le lien d’inscription est incomplet.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="login-shell">
        <div className="login-card">
          <h1 className="login-title">Chargement...</h1>
          <p className="login-subtitle">Vérification de votre invitation.</p>
        </div>
      </div>
    );
  }

  if (isError || !invite?.email) {
    return (
      <div className="login-shell">
        <div className="login-card">
          <h1 className="login-title">Invitation expirée</h1>
          <p className="login-subtitle">Ce lien n’est plus valide. Contactez un administrateur.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <p className="login-kicker">Invitation Promoteam</p>
        <h1 className="login-title">Créer votre compte</h1>
        <p className="login-subtitle">{invite.email}</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-grid-2">
            <div>
              <label className="login-label" htmlFor="firstName">Prénom</label>
              <input
                id="firstName"
                type="text"
                placeholder="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="login-input"
                required
              />
            </div>
            <div>
              <label className="login-label" htmlFor="lastName">Nom</label>
              <input
                id="lastName"
                type="text"
                placeholder="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="login-input"
                required
              />
            </div>
          </div>

          <label className="login-label" htmlFor="phone">Téléphone (optionnel)</label>
          <input
            id="phone"
            type="text"
            placeholder="+32 ..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="login-input"
          />

          <label className="login-label" htmlFor="insta">Pseudo Instagram</label>
          <input
            id="insta"
            type="text"
            placeholder="votre_pseudo"
            value={instaUsername}
            onChange={(e) => setInstaUsername(e.target.value)}
            className="login-input"
            required
          />

          <label className="login-label" htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            placeholder="Minimum 8 caractères"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />

          <label className="login-label" htmlFor="confirmPassword">Confirmer le mot de passe</label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirmez votre mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="login-input"
            required
          />

          <button type="submit" disabled={isPending} className="login-button">
            {isPending ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
      </div>
      <div className="login-glow" aria-hidden />
    </div>
  );
}
