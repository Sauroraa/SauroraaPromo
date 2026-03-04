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
      const allowedSlots = Math.max(0, 10 - preview.length);
      const selected = files.slice(0, allowedSlots);
      if (files.length > selected.length) {
        toast.error('Maximum 10 images par envoi');
      }

      const newPreviews = selected.map(file => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file)
      }));
      setPreview((prev) => [...prev, ...newPreviews]);
    }
  });

  const removeImage = (id) => {
    setPreview((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
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
        toast.success('Preuves soumises avec succes');
        preview.forEach((p) => {
          if (p.preview) URL.revokeObjectURL(p.preview);
        });
        setPreview([]);
        onSuccess?.();
      },
      onError: (err) => {
        toast.error(err.response?.data?.error || 'Erreur lors de la soumission des preuves');
      }
    });
  };

  return (
    <div className="upload-widget">
      <div
        {...getRootProps()}
        className={`upload-dropzone ${isDragActive ? 'upload-dropzone-active' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="upload-title">Deposez les images ici...</p>
        ) : (
          <div>
            <p className="upload-title">Deposez les images ou cliquez pour selectionner</p>
            <p className="upload-subtitle">Max 10 images, 5MB chacune (jpg/png/webp)</p>
          </div>
        )}
      </div>

      {preview.length > 0 && (
        <div className="upload-preview-panel">
          <h3 className="section-title">Apercu ({preview.length}/10)</h3>
          <div className="upload-preview-grid">
            {preview.map((p) => (
              <div key={p.id} className="upload-preview-item">
                <img
                  src={p.preview}
                  alt="preview"
                  className="upload-preview-image"
                />
                <button
                  type="button"
                  onClick={() => removeImage(p.id)}
                  className="upload-remove-btn"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="ui-btn-primary upload-submit-btn"
          >
            {isPending ? 'Envoi en cours...' : 'Soumettre les preuves'}
          </button>
        </div>
      )}
    </div>
  );
}
