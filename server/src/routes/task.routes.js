const express = require("express");
const authMiddleware = require('../middleware/auth.middleware');

const {
  getTasksBySkill,
  getUserTasks,
  submitTask,
  createTask,
  getTaskById  // ← ADD THIS (if controller has it)
} = require('../controllers/task.controller');

const router = express.Router();

// ✅ GET routes
router.get('/skill/:skillId', authMiddleware, getTasksBySkill);
router.get('/user/my-tasks', authMiddleware, getUserTasks);
router.get('/:taskId', authMiddleware, getTaskById);  // ← ADD THIS LINE

// ✅ POST routes
router.post('/', authMiddleware, createTask);
router.post('/:taskId/submit', authMiddleware, submitTask);  // ← CHANGE FROM PUT to POST

module.exports = router;

