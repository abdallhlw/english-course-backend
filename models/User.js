const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String }, // رقم الهاتف
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'parent', 'admin'], default: 'student' },
  
  // حالة الحساب: زائر (افتراضي) أو طالب معتمد
  status: { type: String, enum: ['visitor', 'student'], default: 'visitor' }, 
  
  student_id: { type: String, unique: true, sparse: true },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  avatar_url: { type: String, default: '' },
  level: { type: Number },
  xp: { type: Number, default: 0 },

  // نظام الأصدقاء
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // نظام الإشعارات
  notifications: [{
      title: String,
      body: String,
      isRead: { type: Boolean, default: false },
      date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
