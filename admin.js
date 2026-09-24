document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'http://localhost:5000'; // رابط السيرفر المحلي الخاص بك
    const token = localStorage.getItem('token');

    // حماية لوحة التحكم: إذا لم يكن هناك توكن، يتم الطرد لصفحة الدخول
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // مصفوفة عامة لحفظ الطلاب القادمين من قاعدة البيانات لاستخدامها في إحصائيات المستويات
    let allActiveStudents = [];

    // =========================================================
    // 1️⃣ دالة جلب الإحصائيات الحقيقية والبيانات من قاعدة البيانات
    // =========================================================
    async function loadRealStatistics() {
        try {
            // أ. جلب الطلاب الحقيقيين المسجلين
            const resUsers = await fetch(`${API_BASE_URL}/api/admin/users`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            const users = await resUsers.json();
            
            // تصفية المستخدمين ليكونوا "طلاب" فقط
            allActiveStudents = users.filter(u => u.role === 'student');
            
            // تحديث رقم الطلاب في المربع الصغير (الذي أضفنا له الـ id سابقاً)
            if(document.getElementById('stat-students')) {
                document.getElementById('stat-students').textContent = allActiveStudents.length;
            }

            // تحديث جدول إدارة الطلاب الرئيسي في اللوحة
            renderStudentsTable(allActiveStudents);

            // ب. جلب عدد المقالات والدروس الحقيقية المنشورة
            const resBlogs = await fetch(`${API_BASE_URL}/api/blogs`);
            const blogs = await resBlogs.json();
            if(document.getElementById('stat-blogs')) {
                document.getElementById('stat-blogs').textContent = blogs.length || 0;
            }
            renderBlogsTable(blogs);

            // ج. جلب عدد الامتحانات والواجبات الحقيقية
            const resExams = await fetch(`${API_BASE_URL}/api/exams`, { headers: { 'Authorization': `Bearer ${token}` } });
            const exams = await resExams.json();
            const resHw = await fetch(`${API_BASE_URL}/api/homeworks`, { headers: { 'Authorization': `Bearer ${token}` } });
            const hw = await resHw.json();
            
            if(document.getElementById('stat-exams')) {
                document.getElementById('stat-exams').textContent = (exams.length + hw.length) || 0;
            }
            renderExamsTable([...exams, ...hw]);

        } catch (e) { 
            console.error("خطأ أثناء الاتصال بالسيرفر وجلب الإحصائيات الحقيقية:", e); 
        }
    }

    // تشغيل جلب البيانات فور فتح اللوحة تلقائياً
    loadRealStatistics();

    // =========================================================
    // 2️⃣ دالة عرض طلاب المستوى (تشتغل عند النقر على الأزرار الـ 12)
    // =========================================================
    window.showLevelStats = function(levelNum) {
        // تصفية وحساب عدد الطلاب الذين يملكون هذا المستوى في قاعدة البيانات
        const count = allActiveStudents.filter(student => (student.level || 1) === levelNum).length;
        
        // طباعة النتيجة الحقيقية في منتصف الشاشة داخل الصندوق المخصص لها
        const resultDisplay = document.getElementById('level-result-display');
        if(resultDisplay) {
            resultDisplay.innerHTML = `إجمالي عدد الطلاب في <strong style="color:var(--purple)">المستوى ${levelNum}</strong> هو: <span style="color: red; font-size: 30px; font-weight: 900; margin: 0 10px;">${count}</span> طالب مسجّل`;
        }
    };

    // =========================================================
    // 3️⃣ دالة منح الـ XP الذكية ونظام الترقية التلقائي للطلاب
    // =========================================================
    window.giveStudentXP = async function(id, name, currentXP, currentLevel) {
        const points = prompt(`كم XP تريد إعطاءه للطالب البطل "${name}"؟`);
        if(!points || isNaN(points) || parseInt(points) <= 0) return;

        let newXP = parseInt(currentXP) + parseInt(points);
        let newLevel = parseInt(currentLevel);
        
        // إذا تخطى الـ 1000 نقطة يرتفع مستواه تلقائياً الحقيقي
        if (newXP >= 1000) {
            const levelGains = Math.floor(newXP / 1000);
            newLevel += levelGains;
            newXP = newXP % 1000; // الإبقاء على باقي النقاط
            alert(`🎉 مبروك! ترقى الطالب ${name} تلقائياً إلى المستوى ${newLevel}!`);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}/stats`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ xp: newXP, level: newLevel })
            });
            if(res.ok) {
                alert('✅ تم إضافة النقاط وتحديث مستوى الطالب بنجاح!');
                loadRealStatistics(); // إعادة تحديث الأرقام والجدول فوراً
            }
        } catch (e) { alert('❌ خطأ في الاتصال بالسيرفر لحفظ النقاط'); }
    };

    // =========================================================
    // 4️⃣ معالجة فورم نشر المقالات والدروس (رفع حقيقي للملفات والصور والروابط)
    // =========================================================
    const addBlogForm = document.getElementById('admin-add-blog-form');
    if(addBlogForm) {
        addBlogForm.onsubmit = async (e) => {
            e.preventDefault();
            
            // نستخدم FormData لإرسال الملفات والصور الحقيقية للسيرفر عوضاً عن النصوص التقليدية
            const formData = new FormData();
            formData.append('title', document.getElementById('blog-title').value);
            formData.append('content', document.getElementById('blog-content').value);
            
            // إرفاق الرابط الخارجي (فيديو يوتيوب أو رابط خارجي) إن وجد
            const linkInput = document.getElementById('blog-link');
            if(linkInput && linkInput.value) formData.append('link', linkInput.value);

            // إرفاق الصورة الحقيقية أو الفيديو المرفوع من جهازك
            const fileInput = document.getElementById('blog-file');
            if (fileInput && fileInput.files.length > 0) {
                formData.append('file', fileInput.files[0]);
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/blogs`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }, // الـ FormData تضع الـ Content-Type تلقائياً فلا نكتبه يدوياً
                    body: formData
                });
                if(res.ok) { 
                    alert('✅ تم نشر الدرس/المقال وحفظ الملف بنجاح!'); 
                    addBlogForm.reset();
                    loadRealStatistics();
                } else { alert('❌ فشل النشر، تأكد من إعدادات السيرفر'); }
            } catch (err) { alert('❌ تعذر الاتصال بالسيرفر لرفع المقال'); }
        };
    }

    // =========================================================
    // 5️⃣ معالجة فورم إضافة الامتحانات والوظائف (رفع ملفات PDF أو فيديو)
    // =========================================================
    const addExamForm = document.getElementById('admin-add-exam-form');
    if(addExamForm) {
        addExamForm.onsubmit = async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('title', document.getElementById('exam-title').value);
            formData.append('type', document.getElementById('exam-type').value); // امتحان أو وظيفة

            // إرفاق ملف الـ PDF الخاص بالامتحان أو الفيديو التوضيحي للواجب
            const fileInput = document.getElementById('exam-file');
            if (fileInput && fileInput.files.length > 0) {
                formData.append('file', fileInput.files[0]);
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/exams`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if(res.ok) { 
                    alert('✅ تم نشر التقييم ورفع الملف بنجاح!'); 
                    addExamForm.reset();
                    loadRealStatistics();
                } else { alert('❌ فشل النشر.'); }
            } catch (err) { alert('❌ تعذر الاتصال بالسيرفر لرفع ملف التقييم'); }
        };
    }

    // =========================================================
    // 6️⃣ دوال مساعدة لبناء جداول العرض والحذف العام
    // =========================================================
    function renderStudentsTable(students) {
        const tbody = document.getElementById('admin-users-tbody');
        if(!tbody) return;
        tbody.innerHTML = students.map(user => `
            <tr>
                <td><strong>${user.name}</strong><br><small style="color:#777">${user.student_id || 'بدون رقم دراسي'}</small></td>
                <td>${user.email}</td>
                <td><span style="color:var(--purple); font-weight:bold;">Lv.${user.level || 1} | ${user.xp || 0} XP</span></td>
                <td>
                    <button class="admin-btn" style="background:var(--gold); color:#000; padding:4px 10px; font-weight:bold; border-radius:6px;" onclick="giveStudentXP('${user.id}', '${user.name}', ${user.xp || 0}, ${user.level || 1})"><i class="fa-solid fa-star"></i> إعطاء XP</button>
                    <button class="admin-btn btn-danger" onclick="deleteGeneralItem('admin/users', '${user.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    function renderBlogsTable(blogs) {
        const tbody = document.getElementById('admin-blogs-tbody');
        if(!tbody) return;
        tbody.innerHTML = blogs.map(b => `
            <tr>
                <td>${b.title}</td>
                <td>${new Date(b.createdAt).toLocaleDateString('ar-SA')}</td>
                <td><button class="admin-btn btn-danger" onclick="deleteGeneralItem('blogs', '${b._id}')"><i class="fa-solid fa-trash"></i> حذف</button></td>
            </tr>
        `).join('');
    }

    function renderExamsTable(items) {
        const tbody = document.getElementById('admin-exams-tbody');
        if(!tbody) return;
        tbody.innerHTML = items.map(item => `
            <tr>
                <td>${item.title}</td>
                <td><span style="font-weight:bold; color:${item.type === 'exam'?'var(--teal)':'var(--blue)'}">${item.type === 'exam' ? 'امتحان' : 'وظيفة'}</span></td>
                <td><button class="admin-btn btn-danger" onclick="deleteGeneralItem('exams', '${item._id}')"><i class="fa-solid fa-trash"></i> حذف</button></td>
            </tr>
        `).join('');
    }

    // دالة حذف عامة تتصل بقاعدة البيانات مباشرة وتعمل مع جداولك القديمة
    window.deleteGeneralItem = async function(route, id) {
        if(!confirm('هل أنت متأكد تماماً من رغبتك في حذف هذا العنصر نهائياً من قاعدة البيانات؟')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/${route}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if(res.ok) { 
                loadRealStatistics(); // إعادة جلب البيانات وتحديث اللوحة تلقائياً
            } else { alert('❌ فشل الحذف، قد لا تملك الصلاحية الكافية.'); }
        } catch (e) { alert('❌ خطأ في الاتصال بالسيرفر لتنفيذ عملية الحذف'); }
    };
});