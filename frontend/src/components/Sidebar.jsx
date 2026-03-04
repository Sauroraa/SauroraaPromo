import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/store';

export default function Sidebar() {
  const { user } = useAuthStore();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const promoterLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/missions', label: 'Missions' },
    { path: '/proofs', label: 'Mes preuves' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/profile', label: 'Profil' }
  ];

  const staffLinks = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/proofs', label: 'Preuves' },
    { path: '/admin/missions', label: 'Missions' },
    { path: '/admin/invites', label: 'Invitations' },
    { path: '/leaderboard', label: 'Leaderboard' }
  ];

  const adminLinks = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/proofs', label: 'Preuves' },
    { path: '/admin/missions', label: 'Missions' },
    { path: '/admin/invites', label: 'Invitations' },
    { path: '/admin/users', label: 'Utilisateurs' }
  ];

  const links = user?.role === 'admin'
    ? adminLinks
    : user?.role === 'staff'
      ? staffLinks
      : promoterLinks;

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`sidebar-link ${
              isActive(link.path)
                ? 'sidebar-link-active'
                : 'sidebar-link-idle'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
