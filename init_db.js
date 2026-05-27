require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const createTablesQuery = `
    -- 1. جدول المستخدمين (طلاب وأولياء أمور وأدمن)
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'parent', 'admin')),
        student_id VARCHAR(20) UNIQUE, -- رقم الطالب الفريد (EDU-XXXXXX)
        xp INT DEFAULT 0, -- شريط الـ XP الخاص بالطالب
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. جدول العلاقات والتأكيدات بين ولي الأمر والطالب
    CREATE TABLE IF NOT EXISTS parent_child_relations (
        id SERIAL PRIMARY KEY,
        parent_id INT REFERENCES users(id) ON DELETE CASCADE,
        student_id VARCHAR(20) REFERENCES users(student_id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. جدول المقالات والمدونات
    CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        tag VARCHAR(50),
        content TEXT NOT NULL,
        publish_time TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. جدول الامتحانات والواجبات
    CREATE TABLE IF NOT EXISTS exams (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('exam', 'homework')),
        deadline TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

async function initializeDatabase() {
    try {
        console.log('⏳ جاري تأسيس الجداول في قاعدة البيانات السحابية...');
        await pool.query(createTablesQuery);
        console.log('✅ تم إنشاء جميع الجداول بنجاح وتجهيز العلاقات!');
    } catch (err) {
        console.error('❌ خطأ أثناء إنشاء الجداول:', err.message);
    } finally {
        await pool.end();
    }
}

initializeDatabase();