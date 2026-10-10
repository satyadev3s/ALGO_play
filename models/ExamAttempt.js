const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema({
  exam_id: { type: String, required: true, index: true },
  student_id: { type: String, required: true, index: true },
  attempt_number: { type: Number, default: 1, min: 1 },
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['in_progress', 'submitted', 'auto_submitted', 'expired'], 
    default: 'in_progress',
    index: true 
  },
  
  // Timing (authoritative server-side)
  started_at: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true },
  submitted_at: { type: Date },
  time_taken_seconds: { type: Number, default: 0 },
  
  // Answers and scoring
  answers: { type: Object, default: {} }, // { question_id: selected_option }
  score: { type: Number, default: 0 },
  max_score: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  
  // Per-question breakdown for review
  question_results: [{
    question_id: String,
    selected: String,
    correct: String,
    is_correct: Boolean,
    marks_earned: Number,
    marks_total: Number
  }],
  
  // Metadata
  ip_address: { type: String },
  user_agent: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Compound index for finding student's attempt for an exam
examAttemptSchema.index({ exam_id: 1, student_id: 1, attempt_number: 1 }, { unique: true });
examAttemptSchema.index({ exam_id: 1, status: 1 });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
