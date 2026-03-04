import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { useMyNotifications } from '../hooks/useQueries';
import toast from 'react-hot-toast';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [openNotifications, setOpenNotifications] = useState(false);
  const { data } = useMyNotifications(20);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);

  const notifications = data?.notifications || [];
  const recentNotifications = useMemo(() => notifications.slice(0, 8), [notifications]);
  const unreadCount = recentNotifications.length;
  const navLinks = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') {
      return [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/proofs', label: 'Preuves' },
        { to: '/admin/missions', label: 'Missions' },
        { to: '/admin/users', label: 'Utilisateurs' },
        { to: '/profile', label: 'Profil' }
      ];
    }
    if (user.role === 'staff') {
      return [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/proofs', label: 'Preuves' },
        { to: '/admin/missions', label: 'Missions' },
        { to: '/leaderboard', label: 'Leaderboard' },
        { to: '/profile', label: 'Profil' }
      ];
    }
    return [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/missions', label: 'Missions' },
      { to: '/proofs', label: 'Mes preuves' },
      { to: '/leaderboard', label: 'Leaderboard' },
      { to: '/profile', label: 'Profil' }
    ];
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success('Deconnecte');
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-btn" onClick={() => setOpenMobileMenu((v) => !v)}>
          ☰
        </button>
        <h1 className="brand">Promoteam</h1>
        <div className="topbar-search-wrap">
          <input className="topbar-search" placeholder="Rechercher missions, utilisateurs..." />
        </div>
      </div>

      {user && (
        <div className="topbar-right">
          <div className="notifications-wrap">
            <button className="icon-btn" aria-label="Notifications" onClick={() => setOpenNotifications((v) => !v)}>
              🔔
              {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {openNotifications && (
              <div className="notifications-popover">
                <div className="notifications-head">
                  <strong>Notifications</strong>
                  <button className="login-link" type="button" onClick={() => setOpenNotifications(false)}>
                    Fermer
                  </button>
                </div>
                {recentNotifications.length === 0 ? (
                  <p className="cell-muted">Aucune notification.</p>
                ) : (
                  <div className="notifications-list">
                    {recentNotifications.map((n) => (
                      <div key={n.id} className="notification-item">
                        <p className="notification-title">{n.title}</p>
                        <p className="notification-message">{n.message}</p>
                        <p className="notification-date">{new Date(n.createdAt).toLocaleString('fr-FR')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="user-chip">
            <div className="avatar-dot" />
            <div>
              <p className="user-name">
                {user.firstName} {user.lastName}
              </p>
              <p className="user-meta">
                {user.role?.toUpperCase()} • {user.pointsTotal ?? 0} pts
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      )}
      {openMobileMenu && (
        <div className="mobile-menu">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setOpenMobileMenu(false)} className="mobile-menu-link">
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
