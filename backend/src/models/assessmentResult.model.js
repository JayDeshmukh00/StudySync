const mongoose = require('mongoose');

const AssessmentResultSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AssessmentResult', AssessmentResultSchema);
