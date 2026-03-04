import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks/useQueries';
import { useAuthStore } from '../lib/store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const setUser = useAuthStore(s => s.setUser);
  const { mutate: login, isPending } = useLogin();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    login({ email, password }, {
      onSuccess: (res) => {
        localStorage.setItem('token', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        setUser(res.data.user);
        toast.success('Connecté!');
        navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
      },
      onError: (err) => {
        toast.error(err.response?.data?.error || 'Erreur de connexion');
      }
    });
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <p className="login-kicker">Sauroraa Promoteam</p>
        <h1 className="login-title">Connexion</h1>
        <p className="login-subtitle">Plateforme interne de gestion des promoteurs</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
          />

          <label className="login-label" htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            placeholder="Votre mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />

          <button
            type="submit"
            disabled={isPending}
            className="login-button"
          >
            {isPending ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
      <div className="login-glow" aria-hidden />
    </div>
  );
}
