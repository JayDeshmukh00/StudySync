import React, { useState, useEffect, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'; // --- ADD THIS ---
import { Icon } from './Icon';

// --- ADD THIS REGISTRATION ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const AnalyticsView = ({ onBack }) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/analytics', {
                    headers: { 'x-auth-token': localStorage.getItem('token') }
                });
                const data = await response.json();
                setResults(data);
            } catch (error) { console.error("Failed to fetch analytics", error); } 
            finally { setLoading(false); }
        };
        fetchAnalytics();
    }, []);

   const chartData = useMemo(() => {
    const scoresByPlan = results.reduce((acc, result) => {
        const planTitle = result.planId?.title || "Deleted Plan";
        if (!acc[planTitle]) {
            acc[planTitle] = { totalScore: 0, totalQuestions: 0, count: 0 };
        }
        acc[planTitle].totalScore += result.score;
        acc[planTitle].totalQuestions += result.totalQuestions;
        acc[planTitle].count++;
        return acc;
    }, {});

    const labels = Object.keys(scoresByPlan);
    const data = labels.map(label => {
        // --- FIX WAS HERE ---
        const plan = scoresByPlan[label]; 
        return plan.totalQuestions > 0 ? (plan.totalScore / plan.totalQuestions) * 100 : 0;
    });

    return {
        labels,
        datasets: [{
            label: 'Average Score (%)',
            data,
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
        }],
    };
}, [results]);

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div></div>;

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center mb-6">
                <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> Back to Dashboard
            </button>
            <div className="bg-white/10 dark:bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-2xl shadow-blue-900/20 border border-blue-800/30">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">My Analytics</h2>
                
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Performance by Study Plan</h3>
                {results.length > 0 ? (
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                        {/* No changes needed here, the wrapper component handles it */}
                        <Bar options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Average Assessment Scores per Plan' } } }} data={chartData} />
                    </div>
                ) : <p className="text-gray-500 dark:text-gray-400">No assessment data to show.</p>}

                <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-8 mb-4">Recent Assessments</h3>
                <div className="space-y-4">
                    {results.length > 0 ? results.slice(0, 10).map(result => (
                        <div key={result._id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{result.planId?.title || "A Plan"}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Taken on {new Date(result.takenAt).toLocaleDateString()}</p>
                            </div>
                            <p className="font-bold text-lg text-blue-500">{result.score} / {result.totalQuestions}</p>
                        </div>
                    )) : <p className="text-gray-500 dark:text-gray-400">Complete a quiz to see your results here!</p>}
                </div>
            </div>
        </div>
    );
};