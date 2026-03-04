import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import toast from 'react-hot-toast';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Déconnecté');
    navigate('/login');
  };

  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="container flex justify-between items-center h-16">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-blue-400">Promoteam</h1>
        </div>

        {user && (
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-slate-400">⭐ {user.pointsTotal} points</p>
            </div>

            {user.role === 'admin' && (
              <span className="px-3 py-1 bg-red-500 bg-opacity-20 text-red-400 text-xs rounded-full font-medium">
                ADMIN
              </span>
            )}

            <button
              onClick={handleLogout}
              className="btn btn-secondary"
            >
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
