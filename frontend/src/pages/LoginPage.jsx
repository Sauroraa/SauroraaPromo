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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">Promoteam</h1>
          <p className="text-slate-400 mb-8">Plateforme de gestion de promoteurs</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />

            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />

            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary w-full"
            >
              {isPending ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-slate-400 mt-6 text-sm">
            Démonstration: admin@promoteam.sauroraa.be / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
