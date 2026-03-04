import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSubmitProof } from '../hooks/useQueries';
import toast from 'react-hot-toast';

export default function DropzoneUpload({ missionId, onSuccess }) {
  const [preview, setPreview] = useState([]);
  const { mutate: submitProof, isPending } = useSubmitProof();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 10,
    maxSize: 5 * 1024 * 1024,
    onDrop: (files) => {
      const newPreviews = files.map(file => ({
        id: Math.random(),
        file,
        preview: URL.createObjectURL(file)
      }));
      setPreview([...preview, ...newPreviews]);
    }
  });

  const removeImage = (id) => {
    setPreview(preview.filter(p => p.id !== id));
  };

  const handleSubmit = async () => {
    if (preview.length === 0) {
      toast.error('Veuillez sélectionner au moins une image');
      return;
    }

    const formData = new FormData();
    formData.append('missionId', missionId);
    
    preview.forEach(p => {
      formData.append('images', p.file);
    });

    submitProof(formData, {
      onSuccess: () => {
        toast.success('Preuves soumises avec succès!');
        setPreview([]);
        onSuccess?.();
      },
      onError: (err) => {
        toast.error(err.response?.data?.error || 'Erreur lors de la soumission');
      }
    });
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          isDragActive
            ? 'border-blue-500 bg-blue-500 bg-opacity-10'
            : 'border-slate-600 hover:border-slate-500'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-400 font-medium">Déposez les images ici...</p>
        ) : (
          <div>
            <p className="text-slate-300">📤 Déposez les images ou cliquez pour sélectionner</p>
            <p className="text-xs text-slate-500 mt-2">Max 10 images, 5MB chacune</p>
          </div>
        )}
      </div>

      {preview.length > 0 && (
        <div className="mt-6">
          <h3 className="text-white font-medium mb-4">Aperçu ({preview.length}/10)</h3>
          <div className="grid grid-cols-4 gap-4">
            {preview.map(p => (
              <div key={p.id} className="relative group">
                <img
                  src={p.preview}
                  alt="preview"
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(p.id)}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="btn btn-primary mt-4 w-full"
          >
            {isPending ? 'Envoi en cours...' : 'Soumettre les preuves'}
          </button>
        </div>
      )}
    </div>
  );
}
