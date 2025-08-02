import React, { useState, useEffect, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Icon } from './Icon';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const AnalyticsView = ({ onBack }) => {
    const [allResults, setAllResults] = useState([]);
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                const token = localStorage.getItem('token');
                // Fetch both plans and results in parallel for efficiency
                const [plansResponse, resultsResponse] = await Promise.all([
                    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/plans`, { headers: { 'x-auth-token': token } }),
                    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/analytics`, { headers: { 'x-auth-token': token } })
                ]);
                
                const plansData = await plansResponse.json();
                const resultsData = await resultsResponse.json();

                setPlans(plansData);
                setAllResults(resultsData);
                // Default to selecting the first plan if available
                if (plansData.length > 0) {
                    setSelectedPlanId(plansData[0]._id);
                }
            } catch (error) { 
                console.error("Failed to fetch analytics data", error); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchAnalyticsData();
    }, []);

    const { chartData, recentAssessments } = useMemo(() => {
        if (!selectedPlanId) return { chartData: { labels: [], datasets: [] }, recentAssessments: [] };

        const selectedPlan = plans.find(p => p._id === selectedPlanId);
        const filteredResults = allResults.filter(result => result.planId?._id === selectedPlanId);

        // Create labels from the sections of the selected plan
        const labels = selectedPlan?.sections.map(s => `Day ${s.day}: ${s.title.substring(0, 15)}...`) || [];
        
        // Map results to the corresponding section, showing performance for each module
        const data = selectedPlan?.sections.map(section => {
            const sectionResult = filteredResults.find(r => r.sectionId === section._id);
            if (!sectionResult) return null; // Use null for days without an assessment
            return (sectionResult.score / sectionResult.totalQuestions) * 100;
        }) || [];

        const newChartData = {
            labels,
            datasets: [{
                label: 'Score (%)',
                data,
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            }],
        };

        return { chartData: newChartData, recentAssessments: filteredResults };
    }, [selectedPlanId, allResults, plans]);

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div></div>;

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center mb-6">
                <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> Back to Dashboard
            </button>
            <div className="bg-white/10 dark:bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-2xl shadow-blue-900/20 border border-blue-800/30">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">My Analytics</h2>
                
                <div className="mb-6">
                    <label htmlFor="plan-select" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Select a Study Plan to View Analytics</label>
                    <select
                        id="plan-select"
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                    >
                        {plans.map(plan => (
                            <option key={plan._id} value={plan._id}>{plan.title}</option>
                        ))}
                    </select>
                </div>

                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Module Performance</h3>
                {selectedPlanId && recentAssessments.length > 0 ? (
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                        <Bar options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: `Assessment Scores for ${plans.find(p=>p._id === selectedPlanId)?.title}` } } }} data={chartData} />
                    </div>
                ) : <p className="text-gray-500 dark:text-gray-400">No assessment data for this plan yet. Complete a quiz to see your results!</p>}

                <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-8 mb-4">Recent Assessments for this Plan</h3>
                <div className="space-y-4">
                    {selectedPlanId && recentAssessments.length > 0 ? recentAssessments.slice(0, 10).map(result => {
                        const section = plans.find(p => p._id === selectedPlanId)?.sections.find(s => s._id === result.sectionId);
                        return (
                            <div key={result._id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{section ? `Day ${section.day}: ${section.title}` : "A Topic"}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Taken on {new Date(result.submittedAt).toLocaleDateString()}</p>
                                </div>
                                <p className="font-bold text-lg text-blue-500">{result.score} / {result.totalQuestions}</p>
                            </div>
                        )
                    }) : <p className="text-gray-500 dark:text-gray-400">No recent assessments for this plan.</p>}
                </div>
            </div>
        </div>
    );
};
