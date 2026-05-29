const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    text: { type: String, required: true },
    stars: { type: Number, default: 5 },
    img: { type: String, default: '' },
    // حالة التعليق: قيد الانتظار أو معتمد من الإدارة
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
