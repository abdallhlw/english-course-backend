// models/Submission.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    exam_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Exam',
        required: true
    },
    student_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', // يفترض أن نموذج المستخدم اسمه User
        required: true
    },
    score: { 
        type: Number, 
        default: 0 
    },
    answers: {
        type: Array,
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);