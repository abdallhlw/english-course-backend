const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  text: { type: String, required: true },
  stars: { type: Number, default: 5 },
  img: { type: String, default: 'photo/aaa.jpg' },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  status: { type: String, default: 'approved' }, // يمكن جعلها pending للمراجعة لاحقاً
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Testimonial', testimonialSchema);