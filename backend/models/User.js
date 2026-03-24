const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['field_worker', 'admin', 'supervisor'],
    default: 'field_worker'
  },
  name: {
    type: String,
    required: true
  },
  email: String,
  phone: String,
  assignedDMA: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

// NO PRE-SAVE HOOK AT ALL - we'll hash passwords in the route

// Compare password method (using bcrypt)
userSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);