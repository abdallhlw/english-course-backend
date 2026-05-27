const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification'); // افترضنا وجود موديل للإشعارات
const { auth: protect } = require('../middleware/auth'); // استدعاء الحارس الأمني

// مسار لجلب بيانات الطالب وعرضها في لوحة التحكم
router.get('/profile', protect, async (req, res) => {
  try {
    // البحث عن المستخدم باستخدام الـ ID الموجود في التوكن (بدون إرسال الباسورد)
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
});

// جلب الإشعارات الحقيقية للطالب
router.get('/notifications', protect, async (req, res) => {
  try {
    // جلب آخر 10 إشعارات موجهة لهذا الطالب أو عامة
    const notifications = await Notification.find({ 
      $or: [{ recipient: req.user.id }, { isGlobal: true }] 
    }).sort({ createdAt: -1 }).limit(10);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب الإشعارات' });
  }
});

// تحديث حالة الإشعارات إلى "مقروء"
router.post('/notifications/read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'تم التحديث' });
  } catch (err) { res.status(500).json({ error: 'خطأ' }); }
});

// مسار للتحقق من الرقم الدراسي للطالب
router.post('/verify', protect, async (req, res) => {
  try {
    const { input_student_id } = req.body;
    const user = await User.findById(req.user.id);

    // التحقق مما إذا كان الرقم المدخل يطابق رقم الطالب في قاعدة البيانات
    if (user.student_id === input_student_id) {
      res.json({ message: '✅ تم التحقق بنجاح! حسابك موثق ورقمك صحيح.' });
    } else {
      res.status(400).json({ error: '❌ الرقم الدراسي غير صحيح، يرجى التأكد منه.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
});

module.exports = router;