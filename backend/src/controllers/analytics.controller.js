
// src/controllers/analytics.controller.js
const AssessmentResult = require('../models/assessmentResult.model');

exports.getAnalytics = async (req, res) => {
    try {
        const results = await AssessmentResult.find({ user: req.user.id })
            .populate('planId', 'title sections')
            .sort({ submittedAt: -1 });
        res.json(results);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Failed to fetch analytics data' });
    }
};

exports.getSmartReviewTopics = async (req, res) => {
    try {
        const results = await AssessmentResult.find({ user: req.user.id }).populate('planId', 'title sections');
        
        const lowScoringTopics = results
            .filter(result => result.planId !== null) 
            .filter(result => (result.score / result.totalQuestions) < 0.6)
            .map(result => {
                const section = result.planId.sections.find(s => s._id.equals(result.sectionId));
                return {
                    planId: result.planId._id,
                    sectionId: result.sectionId,
                    title: section ? section.title : 'Unknown Topic',
                    planTitle: result.planId.title,
                };
            })
            .filter((value, index, self) => self.findIndex(t => t.sectionId.toString() === value.sectionId.toString()) === index);

        res.json(lowScoringTopics);
    } catch (error) {
        console.error('Error fetching smart review topics:', error);
        res.status(500).json({ message: 'Failed to fetch smart review topics' });
    }
};
