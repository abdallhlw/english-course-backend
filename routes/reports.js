const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/pdf', auth, adminOnly, async (req, res) => {
  try {
    const { exam_id, level } = req.query;
    const exam = await Exam.findById(exam_id);
    if(!exam) return res.status(404).json({ error: 'الامتحان غير موجود' });
    
    let query = { exam_id };
    if(level) {
      const students = await User.find({ role: 'student', level });
      query.student_id = { $in: students.map(s => s._id) };
    }
    
    const submissions = await Submission.find(query)
      .populate('student_id', 'name student_id level')
      .sort({ grade: -1 });
    
    const doc = new PDFDocument({ margin: 50, layout: 'rtl' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${exam_id}.pdf`);
    doc.pipe(res);
    
    // استخدم أي خط يدعم العربية (ضع ملف الخط في مجلد المشروع)
    try { doc.registerFont('Cairo', './fonts/Cairo-Regular.ttf'); doc.font('Cairo'); } catch(e) {}
    
    doc.fontSize(22).text('تقرير نتائج الامتحان', 50, 50, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`الامتحان: ${exam.title}`, { align: 'right' });
    doc.text(`التاريخ: ${new Date().toLocaleDateString('ar-EG')}`, { align: 'right' });
    doc.text(`المستوى: ${level || 'جميع المستويات'}`, { align: 'right' });
    doc.moveDown(2);
    
    doc.fontSize(12);
    doc.text('#', 450, doc.y, { width: 50, align: 'center' });
    doc.text('الطالب', 250, doc.y - doc.currentLineHeight(), { width: 180, align: 'right' });
    doc.text('المستوى', 150, doc.y - doc.currentLineHeight(), { width: 80, align: 'center' });
    doc.text('الدرجة', 50, doc.y - doc.currentLineHeight(), { width: 80, align: 'center' });
    doc.moveDown();
    doc.moveDown(0.5);
    
    submissions.forEach((sub, i) => {
      const y = doc.y;
      doc.text(`${i+1}`, 450, y, { width: 50, align: 'center' });
      doc.text(sub.student_id?.name || '—', 250, y, { width: 180, align: 'right' });
      doc.text(String(sub.student_id?.level || '—'), 150, y, { width: 80, align: 'center' });
      const gradeColor = (sub.grade >= (exam.max_grade*0.6)) ? '#22c55e' : '#ef4444';
      doc.text(`${sub.grade ?? '—'} / ${exam.max_grade}`, 50, y, { width: 80, align: 'center' });
      doc.moveDown(0.8);
    });
    
    doc.end();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;