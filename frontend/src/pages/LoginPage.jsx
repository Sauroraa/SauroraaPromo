import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForgotPassword, useLogin } from '../hooks/useQueries';
import { useAuthStore } from '../lib/store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const { mutate: login, isPending } = useLogin();
  const { mutate: forgotPassword, isPending: isForgotPending } = useForgotPassword();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(
      { email, password },
      {
        onSuccess: (res) => {
          localStorage.setItem('token', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          setUser(res.data.user);
          toast.success('Connecte');
          navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
        },
        onError: (err) => {
          toast.error(err.response?.data?.error || 'Erreur de connexion');
        }
      }
    );
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    forgotPassword(
      { email: forgotEmail },
      {
        onSuccess: () => {
          toast.success('Si le compte existe, un email a ete envoye.');
          setForgotEmail('');
          setForgotMode(false);
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Erreur de reinitialisation')
      }
    );
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <p className="login-kicker">Sauroraa Promoteam</p>
        <h1 className="login-title">{forgotMode ? 'Mot de passe oublie' : 'Connexion'}</h1>
        <p className="login-subtitle">
          {forgotMode
            ? 'Recevez un lien de reinitialisation par email.'
            : 'Plateforme interne de gestion des promoteurs'}
        </p>

        {!forgotMode ? (
          <form onSubmit={handleSubmit} className="login-form">
            <label className="login-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              required
            />

            <label className="login-label" htmlFor="password">
              Mot de passe
            </label>
            <div className="password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? 'Masquer' : 'Voir'}
              </button>
            </div>

            <button type="button" className="login-link" onClick={() => setForgotMode(true)}>
              Mot de passe oublie ?
            </button>

            <button type="submit" disabled={isPending} className="login-button">
              {isPending ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit} className="login-form">
            <label className="login-label" htmlFor="forgot-email">
              Email du compte
            </label>
            <input
              id="forgot-email"
              type="email"
              placeholder="vous@exemple.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="login-input"
              required
            />

            <button type="submit" disabled={isForgotPending} className="login-button">
              {isForgotPending ? 'Envoi...' : 'Envoyer le lien'}
            </button>
            <button type="button" className="login-link" onClick={() => setForgotMode(false)}>
              Retour a la connexion
            </button>
          </form>
        )}
      </div>
      <div className="login-glow" aria-hidden />
    </div>
  );
}
