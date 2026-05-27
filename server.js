require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); 
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ===== إعداد السيرفر الأساسي =====
const app = express();

// 🔥 إعدادات CORS للسماح لموقع Netlify بالاتصال (يجب أن تكون هنا بالضبط) 🔥
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// السماح للسيرفر بقراءة البيانات
app.use(express.json());

// -- باقي الكود الخاص بك (المسارات وغيرها) يبقى كما هو تحت هذا السطر --
const cors = require('cors'); // تأكد من وجود هذا السطر

const app = express();

// 🔥 الحل السحري لمشكلة الـ CORS (يجب أن يكون هنا في الأعلى قبل أي شيء آخر) 🔥
app.use(cors({
    origin: '*', // هذا السطر يسمح لموقع Netlify وأي موقع آخر بالاتصال
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// السماح للسيرفر بقراءة بيانات JSON المرسلة
app.use(express.json());

// -- هنا تبدأ باقي مسارات موقعك (Routes) --
const server = http.createServer(app); 
const io = socketIo(server, { 
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] } 
});

// ===== إنشاء مجلد الملفات وإعداد Multer =====
if (!fs.existsSync('./uploads')){ fs.mkdirSync('./uploads'); }
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, './uploads/'); },
    filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-')); }
});
const upload = multer({ storage: storage });

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/photo', express.static(path.join(__dirname, 'photo')));

// ===== MONGODB CONNECTION =====
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/english_course';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
  });

// ===== استدعاء النماذج (Models) =====
const User = require('./models/User');
const Testimonial = require('./models/Testimonial');
const Blog = require('./models/Blog');
const Activity = require('./models/Activity');
const Exam = require('./models/Exam');
const Message = require('./models/Message'); // مودل الدردشة الجديد

// ===== SOCKET.IO (نظام الدردشة الفورية) =====
// إذا كان لديك ملف إشعارات قديم، سنبقيه يعمل:
try { require('./socket')(io); } catch(e) { /* تجاهل إن لم يوجد */ }

io.on('connection', (socket) => {
    console.log('💬 مستخدم جديد اتصل بالدردشة:', socket.id);

    // الانضمام لغرفة محادثة
    socket.on('joinChat', async ({ userId, chatId }) => {
        const roomName = chatId === 'admin' || chatId.startsWith('group_') 
                         ? chatId : [userId, chatId].sort().join('_'); 
        socket.join(roomName);

        try {
            const messages = await Message.find({
                $or: [
                    { senderId: userId, receiverId: chatId },
                    { senderId: chatId, receiverId: userId },
                    { receiverId: chatId, isGroup: true }
                ]
            }).sort({ createdAt: 1 });
            socket.emit('loadHistory', messages);
        } catch(e) { console.error('خطأ في جلب الرسائل', e); }
    });

    // إرسال رسالة جديدة
    socket.on('sendMessage', async (data) => {
        try {
            const { senderId, senderName, receiverId, text, isGroup } = data;
            const newMsg = new Message({ senderId, senderName, receiverId, text, isGroup });
            await newMsg.save();

            const roomName = receiverId === 'admin' || isGroup 
                             ? receiverId : [senderId, receiverId].sort().join('_');
            
            io.to(roomName).emit('receiveMessage', newMsg);
        } catch (error) { console.error('خطأ في إرسال الرسالة', error); }
    });

    socket.on('disconnect', () => { console.log('🔴 مستخدم غادر الدردشة:', socket.id); });
});

// ===== MIDDLEWARE AUTH =====
const { auth, adminOnly } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
app.set('auth', { auth, adminOnly });

// ===== مسارات الزملاء (للدردشة) =====
app.get('/api/users/peers', auth, async (req, res) => {
    try {
const peers = await User.find({ role: 'student' }).select('name role avatar_url');        res.json(peers);
    } catch (err) { res.status(500).json({ error: 'تعذر جلب الزملاء' }); }
});

// ===== مسارات الآدمن (Admin Routes) =====
app.get('/api/admin/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, '-password').lean();
    res.json(users.map(u => ({ ...u, id: u._id }))); 
  } catch (err) { res.status(500).json({ error: 'خطأ في جلب المستخدمين' }); }
});

app.delete('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم الحذف' });
  } catch (err) { res.status(500).json({ error: 'تعذر الحذف' }); }
});

app.post('/api/admin/link-parent', auth, adminOnly, async (req, res) => {
  try {
    const { parent_email, student_id } = req.body;
    const parent = await User.findOne({ email: parent_email, role: 'parent' });
    const student = await User.findOne({ student_id: student_id, role: 'student' });
    if (!parent || !student) return res.status(404).json({ error: 'ولي الأمر أو الطالب غير موجود' });
    
    student.parent_id = parent._id;
    await student.save();
    res.json({ message: 'تم الربط بنجاح' });
  } catch (err) { res.status(500).json({ error: 'خطأ في الربط' }); }
});

app.patch('/api/admin/users/:id/stats', auth, adminOnly, async (req, res) => {
  try {
    const { xp, level } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { xp, level }, { new: true });
    if (!user) return res.status(404).json({ error: 'غير موجود' });
    res.json({ message: 'تم التحديث' });
  } catch (err) { res.status(500).json({ error: 'خطأ في التحديث' }); }
});

try { app.use('/api/admin/reports', auth, adminOnly, require('./routes/reports')); } catch(e){}
try { app.use('/api/student', require('./routes/student')); } catch(e){}

