const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const protect = (req, res, next) => {
  // 1. جلب التوكن من طلب المتصفح
  const token = req.header('Authorization');
  
  // 2. إذا لم يوجد توكن، نرفض الدخول
  if (!token) return res.status(401).json({ error: 'غير مصرح لك بالدخول، يرجى تسجيل الدخول' });

  try {
    // 3. فك تشفير التوكن للتأكد أنه حقيقي وليس وهمي
    const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    req.user = decoded; // حفظ بيانات المستخدم (الـ ID والصلاحية)
    next(); // السماح بالمرور
  } catch (err) {
    res.status(401).json({ error: 'الجلسة انتهت أو التوكن غير صالح' });
  }
};

module.exports = protect;
