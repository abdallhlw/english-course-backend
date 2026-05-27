const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#3b82f6' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Level', levelSchema);