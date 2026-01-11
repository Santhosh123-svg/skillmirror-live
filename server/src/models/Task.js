const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'completed', 'rejected'],
    default: 'pending',
  },
  submissionDate: { type: Date, default: null },
  submissionContent: { type: String, default: '' },
  submissionLanguage: { type: String, default: 'javascript' },
  validationResult: {
    isCorrect: { type: Boolean, default: false },
    passedTests: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    testResults: { type: Array, default: [] },
    error: { type: String, default: '' },
    timestamp: { type: Date, default: null }
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', taskSchema);
