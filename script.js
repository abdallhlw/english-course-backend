document.addEventListener('DOMContentLoaded', function () {

    // تحديد رابط السيرفر تلقائياً (محلي أو خارجي)
// تحديد رابط السيرفر المحلي بشكل ثابت
const API_BASE_URL = 'http://localhost:5000';
        // ===== 1. نظام التنقل =====
    const mainHome = document.getElementById('main-home');
    const pageExams = document.getElementById('page-exams');
    const pageActivities = document.getElementById('page-activities');
    const pageBlog = document.getElementById('page-blog');
    const pageProfile = document.getElementById('page-profile');

    // Toggle Mobile Menu
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.querySelector('.as');
    menuBtn?.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    function showPage(page) {
        if(mainHome) mainHome.classList.add('hidden');
        if(pageExams) pageExams.classList.remove('visible');
        if(pageActivities) pageActivities.classList.remove('visible');
        if(pageBlog) pageBlog.classList.remove('visible');
        if(pageProfile) pageProfile.classList.remove('visible');
        if(page === 'home') mainHome.classList.remove('hidden');
        else if(page === 'exams') pageExams.classList.add('visible');
        else if(page === 'activities') pageActivities.classList.add('visible');
        else if(page === 'blog') pageBlog.classList.add('visible');
        else if(page === 'profile') { pageProfile.classList.add('visible'); loadStudentProfile(); }
        document.querySelectorAll('.as ul li a').forEach(a => a.classList.remove('active'));
        document.getElementById('nav-' + page)?.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Close mobile menu on navigate
        navMenu?.classList.remove('active');
        // Close profile dropdown if open
        document.getElementById('profile-dropdown')?.classList.remove('active');
    }

    function updateNavVisibility(loggedIn) {
        const protectedLinks = document.querySelectorAll('.protected-link');
        protectedLinks.forEach(link => {
            link.style.display = loggedIn ? 'block' : 'none';
        });
    }

    // Function to check login status and update UI
   // Function to check login status and update UI (مربوطة بالسيرفر لجلب XP حقيقي)
  // دالة التحقق من تسجيل الدخول وجلب الإحصائيات الحقيقية
// Function to check login status and update UI
  // Function to check login status and update UI
    async function checkLoginStatus() {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const loggedIn = !!(token && userStr);

        const guestAuth = document.getElementById('guest-auth');
        const loggedInAuth = document.getElementById('logged-in-auth');
        const reviewSection = document.getElementById('add-review-section');

        if (loggedIn) {
            const user = JSON.parse(userStr);
            if (reviewSection) reviewSection.style.display = user.role === 'student' ? 'block' : 'none';
            if (guestAuth) guestAuth.style.display = 'none';
            if (loggedInAuth) loggedInAuth.style.display = 'flex';

            // 1. تحديث الصورة الشخصية في الهيدر فوراً
            if (user.avatar_url) {
                const newImageUrl = `${API_BASE_URL}${user.avatar_url}?t=${new Date().getTime()}`;
                const headerAvatar = document.querySelector('#avatar-btn img') || document.querySelector('.user-avatar-box img');
                if (headerAvatar) headerAvatar.src = newImageUrl;
            }

            // 2. جلب المستوى والـ XP الحقيقي من قاعدة البيانات
            try {
                const res = await fetch(`${API_BASE_URL}/api/student/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const liveUser = await res.json();
                    const currentLevel = liveUser.level || 1;
                    const currentXP = liveUser.xp || 0;
                    const percentage = Math.min((currentXP / 1000) * 100, 100);

                    // استهداف العناصر الصحيحة بناءً على تصميمك (Classes)
                    const levelBadge = document.querySelector('.xp-level-badge');
                    const xpFill = document.querySelector('.mc-xp-fill');
                    const xpText = document.querySelector('.xp-text');

                    if (levelBadge) levelBadge.textContent = `Lv.${currentLevel}`;
                    if (xpFill) xpFill.style.width = `${percentage}%`;
                    if (xpText) xpText.textContent = `${currentXP} / 1000 XP`;
                    
                    // تحديث البيانات محلياً لتبقى دقيقة عند التنقل بين الصفحات
                    user.xp = currentXP;
                    user.level = currentLevel;
                    localStorage.setItem('user', JSON.stringify(user));
                }
            } catch (error) {
                console.error("تعذر جلب بيانات الطالب الحية:", error);
            }
        } else {
            if (reviewSection) reviewSection.style.display = 'none';
            if (guestAuth) guestAuth.style.display = 'flex';
            if (loggedInAuth) loggedInAuth.style.display = 'none';
        }
        
        updateNavVisibility(loggedIn);
    }
    // Navigation event listeners
    document.getElementById('nav-home')?.addEventListener('click', e => { if(mainHome) { e.preventDefault(); showPage('home'); } });
    document.getElementById('nav-exams')?.addEventListener('click', e => { if(pageExams) { e.preventDefault(); showPage('exams'); } });
    document.getElementById('nav-activities')?.addEventListener('click', e => { if(pageActivities) { e.preventDefault(); showPage('activities'); } });
    document.getElementById('nav-blog')?.addEventListener('click', () => { window.location.href = 'blog.html'; });
    // Note: nav-profile is inside the dropdown, handled by avatarBtn click
    document.getElementById('nav-profile')?.addEventListener('click', e => { if(pageProfile) { e.preventDefault(); showPage('profile'); } });
    document.getElementById('blog-title-link')?.addEventListener('click', () => { window.location.href = 'blog.html'; });
    document.querySelectorAll('.open-exams-page').forEach(btn => btn.addEventListener('click', () => showPage('exams')));
    document.querySelectorAll('.open-activities-page').forEach(btn => btn.addEventListener('click', () => showPage('activities')));
    document.querySelectorAll('.open-specific-blog').forEach(btn => btn.addEventListener('click', () => { showPage('blog'); alert('تم فتح المقال لقراءته!'); }));

    // ===== 2. بيانات المستويات =====
    const levelsData = [
        { num: 1, title: 'المستوى الأول - المبتدئ الأساسي', desc: 'يغطي هذا المستوى أساسيات اللغة الإنجليزية من تعريف الحروف والأصوات والمفردات اليومية الضرورية. مثالي لمن يبدأ من الصفر.', topics: ['الحروف والأصوات','التحيات اليومية','الأرقام والألوان','الجملة الأساسية'] },
        { num: 2, title: 'المستوى الثاني - المبتدئ المتطور', desc: 'توسيع المفردات وتعلم التراكيب الأساسية. التعرف على ضمائر الفاعل والأفعال الأساسية.', topics: ['الضمائر','فعل to be','المفردات المنزلية','الوصف البسيط'] },
        { num: 3, title: 'المستوى الثالث - المتوسط الأدنى', desc: 'دراسة الأزمنة الأساسية والجمل المركبة. القدرة على التحدث عن الماضي والحاضر والمستقبل ببساطة.', topics: ['المضارع البسيط','الماضي البسيط','المستقبل بـ will','الجمل الشرطية'] },
        { num: 4, title: 'المستوى الرابع - المتوسط', desc: 'تطوير مهارات الاستماع والتحدث مع التركيز على القواعد المتوسطة وتوسيع المفردات في مجالات محددة.', topics: ['Present Perfect','المقارنة','المبني للمجهول','الأسئلة المعقدة'] },
        { num: 5, title: 'المستوى الخامس - المتوسط المتقدم', desc: 'مهارات القراءة والكتابة الأكاديمية. فهم النصوص الطويلة والتعبير عن الآراء بوضوح.', topics: ['الكتابة الأكاديمية','القراءة المكثفة','الـ Conditionals','المصطلحات المهنية'] },
        { num: 6, title: 'المستوى السادس - فوق المتوسط', desc: 'الوصول إلى مستوى B2 والتحدث بطلاقة في مواضيع متنوعة. التحضير لامتحانات القبول الجامعي.', topics: ['المناقشة والجدال','التقارير الرسمية','Phrasal Verbs','اللهجات الإنجليزية'] },
        { num: 7, title: 'المستوى السابع - المتقدم الأول', desc: 'تحليل النصوص الأدبية والأكاديمية المعقدة. بناء حجج قوية في الكتابة والخطابة.', topics: ['التحليل الأدبي','كتابة المقال','المصطلحات الأكاديمية','العرض التقديمي'] },
        { num: 8, title: 'المستوى الثامن - المتقدم الثاني', desc: 'الإعداد لاختبارات IELTS وTOEFL بشكل مكثف. التعامل مع نصوص أكاديمية وعلمية متخصصة.', topics: ['IELTS Writing','Academic Reading','Listening Skills','Speaking Fluency'] },
        { num: 9, title: 'المستوى التاسع - شبه الاحترافي', desc: 'اللغة في بيئات العمل والأعمال التجارية. إتقان الكتابة الرسمية والتواصل المهني على أعلى مستوى.', topics: ['Business English','العروض التجارية','التفاوض','الإيميلات الرسمية'] },
        { num: 10, title: 'المستوى العاشر - الاحترافي', desc: 'إتقان شامل للغة يؤهلك للعمل في بيئات ناطقة بالإنجليزية. التعامل مع الأدب والفلسفة والعلوم.', topics: ['الأدب الإنجليزي','الكتابة الإبداعية','اللغة الأكاديمية','الترجمة التقنية'] },
        { num: 11, title: 'المستوى الحادي عشر - خبير', desc: 'مستوى متخصص للمعلمين والمترجمين والأكاديميين. دراسة اللغويات وتاريخ اللغة الإنجليزية.', topics: ['علم اللغويات','تاريخ الإنجليزية','تحليل الخطاب','تدريس اللغة'] },
        { num: 12, title: 'المستوى الثاني عشر - المتميز', desc: 'المستوى الأعلى والنهائي. يتضمن إتقان جميع مهارات اللغة بما يعادل مستوى الناطق الأصلي.', topics: ['C2 Proficiency','الكتابة المتخصصة','التحكيم اللغوي','البحث الأكاديمي'] }
    ];

    // ===== 3. نافذة المستوى - وصف الدورة فقط + زر واتساب =====
    let currentLevelNum = 1;

    const levelModalHTML = `
    <div id="level-modal-overlay">
      <div class="level-modal-box">
        <button class="close-level-modal" id="close-level-modal">&times;</button>
        <div class="level-modal-header">
          <h2 class="level-modal-title" id="modal-level-title">عنوان المستوى</h2>
          <div class="level-modal-nav">
            <button class="modal-nav-btn" id="modal-prev-btn"><i class="fa-solid fa-chevron-right"></i></button>
            <span class="modal-level-badge" id="modal-level-badge">المستوى 1</span>
            <button class="modal-nav-btn" id="modal-next-btn"><i class="fa-solid fa-chevron-left"></i></button>
          </div>
        </div>
        <div class="level-modal-body">
          <p class="level-desc" id="modal-level-desc">الوصف</p>
          <div class="level-topics" id="modal-level-topics"></div>
        </div>
        <a href="#" class="whatsapp-btn" id="level-whatsapp-btn" target="_blank">
          <i class="fa-brands fa-whatsapp"></i>
          أرسل رسالة عبر واتساب للتسجيل في هذا المستوى
        </a>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', levelModalHTML);

    function renderModalLevel(num) {
        const data = levelsData[num - 1];
        document.getElementById('modal-level-title').textContent = data.title;
        document.getElementById('modal-level-badge').textContent = 'المستوى ' + num;
        document.getElementById('modal-level-desc').textContent = data.desc;

        const topicsEl = document.getElementById('modal-level-topics');
        topicsEl.innerHTML = data.topics.map(t => `<span class="topic-tag">${t}</span>`).join('');

        const whatsappText = encodeURIComponent(`مرحباً، أريد التسجيل في ${data.title}`);
        document.getElementById('level-whatsapp-btn').href = `https://wa.me/963999999999?text=${whatsappText}`;
    }

    function openLevelModal(num) {
        currentLevelNum = num;
        renderModalLevel(num);
        document.getElementById('level-modal-overlay').classList.add('active');
    }

    function closeLevelModal() {
        document.getElementById('level-modal-overlay').classList.remove('active');
    }

    function updateXPUI(user) {
        if (!user || user.role !== 'student') {
            const xpSection = document.querySelector('.xp-section');
            if (xpSection) xpSection.style.display = 'none';
            return;
        }

        const levelBadge = document.querySelector('.xp-level-badge');
        const xpFill = document.querySelector('.mc-xp-fill');
        const xpText = document.querySelector('.xp-text');

        if (levelBadge) levelBadge.textContent = `Lv.${user.level || 1}`;
        
        const xpMax = 1000; // نفترض أن كل مستوى يحتاج 1000 XP
        const currentXP = user.xp || 0;
        const percentage = Math.min((currentXP / xpMax) * 100, 100);

        if (xpFill) xpFill.style.width = `${percentage}%`;
        if (xpText) xpText.textContent = `${currentXP} / ${xpMax} XP`;
    }

    document.querySelectorAll('.level-card').forEach(card => {
        card.addEventListener('click', function() {
            openLevelModal(parseInt(this.dataset.level));
        });
    });

    document.getElementById('close-level-modal')?.addEventListener('click', closeLevelModal);
    document.getElementById('level-modal-overlay')?.addEventListener('click', function(e) {
        if(e.target === this) closeLevelModal();
    });

    document.getElementById('modal-prev-btn')?.addEventListener('click', () => {
        currentLevelNum = currentLevelNum > 1 ? currentLevelNum - 1 : 12;
        renderModalLevel(currentLevelNum);
    });
    document.getElementById('modal-next-btn')?.addEventListener('click', () => {
        currentLevelNum = currentLevelNum < 12 ? currentLevelNum + 1 : 1;
        renderModalLevel(currentLevelNum);
    });

    // ===== 4. منطق تسجيل الدخول والتسجيل (مربوط بالسيرفر الحقيقي) =====
    const guestAuth = document.getElementById('guest-auth');
    const loggedInAuth = document.getElementById('logged-in-auth');
    const token = localStorage.getItem('token');
    if(token) { if(guestAuth) guestAuth.style.display = 'none'; if(loggedInAuth) loggedInAuth.style.display = 'flex'; }

    let hasTakenPlacementTest = false;
    const studentExamsSection = document.getElementById('student-exams-section');
    const examInfoOverlay = document.getElementById('exam-info-overlay');

    document.getElementById('intro-placement-btn')?.addEventListener('click', function() {
        // Check if user is logged in using localStorage
        const token = localStorage.getItem('token');
        if(!token) { window.location.href = 'login.html?tab=login'; } // Redirect to login page
        else if(hasTakenPlacementTest) { alert('لقد قمت بإجراء الاختبار مسبقاً.'); }
        else { examInfoOverlay.classList.add('active'); }
    });

    document.getElementById('intro-start-learning-btn')?.addEventListener('click', () => {
        alert('مرحباً بك! سيتم إضافة خطة تعلم مخصصة هنا قريباً.');
    });

    document.getElementById('close-exam-info')?.addEventListener('click', () => examInfoOverlay.classList.remove('active'));
    document.getElementById('confirm-start-exam')?.addEventListener('click', () => {
        hasTakenPlacementTest = true;
        examInfoOverlay.classList.remove('active');
    });

    // ===== 5. قائمة الصورة الشخصية وتسجيل الخروج =====
    const avatarBtn = document.getElementById('avatar-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');

    if(avatarBtn) {
        avatarBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
    }

    document.addEventListener('click', function(e) {
        if(profileDropdown && profileDropdown.classList.contains('active') && avatarBtn && !avatarBtn.contains(e.target)) {
            profileDropdown.classList.remove('active');
        }
    });

    // 🔴 4. تسجيل الخروج وحذف الـ Token
    if(logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if(loggedInAuth) loggedInAuth.style.display = 'none';
            if(guestAuth) guestAuth.style.display = 'flex';
            if(studentExamsSection) studentExamsSection.style.display = 'none';
            updateNavVisibility(false);
            if(profileDropdown) profileDropdown.classList.remove('active');
            
            alert('تم تسجيل الخروج بنجاح.');
        });
    }

    // ===== 6. نافذة الرسائل =====
    const messagesOverlay = document.getElementById('messages-overlay');
    const notificationsOverlay = document.getElementById('notifications-overlay');
    const messagesBtn = document.getElementById('messages-btn');
    const notificationsBtn = document.getElementById('notifications-btn');

 messagesBtn?.addEventListener('click', () => {
    window.location.href = 'chat.html';
});
    notificationsBtn?.addEventListener('click', () => {
        notificationsOverlay.classList.add('active');
        markNotificationsAsRead();
    });

    async function fetchNotifications() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/student/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const notifications = await response.json();
            renderNotifications(notifications);
        } catch (err) { console.error("Error fetching notifications:", err); }
    }

    function renderNotifications(notifications) {
        const list = document.getElementById('notifications-list');
        const badge = document.querySelector('#notifications-btn .badge');
        if (!list) return;

        if (notifications.length === 0) {
            list.innerHTML = '<p style="text-align: center; padding: 20px; color: #888;">لا توجد إشعارات جديدة.</p>';
            if (badge) badge.style.display = 'none';
            return;
        }

        const unreadCount = notifications.filter(n => !n.read).length;
        if (badge && unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        }

        list.innerHTML = notifications.map(n => `
            <div class="notification-item ${n.read ? '' : 'unread'}">
                <div class="notification-icon">
                    <i class="fa-solid ${n.type === 'exam' ? 'fa-file-pen' : n.type === 'activity' ? 'fa-gamepad' : 'fa-circle-info'}"></i>
                </div>
                <div class="notification-content">
                    <h4>${n.title}</h4>
                    <p>${n.message}</p>
                    <span class="notification-time">${new Date(n.createdAt).toLocaleDateString('ar-SA')}</span>
                </div>
            </div>
        `).join('');
    }

    async function fetchMessages() {
        const list = document.getElementById('messages-list');
        if (list) list.innerHTML = '<p style="text-align: center; padding: 20px; color: #888;">صندوق المحادثات سيفتح قريباً عند بدء المجموعات.</p>';
    }

    async function markNotificationsAsRead() {
        const token = localStorage.getItem('token');
        if (!token) return;
        fetch(`${API_BASE_URL}/api/student/notifications/read`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(() => {
            const badge = document.querySelector('#notifications-btn .badge');
            if (badge) badge.style.display = 'none';
        });
    }
    document.getElementById('close-messages')?.addEventListener('click', () => messagesOverlay.classList.remove('active'));
    document.getElementById('close-notifications')?.addEventListener('click', () => notificationsOverlay.classList.remove('active'));

    messagesOverlay?.addEventListener('click', function(e) {
        if(e.target === this) messagesOverlay.classList.remove('active');
    });
    notificationsOverlay?.addEventListener('click', function(e) {
        if(e.target === this) notificationsOverlay.classList.remove('active');
    });

    // ===== 7. سلايدر المدونات =====
    const blogSlides = document.querySelectorAll('.blog-slide');
    let currentBlog = 0;

    function updateBlogSlider() {
        blogSlides.forEach((s, idx) => {
            s.classList.remove('active');
            if(idx === currentBlog) s.classList.add('active');
        });
    }
    document.getElementById('blog-next')?.addEventListener('click', () => {
        currentBlog = (currentBlog + 1) % blogSlides.length;
        updateBlogSlider();
    });
    document.getElementById('blog-prev')?.addEventListener('click', () => {
        currentBlog = (currentBlog - 1 + blogSlides.length) % blogSlides.length;
        updateBlogSlider();
    });
    if(blogSlides.length > 0) {
        setInterval(() => {
            currentBlog = (currentBlog + 1) % blogSlides.length;
            updateBlogSlider();
        }, 5000);
    }

    // 🔵 3. فحص الـ Token عند تحديث الصفحة ليبقى المستخدم متصلاً
    checkLoginStatus();


    // ===== 8. آراء الطلاب - مربع كبير مع 3 تعليقات =====
    let testimonialsData = [
        [
            { name: 'أحمد المصطفى', img: 'photo/aaa.jpg', text: 'تجربة دراسية لا تنسى! الشرح مبسط جداً والأنشطة ممتازة. ارتفع مستواي بشكل ملحوظ.', stars: 5, likes: 45, comments: 12 },
            { name: 'نور الهدى', img: 'photo/aaa.jpg', text: 'غرف المحادثة كسرت حاجز الخوف لدي. أنصح الجميع بالتسجيل في هذه المنصة الرائعة!', stars: 5, likes: 89, comments: 24 },
            { name: 'خالد العبيد', img: 'photo/aaa.jpg', text: 'أفضل منصة للتحضير للآيلتس. المدرسون قمة في التعاون والاحترافية والشرح الواضح.', stars: 5, likes: 112, comments: 30 }
        ]
    ];

    // جلب الآراء من السيرفر وتحديث القائمة
    async function fetchTestimonials() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/testimonials`);
            const data = await response.json();
            if (data && data.length > 0) {
                // تحويل البيانات لشكل صفحات (كل صفحة 3 آراء)
                const pages = [];
                for (let i = 0; i < data.length; i += 3) {
                    pages.push(data.slice(i, i + 3));
                }
                testimonialsData = pages;
                renderTestimonials(0);
                currentTestimonialPage = 0; // إعادة التوجيه للصفحة الأولى لمشاهدة الجديد
                renderTestimonialDots();
            }
        } catch (e) {
            console.warn("Using static testimonials as fallback");
        }
    }

    const testimonialsWrapper = document.getElementById('testimonials-wrapper');
    const testimonialsDots = document.getElementById('testimonials-dots');
    let currentTestimonialPage = 0;
    let testimonialInterval = null;

    function renderTestimonials(page) {
        if (!testimonialsData || testimonialsData.length === 0) return;
        const batch = testimonialsData[page];
        if (!batch) return;

        testimonialsWrapper.innerHTML = `
            <div class="testimonial-slide">
                ${batch.map(r => `
                    <div class="testimonial-card-big">
                        <div class="testimonial-header">
                            <img src="${r.img}" alt="${r.name}">
                            <div class="testimonial-info">
                                <h4>${r.name}</h4>
                                <div class="testimonial-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</div>
                            </div>
                        </div>
                        <div class="testimonial-text">"${r.text}"</div>
                        <div class="testimonial-stats">
                            <span><i class="fa-solid fa-heart"></i> ${r.likes || 0} إعجاب</span>
                            <span><i class="fa-solid fa-comment"></i> ${r.comments || 0} تعليق</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderTestimonialDots() {
        testimonialsDots.innerHTML = testimonialsData.map((_, i) => 
            `<div class="testimonials-dot ${i === 0 ? 'active' : ''}" data-page="${i}"></div>`
        ).join('');
        testimonialsDots.querySelectorAll('.testimonials-dot').forEach(dot => {
            dot.addEventListener('click', function() {
                currentTestimonialPage = parseInt(this.dataset.page);
                renderTestimonials(currentTestimonialPage);
                updateTestimonialDots();
                resetTestimonialTimer();
            });
        });
    }

    function updateTestimonialDots() {
        testimonialsDots.querySelectorAll('.testimonials-dot').forEach((d, i) => {
            d.classList.toggle('active', i === currentTestimonialPage);
        });
    }

    function nextTestimonial() {
        currentTestimonialPage = (currentTestimonialPage + 1) % testimonialsData.length;
        renderTestimonials(currentTestimonialPage);
        updateTestimonialDots();
    }

    function resetTestimonialTimer() {
        if(testimonialInterval) clearInterval(testimonialInterval);
        testimonialInterval = setInterval(nextTestimonial, 5000);
    }

    if(testimonialsWrapper) {
        fetchTestimonials(); // جلب البيانات الحقيقية فور التحميل
        resetTestimonialTimer();
    }

    // دالة إظهار التنبيهات (Toast) لضمان عدم تعطل الكود عند استدعائها
    function toast(msg, type = 'ok') {
        const t = document.getElementById('toast') || document.createElement('div');
        if (!document.getElementById('toast')) { t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
        t.textContent = msg;
        t.style.background = type === 'err' ? '#d63031' : '#2d3436';
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }

    // ===== 10. معالجة إرسال رأي الطالب =====
    const reviewForm = document.getElementById('student-review-form');
    reviewForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');

        if (!user || !token) {
            alert('يرجى تسجيل الدخول أولاً لتتمكن من إضافة رأيك.');
            return;
        }

        const reviewText = document.getElementById('review-text').value;
        const rating = document.querySelector('input[name="rating"]:checked').value;

        try {
            const response = await fetch(`${API_BASE_URL}/api/testimonials`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: user.name,
                    text: reviewText,
                    stars: parseInt(rating),
                    img: user.avatar_url ? API_BASE_URL + user.avatar_url : 'photo/aaa.jpg'
                })
            });

            if (response.ok) {
                toast('شكرًا لك! تم نشر رأيك بنجاح.');
                reviewForm.reset();
                // تحديث القائمة فوراً من قاعدة البيانات
                await fetchTestimonials();
                // الانتقال للأعلى قليلاً لرؤية النتيجة
                document.getElementById('testimonials-big-box')?.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert('حدث خطأ أثناء إرسال الرأي، يرجى المحاولة لاحقاً.');
            }
        } catch (error) {
            console.error('Error sending review:', error);
            alert('تعذر الاتصال بالسيرفر لإرسال رأيك.');
        }
    });

    // ===== 9. الملف الشخصي والجوائز =====
    async function loadStudentProfile() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/student/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const studentData = await response.json();
            
            if (response.ok) {
                document.getElementById('profile-name').textContent = studentData.name;
                const displayIdEl = document.getElementById('student-display-id');
                if (displayIdEl) displayIdEl.textContent = studentData.student_id || 'غير متوفر';

                const profileImgEl = document.getElementById('profile-avatar-img');
                if (studentData.avatar_url && profileImgEl) {
                    profileImgEl.src = `${API_BASE_URL}${studentData.avatar_url}`;
                }

                const currentLevel = studentData.level || 1;
                const currentXP = studentData.xp || 0;
                
                document.getElementById('profile-level').textContent = currentLevel;
                document.getElementById('profile-xp').textContent = currentXP;

                const xpNeededForNextLevel = 1000;
                const xpProgress = currentXP % xpNeededForNextLevel;
                const progressPercentage = (xpProgress / xpNeededForNextLevel) * 100;
                
                setTimeout(() => {
                    const progressBar = document.getElementById('xp-progress-bar');
                    if(progressBar) progressBar.style.width = `${progressPercentage}%`;
                }, 500);

                renderRewards(currentLevel);
            }
        } catch (error) {
            console.error("تعذر جلب بيانات الطالب:", error);
        }
    }

    document.getElementById('student-avatar-file-input')?.addEventListener('change', function() {
        if(this.files.length > 0) {
            const uploadBtn = document.getElementById('student-upload-avatar-btn');
            if(uploadBtn) uploadBtn.style.display = 'inline-block';
        }
    });

    function renderRewards(studentLevel) {
        const rewardsContainer = document.getElementById('rewards-container');
        if(!rewardsContainer) return;
        rewardsContainer.innerHTML = ''; 

        const allRewards = [
            { levelRequired: 1, title: 'البداية الموفقة', icon: '🌱' },
            { levelRequired: 3, title: 'طالب مجتهد', icon: '⭐' },
            { levelRequired: 5, title: 'متحدث لَبِق', icon: '🎙️' },
            { levelRequired: 8, title: 'قارئ نهم', icon: '📚' },
            { levelRequired: 10, title: 'خبير اللغة', icon: '👑' }
        ];

        allRewards.forEach(reward => {
            const isUnlocked = studentLevel >= reward.levelRequired;
            const badgeHTML = `
                <div class="reward-badge ${isUnlocked ? '' : 'reward-locked'}">
                    <div style="font-size: 40px;">${reward.icon}</div>
                    <p>${reward.title}</p>
                    ${!isUnlocked ? `<small style="font-size:10px; color:#999;">يفتح في مستوى ${reward.levelRequired}</small>` : ''}
                </div>
            `;
            rewardsContainer.innerHTML += badgeHTML;
        });
    }

    // معالجة الروابط القادمة من صفحات خارجية عبر الـ Hash (مثل index.html#exams)
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash && ['home', 'exams', 'activities', 'profile'].includes(currentHash)) {
        setTimeout(() => showPage(currentHash), 100);
    }

});