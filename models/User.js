const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'parent', 'admin'], 
    default: 'student' 
  },
  student_id: { type: String, unique: true, sparse: true },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  phone: String,
  created_at: { type: Date, default: Date.now }
});

// الطريقة الحديثة والآمنة 100% (بدون استخدام next لمنع انهيار السيرفر)
userSchema.pre('save', async function() {
  // 1. توليد رقم دراسي
  if (this.role === 'student' && !this.student_id) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    this.student_id = `EDU-${randomNum}`;
  }

  // 2. التشفير (يتم فقط إذا كانت كلمة المرور جديدة أو تم تعديلها)
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

module.exports = mongoose.model('User', userSchema);
