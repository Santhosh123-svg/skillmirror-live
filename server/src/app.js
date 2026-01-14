import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import './config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../../client/dist')));

app.use(cors());
app.use(express.json());

import authRoutes from './routes/auth.routes.js';
import skillRoutes from './routes/skill.routes.js';
import taskRoutes from './routes/task.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/tasks', taskRoutes);

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

export default app;
