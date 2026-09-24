const jwt = require('jsonwebtoken');

/**
 * برمجية وسيطة للتحقق من التوكن (JWT) وصلاحية المستخدم
 */
const authMiddleware = (req, res, next) => {
    // الحصول على التوكن من ترويسة الطلب
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <TOKEN>

    if (!token) {
        return res.status(401).json({ error: 'عذراً، يجب تسجيل الدخول للوصول إلى هذه البيانات' });
    }

    // التحقق من صحة التوكن
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'جلسة العمل انتهت أو التوكن غير صالح' });
        }
        req.user = user;
        next();
    });
};

module.exports = authMiddleware;