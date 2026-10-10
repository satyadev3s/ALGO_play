const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  exam_id: { type: String, required: true, index: true },
  question_text: { type: String, required: true, trim: true },
  option_a: { type: String, required: true, trim: true },
  option_b: { type: String, required: true, trim: true },
  option_c: { type: String, required: true, trim: true },
  option_d: { type: String, required: true, trim: true },
  correct_option: { type: String, required: true, uppercase: true, trim: true, enum: ['A', 'B', 'C', 'D'] },
  marks: { type: Number, default: 1, min: 0 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  explanation: { type: String, trim: true }, // shown after submission if enabled
  order: { type: Number, default: 0 } // for manual ordering
});

questionSchema.index({ exam_id: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);
