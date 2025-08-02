// src/models/plan.model.js
const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
    day: { type: Number, required: true },
    title: { type: String, required: true },
    topic: { type: String, required: true },
    explanation: { type: String, required: true },
    keyPoints: { type: [String], default: [] },
    status: { type: String, default: 'pending' }, // e.g., 'pending', 'in-progress', 'completed'
    notes: { type: String, default: '' },
    youtubeSearchQueries: { type: [String], default: [] },
    referralSearchQueries: { type: [String], default: [] },
    questions: { type: [String], default: [] },
    pyqs: { type: [String], default: [] }
});

const PlanSchema = new mongoose.Schema({
    title: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sections: { type: [SectionSchema], default: [] },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Plan', PlanSchema);