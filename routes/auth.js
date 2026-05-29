const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// دالة إنشاء حساب جديد (Register)
exports.register = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;
        
        // 1. التأكد من عدم وجود الإيميل مسبقاً
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'البريد الإلكتروني مستخدم مسبقاً.' });
        }

        // 2. تشفير كلمة المرور
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. إنشاء المستخدم الجديد (سيأخذ حالة visitor تلقائياً)
        const newUser = new User({
            name,
            email,
            phone, // حفظ رقم الهاتف
            password: hashedPassword,
            role: role || 'student'
        });

        // 4. توليد رقم دراسي عشوائي إذا كان طالب
        if (newUser.role === 'student') {
            newUser.student_id = 'STU-' + Math.floor(100000 + Math.random() * 900000);
        }

        await newUser.save();

        res.status(201).json({ 
            message: 'تم إنشاء الحساب بنجاح', 
            user: { name: newUser.name, student_id: newUser.student_id } 
        });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ error: 'حدث خطأ في السيرفر أثناء إنشاء الحساب.' });
    }
};

// دالة تسجيل الدخول (Login)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. البحث عن المستخدم
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
        }

        // 2. مقارنة كلمة المرور
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
        }

        // 3. إنشاء التوكن (Token) السري
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET || 'secretKey123', 
            { expiresIn: '30d' }
        );

        // 4. إرسال بيانات المستخدم بدون الباسورد
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            avatar_url: user.avatar_url,
            level: user.level,
            student_id: user.student_id
        };

        res.json({ token, user: userData });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'حدث خطأ في السيرفر أثناء تسجيل الدخول.' });
    }
};
