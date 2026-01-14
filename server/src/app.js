const express = require('express');
const cors = require('cors');
const path = require('path');
require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth.routes');
const skillRoutes = require('./routes/skill.routes');
const taskRoutes = require('./routes/task.routes');

app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/tasks', taskRoutes);

module.exports = app;
