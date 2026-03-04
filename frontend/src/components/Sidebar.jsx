import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/store';

export default function Sidebar() {
  const { user } = useAuthStore();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const promoterLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/missions', label: 'Missions' },
    { path: '/proofs', label: 'Mes preuves' },
    { path: '/leaderboard', label: 'Classement' },
    { path: '/profile', label: 'Profil' }
  ];

  const adminLinks = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/proofs', label: 'Preuves' },
    { path: '/admin/missions', label: 'Missions' },
    { path: '/admin/users', label: 'Utilisateurs' }
  ];

  const links = user?.role === 'admin' ? adminLinks : promoterLinks;

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 fixed left-0 top-16 bottom-0 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`block px-4 py-3 rounded-lg transition ${
              isActive(link.path)
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
