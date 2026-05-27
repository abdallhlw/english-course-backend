const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// تسجيل مستخدم جديد
const register = async (req, res) => {
  try {
    console.log("📝 محاولة تسجيل حساب جديد:", req.body.email);
    const { name, email, password, role, child_student_id } = req.body;
    
    // حماية السيرفر من الانهيار إذا كانت البيانات فارغة
    if (!email || !password) {
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
    }

    const user = new User({ name, email, password, role });
    await user.save();
    console.log("✅ تم إنشاء وتشفير الحساب بنجاح:", user.email);

    if (role === 'parent' && child_student_id) {
      const student = await User.findOne({ student_id: child_student_id, role: 'student' });
      if (student) {
        student.parent_id = user._id;
        await student.save();
      }
    }

    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح', user: { id: user._id, name: user.name, role: user.role, student_id: user.student_id, xp: user.xp, level: user.level } });
  } catch (err) {
    console.error("❌ Registration Error:", err.message);
    res.status(400).json({ error: 'بيانات غير صالحة، ربما الإيميل مستخدم مسبقاً' });
  }
};

// تسجيل الدخول
const login = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ error: 'البيانات ناقصة' });
    }

    const email = req.body.email.trim();
    const password = req.body.password.trim();
    
    console.log(`🔍 جاري البحث عن الإيميل: "${email}"`);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ خطأ: المستخدم غير موجود في قاعدة البيانات');
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    console.log('✅ المستخدم موجود، جاري مطابقة كلمة المرور...');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('❌ خطأ: كلمة المرور لا تتطابق مع التشفير!');
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    console.log(`🎉 تم تسجيل دخول المستخدم بنجاح: ${user.name}`);
    res.json({ token, user: { id: user._id, name: user.name, role: user.role, xp: user.xp, level: user.level, student_id: user.student_id } });
  } catch (err) {
    console.error("❌ Login Server Error:", err.message);
    res.status(500).json({ error: 'خطأ داخلي في السيرفر' });
  }
};

module.exports = { register, login };