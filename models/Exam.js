const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['exam', 'homework'], required: true }, // تحديد النوع
    file_url: { type: String }, // رابط ملف الامتحان أو الوظيفة (إن وجد)
    deadline: { type: Date } // آخر موعد للتسليم
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);