import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResetPassword } from '../hooks/useQueries';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [search] = useSearchParams();
  const token = useMemo(() => search.get('token') || '', [search]);
  const navigate = useNavigate();
  const { mutate: resetPassword, isPending } = useResetPassword();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Lien invalide');
      return;
    }
    if (password.length < 8) {
      toast.error('8 caracteres minimum');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    resetPassword(
      { token, password },
      {
        onSuccess: () => {
          toast.success('Mot de passe mis a jour. Connectez-vous.');
          navigate('/login');
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Erreur de reinitialisation')
      }
    );
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <p className="login-kicker">Sauroraa Promoteam</p>
        <h1 className="login-title">Nouveau mot de passe</h1>
        <p className="login-subtitle">Choisissez un mot de passe securise pour votre compte.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label" htmlFor="password">
            Mot de passe
          </label>
          <div className="password-wrap">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
              required
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? 'Masquer' : 'Voir'}
            </button>
          </div>

          <label className="login-label" htmlFor="confirmPassword">
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            className="login-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmer le mot de passe"
            required
          />

          <button type="submit" className="login-button" disabled={isPending}>
            {isPending ? 'Mise a jour...' : 'Mettre a jour le mot de passe'}
          </button>
        </form>
      </div>
      <div className="login-glow" aria-hidden />
    </div>
  );
}
