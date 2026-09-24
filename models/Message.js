const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    receiverId: { type: String, required: true }, // يمكن أن يكون ID لطالب آخر أو كلمة 'admin' أو ID لمجموعة
    text: { type: String, required: true },
    isGroup: { type: Boolean, default: false },
    reactions: { type: Object, default: {} } // لحفظ التفاعلات مثل ❤️ و 👍
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);