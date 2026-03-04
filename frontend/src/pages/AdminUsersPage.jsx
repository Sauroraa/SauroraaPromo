import React, { useState } from 'react';
import { useAdminUsers, useUpdateUserStatus, useGenerateInvites } from '../hooks/useQueries';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  active: 'bg-green-900 text-green-400',
  suspended: 'bg-yellow-900 text-yellow-400',
  inactive: 'bg-slate-700 text-slate-400'
};

const STATUS_LABELS = {
  active: 'Actif',
  suspended: 'Suspendu',
  inactive: 'Inactif'
};

export default function AdminUsersPage() {
  const { data: users, isLoading } = useAdminUsers();
  const { mutate: updateStatus } = useUpdateUserStatus();
  const { mutate: generateInvites, isPending: isGenerating } = useGenerateInvites();

  const [search, setSearch] = useState('');
  const [inviteCount, setInviteCount] = useState(5);
  const [inviteExpiry, setInviteExpiry] = useState(30);
  const [generatedCodes, setGeneratedCodes] = useState([]);

  const filtered = (users ?? []).filter(u =>
    u.insta_username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = (userId, newStatus) => {
    updateStatus({ id: userId, status: newStatus }, {
      onSuccess: () => toast.success(`Statut mis à jour : ${STATUS_LABELS[newStatus]}`),
      onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
    });
  };

  const handleGenerateInvites = () => {
    generateInvites({ count: inviteCount, expiresIn: inviteExpiry }, {
      onSuccess: (res) => {
        setGeneratedCodes(res.data?.invites ?? []);
        toast.success(`${inviteCount} code(s) d'invitation générés`);
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Erreur')
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copié !'));
  };

  if (isLoading) return <div className="text-center text-slate-400 py-8">Chargement...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Gestion des utilisateurs</h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Rechercher par pseudo, email ou nom..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
            />
          </div>

          {/* Users table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-slate-400 text-sm font-medium">Utilisateur</th>
                    <th className="text-left py-3 px-4 text-slate-400 text-sm font-medium">Email</th>
                    <th className="text-center py-3 px-4 text-slate-400 text-sm font-medium">Points</th>
                    <th className="text-center py-3 px-4 text-slate-400 text-sm font-medium">Rôle</th>
                    <th className="text-center py-3 px-4 text-slate-400 text-sm font-medium">Statut</th>
                    <th className="text-center py-3 px-4 text-slate-400 text-sm font-medium">Inscrit</th>
                    <th className="text-center py-3 px-4 text-slate-400 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  ) : (
                    filtered.map(user => (
                      <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700 transition">
                        <td className="py-3 px-4">
                          <p className="text-white font-medium">@{user.insta_username}</p>
                          <p className="text-xs text-slate-400">{user.first_name} {user.last_name}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-300 text-sm">{user.email}</td>
                        <td className="py-3 px-4 text-center text-green-400 font-bold">
                          {user.points_total}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-900 text-purple-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[user.status]}`}>
                            {STATUS_LABELS[user.status]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-400 text-xs">
                          {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {user.role !== 'admin' && (
                            <select
                              value={user.status}
                              onChange={e => handleStatusChange(user.id, e.target.value)}
                              className="text-xs bg-slate-700 text-slate-300 border border-slate-600 rounded px-2 py-1"
                            >
                              <option value="active">Actif</option>
                              <option value="suspended">Suspendre</option>
                              <option value="inactive">Inactif</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: invite generator */}
        <div className="col-span-1">
          <div className="card">
            <h2 className="text-white font-bold text-lg mb-4">Codes d'invitation</h2>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-slate-400 text-xs">Nombre de codes</label>
                <input
                  type="number"
                  value={inviteCount}
                  onChange={e => setInviteCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="input mt-1"
                  min="1" max="50"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs">Expire dans (jours)</label>
                <input
                  type="number"
                  value={inviteExpiry}
                  onChange={e => setInviteExpiry(Math.min(365, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="input mt-1"
                  min="1" max="365"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateInvites}
              disabled={isGenerating}
              className="btn btn-primary w-full"
            >
              {isGenerating ? 'Génération...' : `Générer ${inviteCount} code(s)`}
            </button>

            {generatedCodes.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-slate-400 text-sm">Codes générés :</p>
                  <button
                    onClick={() => copyToClipboard(generatedCodes.join('\n'))}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Copier tout
                  </button>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {generatedCodes.map(code => (
                    <div
                      key={code}
                      onClick={() => copyToClipboard(code)}
                      className="flex items-center justify-between bg-slate-700 rounded px-3 py-2 cursor-pointer hover:bg-slate-600 transition"
                    >
                      <span className="text-sm font-mono text-blue-300">{code}</span>
                      <span className="text-xs text-slate-500">copier</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stats rapides */}
          <div className="card mt-4">
            <h2 className="text-white font-bold mb-3">Résumé</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total promoteurs</span>
                <span className="text-white font-medium">
                  {(users ?? []).filter(u => u.role === 'promoter').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Actifs</span>
                <span className="text-green-400 font-medium">
                  {(users ?? []).filter(u => u.status === 'active' && u.role === 'promoter').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Suspendus</span>
                <span className="text-yellow-400 font-medium">
                  {(users ?? []).filter(u => u.status === 'suspended').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
