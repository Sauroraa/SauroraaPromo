import React, { useState } from 'react';
import { useCreateMission } from '../hooks/useQueries';
import toast from 'react-hot-toast';

export default function MissionForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    action_type: 'like',
    points_per_proof: 1,
    max_per_user: 10,
    deadline: ''
  });

  const { mutate: createMission, isPending } = useCreateMission();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'points_per_proof' || name === 'max_per_user' ? parseInt(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    createMission(formData, {
      onSuccess: () => {
        toast.success('Mission créée');
        setFormData({
          title: '',
          description: '',
          action_type: 'like',
          points_per_proof: 1,
          max_per_user: 10,
          deadline: ''
        });
        onSuccess?.();
      },
      onError: () => toast.error('Erreur')
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="text-white font-bold text-lg">Nouvelle Mission</h3>

      <input
        type="text"
        name="title"
        placeholder="Titre"
        value={formData.title}
        onChange={handleChange}
        className="input"
        required
      />

      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleChange}
        className="input h-20"
      />

      <select
        name="action_type"
        value={formData.action_type}
        onChange={handleChange}
        className="input"
      >
        <option value="like">Like</option>
        <option value="comment">Commentaire</option>
        <option value="share">Partage</option>
        <option value="story">Story</option>
        <option value="post">Post</option>
        <option value="follow">Follow</option>
      </select>

      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          name="points_per_proof"
          placeholder="Points mission"
          value={formData.points_per_proof}
          onChange={handleChange}
          className="input"
          min="1"
          required
        />
        <input
          type="number"
          name="max_per_user"
          placeholder="Max par utilisateur"
          value={formData.max_per_user}
          onChange={handleChange}
          className="input"
          min="1"
          required
        />
      </div>

      <input
        type="datetime-local"
        name="deadline"
        value={formData.deadline}
        onChange={handleChange}
        className="input"
      />

      <button type="submit" disabled={isPending} className="btn btn-primary w-full">
        {isPending ? 'Création...' : 'Créer Mission'}
      </button>
    </form>
  );
}
