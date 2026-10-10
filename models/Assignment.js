const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  subject: { type: String, required: true, trim: true },
  filename: { type: String, required: true },
  original_name: { type: String, trim: true },
  teacher_name: { type: String, required: true, trim: true },
  timestamp: { type: Date, default: Date.now }
});

assignmentSchema.methods.toClient = function() {
  return {
    id: this._id,
    title: this.title || this.original_name || `${this.subject} Assignment`,
    subject: this.subject,
    filename: this.original_name || this.filename,
    teacher_name: this.teacher_name,
    date: this.timestamp.toISOString().split('T')[0],
    url: `/uploads/${this.filename}`
  };
};

module.exports = mongoose.model('Assignment', assignmentSchema);
