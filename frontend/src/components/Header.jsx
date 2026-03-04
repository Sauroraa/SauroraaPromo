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
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="brand">Promoteam</h1>
        <div className="topbar-search-wrap">
          <input className="topbar-search" placeholder="Search" />
        </div>
      </div>

      {user && (
        <div className="topbar-right">
          <button className="icon-btn" aria-label="Notifications">🔔</button>
          <div className="user-chip">
            <div className="avatar-dot" />
            <div>
              <p className="user-name">{user.firstName} {user.lastName}</p>
              <p className="user-meta">{user.role?.toUpperCase()} • {user.pointsTotal ?? 0} pts</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
