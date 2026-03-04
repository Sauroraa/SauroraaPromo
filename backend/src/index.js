import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.js';
import missionsRoutes from './routes/missions.js';
import proofsRoutes from './routes/proofs.js';
import usersRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import inviteRoutes from './routes/invite.js';

// Middleware
import { globalLimiter } from './middleware/rateLimit.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler, notFound, logRequest } from './middleware/errorHandler.js';

// Config
import logger from './utils/logger.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set('trust proxy', 1);

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
app.use(globalLimiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(logRequest);

// Uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/missions', missionsRoutes);
app.use('/api/proofs', authMiddleware, proofsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/invite', inviteRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404
app.use(notFound);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Promoteam Backend running on http://localhost:${PORT}`);
});

export default app;
