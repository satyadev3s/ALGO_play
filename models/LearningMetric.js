const mongoose = require('mongoose');

const learningMetricSchema = new mongoose.Schema({
  student_name: { type: String, required: true },
  concept: { type: String, required: true },
  pre_test_score: { type: Number, default: 0 },
  post_test_score: { type: Number, default: 0 },
  gain_points: { type: Number, default: 0 },
  misconceptions_detected: [{
    misconception_id: String,
    count: { type: Number, default: 1 },
    last_detected: { type: Date, default: Date.now }
  }],
  mastery_status: { type: String, enum: ['novice', 'practicing', 'mastered'], default: 'novice' },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LearningMetric', learningMetricSchema);
