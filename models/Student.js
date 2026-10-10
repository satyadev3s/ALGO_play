const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  age: { type: Number, required: true, min: 4, max: 30 },
  schoolname: { type: String, required: true, trim: true },
  classofstudy: { type: String, required: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  score: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  last_login: { type: Date }
});

// Hash password before saving
studentSchema.pre('save', async function(next) {
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
studentSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

studentSchema.methods.toClient = function() {
  return {
    id: this._id,
    name: this.name,
    age: this.age,
    schoolname: this.schoolname,
    classofstudy: this.classofstudy,
    score: this.score,
    xp: this.xp
  };
};

module.exports = mongoose.model('Student', studentSchema);
