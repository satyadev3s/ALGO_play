const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  schoolname: { type: String, required: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  createdAt: { type: Date, default: Date.now },
  last_login: { type: Date }
});

// Hash password before saving
teacherSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
teacherSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

teacherSchema.methods.toClient = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    schoolname: this.schoolname
  };
};

module.exports = mongoose.model('Teacher', teacherSchema);
