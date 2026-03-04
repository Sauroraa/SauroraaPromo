import multer from 'multer';

// Use memory storage — sharp processes the buffer directly,
// then proofController writes the final webp to disk.
// This avoids the race condition where multer tries to save
// to uploads/{userId}/ before the directory exists.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier invalide. Seuls JPEG, PNG et WebP sont acceptés.'));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 10
  }
});

export default uploadMiddleware;
