require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); 
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// استدعاء النماذج (Models)
const User = require('./models/User');
const Testimonial = require('./models/Testimonial');
const Blog = require('./models/Blog');
const Activity = require('./models/Activity');
const Exam = require('./models/Exam');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app); 
const io = socketIo(server, { 
    cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] } 
});

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/photo', express.static(path.join(__dirname, 'photo')));

if (!fs.existsSync('./uploads')){ fs.mkdirSync('./uploads'); }
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, './uploads/'); },
    filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-')); }
});
const upload = multer({ storage: storage });

// ===== MongoDB Connection & Seeding =====
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/english_course';

const seedTestimonials = async () => {
    try {
        const count = await Testimonial.countDocuments();
        if (count === 0) {
            const dummyReviews = [
                { name: "أحمد العلي", text: "منصة ممتازة جداً، الشرح مبسط والمدرسين قمة في التعاون.", stars: 5, status: "approved" },
                { name: "سارة محمود", text: "الامتحانات الدورية ساعدتني كثيراً في معرفة نقاط ضعفي.", stars: 5, status: "approved" },
                { name: "عمر خالد", text: "غرف المحادثة كسرت عندي حاجز الخوف من التحدث.", stars: 4, status: "approved" },
                { name: "ريم حسن", text: "أفضل استثمار لوقتي، المنهج مرتب والواجبات مفيدة جداً.", stars: 5, status: "approved" },
                { name: "يوسف النجار", text: "متابعة الإدارة المستمرة وتصحيح الوظائف بسرعة شيء رائع.", stars: 5, status: "approved" },
                { name: "نور الدين", text: "تطور مستواي في الاستماع والقراءة بشكل ملحوظ خلال شهر.", stars: 4, status: "approved" },
                { name: "ليلى سمير", text: "الواجهة سهلة الاستخدام، والمقالات الموجودة غنية بالمعلومات.", stars: 5, status: "approved" },
                { name: "عبدالله زيد", text: "أنصح أي شخص يريد تعلم الإنجليزية بجدية أن يسجل هنا.", stars: 5, status: "approved" },
                { name: "مريم فهد", text: "المسابقات والنشاطات التفاعلية تجعل التعلم ممتعاً وغير ممل.", stars: 5, status: "approved" },
                { name: "طارق زياد", text: "شكراً لفريق العمل على هذا المجهود الجبار، هدفكم فعلاً أقوى أداء.", stars: 5, status: "approved" }
            ];
            await Testimonial.insertMany(dummyReviews);
            console.log('✅ تم إضافة 10 تعليقات وهمية بنجاح!');
        }
    } catch (error) { console.error('خطأ في إضافة التعليقات:', error); }
};

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connected');
        seedTestimonials();
    })
    .catch(err => {
        console.error('❌ MongoDB Error:', err.message);
        process.exit(1);
    });

// ===== Routes & Middleware =====
try { require('./socket')(io); } catch(e) {}
const { auth, adminOnly } = require('./middleware/auth');
const authRoutes = require('./routes/auth');

app.post('/api/register', authRoutes.register);
app.post('/api/login', authRoutes.login);

// (باقي المسارات الخاصة بك تضعها هنا كما كانت تماماً...)
// ...

// ===== تشغيل السيرفر =====
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
});
