import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from './Icon';

// This new component calculates and displays only the topics scheduled for today.
const TodayTopics = ({ plans, onSelectPlan }) => {
    const todaysTopics = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to the start of the day for accurate comparison

        const topics = [];
        plans.forEach(plan => {
            // Ensure the plan has a start date before processing
            if (!plan.startDate) return;

            plan.sections.forEach(section => {
                const sectionDate = new Date(plan.startDate);
                // Calculate the specific date for this section
                sectionDate.setDate(sectionDate.getDate() + section.day - 1);
                sectionDate.setHours(0, 0, 0, 0);

                if (sectionDate.getTime() === today.getTime()) {
                    topics.push({ ...section, plan }); // Add the full plan object for context
                }
            });
        });
        return topics;
    }, [plans]);

    if (todaysTopics.length === 0) {
        return <p className="text-sm text-gray-400">No topics scheduled for today.</p>;
    }

    return (
        <div className="space-y-2">
            {todaysTopics.map(topic => (
                <button 
                    key={topic._id} 
                    onClick={() => onSelectPlan(topic.plan, topic._id)}
                    className="w-full text-left p-2 rounded-md bg-gray-100 dark:bg-gray-900/70 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                    <span className="font-semibold">{topic.title}</span>
                    <span className="text-xs text-gray-500 block">from "{topic.plan.title}"</span>
                </button>
            ))}
        </div>
    );
};


export const Dashboard = ({ plans, onSelectPlan, onCreateNew, onAnalytics, onFlashcards, onDeletePlan, onBack }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [planToDelete, setPlanToDelete] = useState(null);
    const [lowScoreTopics, setLowScoreTopics] = useState([]);

    useEffect(() => {
        const fetchReviewTopics = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/analytics/smart-review`, {
                    headers: { 'x-auth-token': localStorage.getItem('token') }
                });
                if (!response.ok) return;
                const data = await response.json();
                setLowScoreTopics(data);
            } catch (error) {
                console.error("Failed to fetch smart review topics", error);
            }
        };
        fetchReviewTopics();
    }, [plans]);

    const handleDeleteClick = (e, plan) => {
        e.stopPropagation();
        setPlanToDelete(plan);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!planToDelete) return;
        await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/plans/${planToDelete._id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        setShowDeleteModal(false);
        setPlanToDelete(null);
        onDeletePlan();
    };

    const handleReviewClick = (topic) => {
        const planToView = plans.find(p => p._id === topic.planId);
        if (planToView) {
            onSelectPlan(planToView, topic.sectionId);
        }
    };

    const calculateProgress = (plan) => {
        const sections = plan.sections || [];
        if (sections.length === 0) return 0;
        const completed = sections.filter(s => s.status === 'completed').length;
        return (completed / sections.length) * 100;
    };

    return (
        <div className="animate-fade-in">
             <button onClick={onBack} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center mb-6">
                <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> Back to Features
            </button>
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold">Confirm Deletion</h3>
                        <p className="my-4 text-gray-600 dark:text-gray-400">Are you sure you want to delete the plan "{planToDelete?.title}"?</p>
                        <div className="flex justify-end space-x-4">
                            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                            <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <h2 className="text-4xl font-bold text-gray-800 dark:text-white">My Dashboard</h2>
                <div className="flex items-center space-x-4">
                    <button onClick={onFlashcards} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center"><Icon path="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6" className="w-5 h-5 mr-2"/>Flashcards</button>
                    <button onClick={onAnalytics} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center"><Icon path="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125-1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125-1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" className="w-5 h-5 mr-2"/>Analytics</button>
                    <button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center"><Icon path="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" className="w-5 h-5 mr-2"/>New Plan</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <div className="bg-white/10 dark:bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-blue-800/30">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Today's Topics</h3>
                    <TodayTopics plans={plans} onSelectPlan={onSelectPlan} />
                </div>
                <div className="bg-white/10 dark:bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-blue-800/30">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Smart Review</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Topics to revisit based on recent assessment scores.</p>
                    <div className="space-y-2">
                        {lowScoreTopics.length > 0 ? lowScoreTopics.map(topic => (
                            <button key={topic.sectionId} onClick={() => handleReviewClick(topic)} className="w-full text-left p-2 rounded-md bg-gray-100 dark:bg-gray-900/70 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                                <span className="font-semibold">{topic.title}</span>
                                <span className="text-xs text-gray-500 block">from "{topic.planTitle}"</span>
                            </button>
                        )) : <p className="text-sm text-gray-400">You're on top of everything!</p>}
                    </div>
                </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">My Study Plans</h3>
            {plans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => {
                        const progress = calculateProgress(plan);
                        const sections = plan.sections || [];
                        const completedCount = sections.filter(s => s.status === 'completed').length;
                        return (
                            <div key={plan._id} onClick={() => onSelectPlan(plan)} className="bg-white/10 dark:bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-blue-800/30 cursor-pointer transition-all duration-300 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/30 hover:-translate-y-1 group relative">
                                <button onClick={(e) => handleDeleteClick(e, plan)} className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-red-200 dark:hover:bg-red-900/50 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134H8.716c-1.123 0-2.033.954-2.033 2.134v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" className="w-5 h-5"/>
                                </button>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white truncate pr-8">{plan.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Created: {new Date(plan.createdAt).toLocaleDateString()}</p>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-4 h-2.5">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">{completedCount} / {sections.length} days complete</p>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No plans yet!</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Click "New Plan" to create your first AI-powered study schedule.</p>
                </div>
            )}
        </div>
    );
};