// ===== مسارات الآباء =====
app.get('/api/parent/children', auth, async (req, res) => {
  try {
    const children = await User.find({ parent_id: req.user.id, role: 'student' });
    res.json(children);
  } catch (err) { res.status(500).json({ error: 'تعذر جلب الأبناء' }); }
});

// ===== مسارات المقالات (Blogs) مع دعم رفع الملفات =====
app.get('/api/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.json(blogs);
    } catch (err) { res.status(500).json({ error: 'خطأ في الجلب' }); }
});

app.post('/api/blogs', auth, adminOnly, upload.single('file'), async (req, res) => {
    try {
        const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const newBlog = new Blog({
            title: req.body.title,
            content: req.body.content,
            link: req.body.link || null,
            file_url: fileUrl, // تخزين رابط الملف
            author_id: req.user.id,
            author_name: 'إدارة المنصة'
        });
        await newBlog.save();
        res.status(201).json(newBlog);
    } catch (err) { res.status(500).json({ error: 'تعذر النشر' }); }
});

app.delete('/api/blogs/:id', auth, adminOnly, async (req, res) => {
    try {
        await Blog.findByIdAndDelete(req.params.id);
        res.json({ message: 'تم الحذف' });
    } catch (err) { res.status(500).json({ error: 'تعذر الحذف' }); }
});

// ===== مسارات الامتحانات والوظائف مع دعم رفع الملفات =====
app.get('/api/exams', auth, async (req, res) => {
    try {
        const exams = await Exam.find({ type: 'exam' }).sort({ createdAt: -1 });
        res.json(exams);
    } catch (err) { res.status(500).json({ error: 'خطأ' }); }
});

app.get('/api/homeworks', auth, async (req, res) => {
    try {
        const homeworks = await Exam.find({ type: 'homework' }).sort({ createdAt: -1 });
        res.json(homeworks);
    } catch (err) { res.status(500).json({ error: 'خطأ' }); }
});

app.post('/api/exams', auth, adminOnly, upload.single('file'), async (req, res) => {
    try {
        const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const newExam = new Exam({
            title: req.body.title,
            description: req.body.description,
            type: req.body.type,
            file_url: fileUrl, // تخزين رابط الملف
            deadline: req.body.deadline
        });
        await newExam.save();
        res.status(201).json(newExam);
    } catch (err) { res.status(500).json({ error: 'تعذر الإضافة' }); }
});

// ===== مسارات النشاطات =====
app.get('/api/activities', async (req, res) => {
    try {
        const activities = await Activity.find().sort({ createdAt: -1 });
        res.json(activities);
    } catch (err) { res.status(500).json({ error: 'خطأ' }); }
});

app.post('/api/activities', auth, async (req, res) => {
    try {
        const newActivity = new Activity({
            title: req.body.title,
            description: req.body.description,
            author_id: req.user.id,
            author_name: req.body.author_name
        });
        await newActivity.save();
        res.status(201).json(newActivity);
    } catch (err) { res.status(500).json({ error: 'خطأ' }); }
});

app.delete('/api/activities/:id', auth, async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);
        if (!activity) return res.status(404).json({ error: 'غير موجود' });
        await Activity.findByIdAndDelete(req.params.id);
        res.json({ message: 'تم الحذف' });
    } catch (err) { res.status(500).json({ error: 'خطأ' }); }
});
// ==========================================
// ===== مسارات الآراء والتقييمات (Testimonials) =====
// ==========================================
app.get('/api/testimonials', async (req, res) => {
    try {
        const testimonials = await Testimonial.find().sort({ createdAt: -1 });
        res.json(testimonials);
    } catch (err) { res.status(500).json({ error: 'خطأ في جلب الآراء' }); }
});

app.post('/api/testimonials', auth, async (req, res) => {
    try {
        const newTestimonial = new Testimonial({
            name: req.body.name,
            text: req.body.text,
            stars: req.body.stars,
            img: req.body.img
        });
        await newTestimonial.save();
        res.status(201).json(newTestimonial);
    } catch (err) { res.status(500).json({ error: 'تعذر إضافة الرأي' }); }
});

// ==========================================
// ===== تحديث الصورة الشخصية للطالب =====
// ==========================================
app.post('/api/student/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'الرجاء اختيار صورة' });
        const avatarUrl = `/uploads/${req.file.filename}`;
        
        // تحديث رابط الصورة في حساب المستخدم في قاعدة البيانات
        const User = require('./models/User');
        await User.findByIdAndUpdate(req.user.id, { avatar_url: avatarUrl });
        
        res.json({ message: 'تم تحديث الصورة بنجاح', avatar_url: avatarUrl });
    } catch (err) { res.status(500).json({ error: 'خطأ في رفع الصورة' }); }
});
// ===== مسارات المصادقة (Auth) =====
app.post('/api/register', authRoutes.register);
app.post('/api/login', authRoutes.login);

// ===== فحص حالة السيرفر =====
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ===== تشغيل السيرفر الأساسي (مع Socket.io) =====
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل بقوة على المنفذ ${PORT}`);
  console.log(`📡 نظام الدردشة Socket.io جاهز للعمل الفوري`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ المنفذ ${PORT} محجوز!`);
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  server.close(() => {
    mongoose.connection.close(false, () => process.exit(0));
  });
});
