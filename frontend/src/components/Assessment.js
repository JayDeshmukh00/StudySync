import React, { useState } from 'react';
import { Spinner } from './Icon';

export const AssessmentView = ({ questions, planId, sectionId, onSubmit }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState(Array(questions.length).fill(null));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAnswerSelect = (option) => { const newAnswers = [...answers]; newAnswers[currentQuestionIndex] = option; setAnswers(newAnswers); };
    const handleNext = () => { if (currentQuestionIndex < questions.length - 1) { setCurrentQuestionIndex(currentQuestionIndex + 1); } };
    const handleSubmitQuiz = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/submit-assessment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') }, 
                body: JSON.stringify({ planId, sectionId, answers, questions }), 
            });
            if (!response.ok) throw new Error('Failed to submit assessment');
            const result = await response.json();
            onSubmit(result);
        } catch (error) { alert("Could not submit the quiz."); } finally { setIsSubmitting(false); }
    };

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="bg-white/10 dark:bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-2xl shadow-blue-900/20 border border-blue-800/30 max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Daily Assessment</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Question {currentQuestionIndex + 1} of {questions.length}</p>
            <div className="mb-6"><p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{currentQuestion.question}</p></div>
            <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option, index) => (
                    <button key={index} onClick={() => handleAnswerSelect(option)} className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${answers[currentQuestionIndex] === option ? 'bg-blue-200/50 dark:bg-blue-900/50 border-blue-500' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                        {option}
                    </button>
                ))}
            </div>
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">{answers.filter(a => a !== null).length} / {questions.length} answered</p>
                {currentQuestionIndex < questions.length - 1 ? (
                    <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg">Next</button>
                ) : (
                    <button onClick={handleSubmitQuiz} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center disabled:bg-green-800">
                        {isSubmitting ? <><Spinner /><span className="ml-3">Submitting...</span></> : 'Submit'}
                    </button>
                )}
            </div>
        </div>
    );
};

export const ResultView = ({ result, onBack }) => {
    const { score, totalQuestions } = result;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const message = percentage >= 80 ? "Excellent work! 🚀" : percentage >= 60 ? "Good job! 👍" : "Keep practicing! 💪";

    return (
        <div className="bg-white/10 dark:bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-2xl shadow-blue-900/20 border border-blue-800/30 max-w-md mx-auto text-center animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Assessment Complete!</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-6">{message}</p>
            <div className="mb-6">
                <p className="text-5xl font-bold text-blue-500">{score}<span className="text-3xl text-gray-400 dark:text-gray-500">/{totalQuestions}</span></p>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-2">({percentage}%)</p>
            </div>
            <button onClick={onBack} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300">Back to Study Plan</button>
        </div>
    );
};
