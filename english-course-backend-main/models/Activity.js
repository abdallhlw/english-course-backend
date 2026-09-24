const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // للربط مع صاحب النشاط
    author_name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', activitySchema);
