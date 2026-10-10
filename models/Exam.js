const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  subject: { type: String, required: true, trim: true },
  class_grade: { type: String, trim: true }, // e.g., "Grade 6", "Class 8"
  duration_minutes: { type: Number, required: true, min: 1, max: 300 },
  teacher_id: { type: String, trim: true },
  is_active: { type: Boolean, default: false },
  is_published: { type: Boolean, default: false },
  is_draft: { type: Boolean, default: true },
  
  // Scheduling
  start_date: { type: Date },
  end_date: { type: Date },
  scheduled_start: { type: Date },
  
  // Settings
  max_attempts: { type: Number, default: 1, min: 1 },
  shuffle_questions: { type: Boolean, default: false },
  shuffle_options: { type: Boolean, default: false },
  show_results_immediately: { type: Boolean, default: true },
  show_correct_answers: { type: Boolean, default: false },
  passing_marks: { type: Number, default: 40 }, // percentage
  negative_marking: { type: Number, default: 0 }, // marks deducted per wrong answer
  marks_per_question: { type: Number, default: 1 },
  instructions: { type: String, trim: true },
  
  // Metadata
  total_questions: { type: Number, default: 0 },
  total_marks: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  published_at: { type: Date }
});

examSchema.index({ teacher_id: 1, created_at: -1 });
examSchema.index({ is_published: 1, is_active: 1, start_date: 1, end_date: 1 });
examSchema.index({ class_grade: 1 });

module.exports = mongoose.model('Exam', examSchema);
