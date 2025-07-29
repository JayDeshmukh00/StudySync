import React, { useState, useEffect, useMemo, useRef } from 'react';

// --- Helper Components & Icons ---
const Icon = ({ path, className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);
const Spinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;

// --- Main App Component ---
export default function App() {
  const [theme, setTheme] = useState('dark');
  const [view, setView] = useState('dashboard');
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [assessmentData, setAssessmentData] = useState({ questions: [], sectionId: null });
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Theme handler
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/plans');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPlans(data);
    } catch (error) { console.error("Failed to fetch plans:", error); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleViewPlan = (plan) => { setCurrentPlan(plan); setView('plan'); };
  
  const handleStartAssessment = async (section) => {
    setIsLoading(true);
    try {
        const response = await fetch('http://localhost:3001/api/generate-assessment', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: section.topic, explanation: section.explanation }),
        });
        if (!response.ok) throw new Error('Failed to generate quiz');
        const data = await response.json();
        setAssessmentData({ questions: data.assessment, sectionId: section._id });
        setAssessmentResult(null);
        setView('assessment');
    } catch (error) { alert("Could not generate the quiz. Please try again."); } 
    finally { setIsLoading(false); }
  };

  const handleSubmitAssessment = (result) => { setAssessmentResult(result); setView('result'); };
  const handleBackToPlan = () => setView('plan');
  const handleBackToDashboard = () => { setView('dashboard'); setCurrentPlan(null); fetchPlans(); };
  const handlePlanGenerated = (newPlan) => { setPlans([newPlan, ...plans]); handleViewPlan(newPlan); };
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const renderView = () => {
    if (isLoading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-400"></div></div>;
    
    switch (view) {
      case 'dashboard': return <DashboardView plans={plans} onSelectPlan={handleViewPlan} onCreateNew={() => setView('upload')} onAnalytics={() => setView('analytics')} onDeletePlan={fetchPlans} />;
      case 'upload': return <UploadView onPlanGenerated={handlePlanGenerated} onBack={() => setView('dashboard')} />;
      case 'plan': return <PlanView plan={currentPlan} setPlan={setCurrentPlan} onBack={handleBackToDashboard} onStartAssessment={handleStartAssessment} />;
      case 'assessment': return <AssessmentView questions={assessmentData.questions} planId={currentPlan._id} sectionId={assessmentData.sectionId} onSubmit={handleSubmitAssessment} />;
      case 'result': return <ResultView result={assessmentResult} onBack={handleBackToPlan} />;
      case 'analytics': return <AnalyticsView onBack={() => setView('dashboard')} />;
      default: return <div>Error: View not found</div>;
    }
  };

  return (
    <div className="bg-white dark:bg-[#0D1117] text-gray-800 dark:text-gray-300 min-h-screen font-sans transition-colors duration-300">
      <Header onToggleTheme={toggleTheme} currentTheme={theme} onHomeClick={handleBackToDashboard} />
      <main className="container mx-auto p-4 md:p-8">
        {renderView()}
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}

// --- Fully Implemented Component Views ---

const Header = ({ onToggleTheme, currentTheme, onHomeClick }) => (
  <header className="bg-white dark:bg-[#161B22] shadow-lg dark:shadow-blue-900/20 sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={onHomeClick}>
        <Icon path="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" className="w-8 h-8 text-blue-600 dark:text-blue-500" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">AI Study Planner</h1>
      </div>
      <button onClick={onToggleTheme} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
        {currentTheme === 'dark' ? <Icon path="M12 3v2.25m6.364.364l-1.591 1.591M21 12h-2.25m-.364 6.364l-1.591-1.591M12 18.75V21m-4.95-4.243l-1.59-1.59M3.75 12H6m4.243-4.95l1.59-1.59" /> : <Icon path="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />}
      </button>
    </div>
  </header>
);

const Footer = () => (
  <footer className="bg-white dark:bg-[#161B22] mt-8 border-t border-gray-200 dark:border-gray-800">
    <div className="container mx-auto px-4 py-4 text-center text-gray-500 dark:text-gray-500">
      <p>&copy; 2024 AI Study Planner. All Rights Reserved.</p>
    </div>
  </footer>
);

const UploadView = ({ onPlanGenerated, onBack }) => {
  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !startDate || !endDate) { alert('Please fill in all fields.'); return; }
    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    try {
      const response = await fetch('http://localhost:3001/api/generate-plan', { method: 'POST', body: formData });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.msg || `HTTP error! status: ${response.status}`); }
      const plan = await response.json();
      onPlanGenerated(plan);
    } catch (err) { setError(err.message); } finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
        <button onClick={onBack} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center mb-6">
            <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> 
            Back
        </button>
        <div className="bg-white dark:bg-[#161B22] p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800 dark:text-white">Create a New Study Plan</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-600 dark:text-gray-400 text-sm font-bold mb-2" htmlFor="pdf-upload">Upload Book (PDF)</label>
              <input id="pdf-upload" type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="w-full px-3 py-2 text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-800 file:text-white hover:file:bg-blue-700"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 text-sm font-bold mb-2" htmlFor="start-date">Start Date</label>
                <input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="block text-gray-600 dark:text-gray-400 text-sm font-bold mb-2" htmlFor="end-date">End Date</label>
                <input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"/>
              </div>
            </div>
            {error && <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4" role="alert"><strong className="font-bold">Error: </strong><span className="block sm:inline">{error}</span></div>}
            <button type="submit" disabled={isLoading} className="w-full bg-blue-800 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none disabled:bg-blue-900 disabled:cursor-not-allowed transition duration-300 flex items-center justify-center">
              {isLoading ? <><Spinner /> <span className="ml-3">Generating Plan...</span></> : 'Generate Study Plan'}
            </button>
          </form>
        </div>
    </div>
  );
};

const DashboardView = ({ plans, onSelectPlan, onCreateNew, onAnalytics, onDeletePlan }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [planToDelete, setPlanToDelete] = useState(null);

    const handleDeleteClick = (e, plan) => {
        e.stopPropagation(); // Prevent card click event
        setPlanToDelete(plan);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!planToDelete) return;
        await fetch(`http://localhost:3001/api/plan/${planToDelete._id}`, { method: 'DELETE' });
        setShowDeleteModal(false);
        setPlanToDelete(null);
        onDeletePlan(); // Refresh the plans list
    };
    
    const calculateStreak = () => 5; // Placeholder
    const lowScoreTopics = useMemo(() => [{ id: 1, title: "Review: The Cell Nucleus" }, { id: 2, title: "Review: Photosynthesis" }], [plans]);

    return (
        <div className="animate-fade-in">
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold">Confirm Deletion</h3>
                        <p className="my-4 text-gray-600 dark:text-gray-400">Are you sure you want to delete the plan "{planToDelete?.title}"? This action cannot be undone.</p>
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
                    <button onClick={onAnalytics} className="bg-purple-800 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center"><Icon path="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" className="w-5 h-5 mr-2"/>Analytics</button>
                    <button onClick={onCreateNew} className="bg-blue-800 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center"><Icon path="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" className="w-5 h-5 mr-2"/>New Plan</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Study Streak</h3>
                    <div className="flex items-center space-x-3 text-yellow-500 dark:text-yellow-400">
                        <Icon path="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.048 8.287 8.287 0 0 0 9 9.62a8.983 8.983 0 0 1 3.362-3.797A8.333 8.333 0 0 1 15.362 5.214Z" className="w-10 h-10"/>
                        <span className="text-4xl font-bold">{calculateStreak()}</span>
                        <span className="text-xl font-semibold">Days!</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Smart Review</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Topics you might want to revisit based on assessment scores.</p>
                    <div className="space-y-2">
                        {lowScoreTopics.map(topic => (
                            <button key={topic.id} className="w-full text-left p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">{topic.title}</button>
                        ))}
                    </div>
                </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">My Study Plans</h3>
            {plans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <div key={plan._id} onClick={() => onSelectPlan(plan)} className="bg-white dark:bg-[#161B22] p-6 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer transition-all duration-300 hover:border-blue-800 hover:shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-1 group relative">
                            <button onClick={(e) => handleDeleteClick(e, plan)} className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-red-200 dark:hover:bg-red-900/50 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134H8.716c-1.123 0-2.033.954-2.033 2.134v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" className="w-5 h-5"/>
                            </button>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white truncate pr-8">{plan.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Created: {new Date(plan.createdAt).toLocaleDateString()}</p>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-4 h-2.5">
                                <div className="bg-blue-700 h-2.5 rounded-full" style={{ width: `${(plan.sections.filter(s => s.status === 'completed').length / plan.sections.length) * 100}%` }}></div>
                            </div>
                            <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">{plan.sections.filter(s => s.status === 'completed').length} / {plan.sections.length} days complete</p>
                        </div>
                    ))}
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

const PlanView = ({ plan, setPlan, onBack, onStartAssessment }) => {
    const [selectedSection, setSelectedSection] = useState(plan.sections[0]);
    
    const handleUpdateSection = async (updatedSectionData) => {
        try {
            const response = await fetch(`http://localhost:3001/api/plan/${plan._id}/section/${selectedSection._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedSectionData),
            });
            const updatedPlanData = await response.json();
            setPlan(updatedPlanData);
            const refreshedSection = updatedPlanData.sections.find(s => s._id === selectedSection._id);
            setSelectedSection(refreshedSection);
        } catch (error) {
            console.error("Failed to update section:", error);
        }
    };

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center mb-6">
                <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> 
                Back to All Plans
            </button>
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-1/3 lg:w-1/4 md:sticky md:top-24 self-start">
                    <div className="bg-white dark:bg-[#161B22] p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white truncate">{plan.title}</h3>
                        <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {plan.sections.map(section => (
                                <li key={section._id} onClick={() => setSelectedSection(section)} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedSection._id === section._id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
                                    <div className="flex items-center space-x-3">
                                        {section.status === 'completed' ? <Icon path="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" className="w-5 h-5 text-green-500 flex-shrink-0" /> : <div className={`w-5 h-5 rounded-full border-2 ${selectedSection._id === section._id ? 'border-blue-500' : 'border-gray-400 dark:border-gray-600'} flex-shrink-0`}></div>}
                                        <span className={`font-semibold ${selectedSection._id === section._id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{`Day ${section.day}: ${section.title}`}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>
                <section className="w-full md:w-2/3 lg:w-3/4">
                    <DayDetailView section={selectedSection} onUpdate={handleUpdateSection} onStartAssessment={onStartAssessment} planId={plan._id} />
                </section>
            </div>
        </div>
    );
};

const DayDetailView = ({ section, onUpdate, onStartAssessment, planId }) => {
    const [notes, setNotes] = useState(section.notes || '');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    useEffect(() => { setNotes(section.notes || ''); }, [section]);

    const handleSaveNotes = () => { setIsSavingNotes(true); onUpdate({ notes }).finally(() => setIsSavingNotes(false)); };
    const handleDeleteNotes = () => { setNotes(''); onUpdate({ notes: '' }); };
    
    const DetailCard = ({ title, iconPath, children }) => (
        <div className="bg-white dark:bg-[#161B22]/50 p-6 rounded-lg border border-gray-200 dark:border-gray-800"><h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center"><Icon path={iconPath} className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-500" /> {title}</h3>{children}</div>
    );
    
    return (
        <div className="bg-white dark:bg-[#161B22] p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{`Day ${section.day}: ${section.title}`}</h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">{section.topic}</p>
                </div>
                <div className="flex items-center space-x-4">
                    <a href={`http://localhost:3001/api/plan/${planId}/section/${section._id}/download`} download className="bg-blue-800 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center"><Icon path="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" className="w-5 h-5 mr-2"/>Download</a>
                     {section.status !== 'completed' && <button onClick={() => onUpdate({status: 'completed'})} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center"><Icon path="M4.5 12.75l6 6 9-13.5" className="w-5 h-5 mr-2" />Mark Complete</button>}
                </div>
            </div>

            <div className="space-y-6">
                <DetailCard title="Detailed Explanation" iconPath="M3.375 5.25h17.25c.621 0 1.125.504 1.125 1.125v13.5c0 .621-.504 1.125-1.125 1.125H3.375c-.621 0-1.125-.504-1.125-1.125v-13.5c0-.621.504-1.125 1.125-1.125Z"><p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{section.explanation}</p></DetailCard>
                <DetailCard title="Key Points" iconPath="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"><ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">{section.keyPoints.map((point, i) => <li key={i}>{point}</li>)}</ul></DetailCard>
                <DetailCard title="My Notes" iconPath="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10">
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200" placeholder="Jot down your thoughts..."/>
                    <div className="flex space-x-3 mt-3">
                        <button onClick={handleSaveNotes} disabled={isSavingNotes} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center disabled:bg-green-800">{isSavingNotes ? <><Spinner/> <span className="ml-2">Saving...</span></> : "Save Notes"}</button>
                        <button onClick={handleDeleteNotes} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Delete Notes</button>
                    </div>
                </DetailCard>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailCard title="Video Resources" iconPath="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M10.5 8.25L15.75 12l-5.25 3.75v-7.5Z"><ul className="space-y-2">{section.youtubeLinks.map((link, i) => <li key={i}><a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline">Watch Video {i + 1}</a></li>)}</ul></DetailCard>
                    <DetailCard title="Further Reading" iconPath="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z"><ul className="space-y-2">{section.referralLinks.map((link, i) => <li key={i}><a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline">Read Article {i + 1}</a></li>)}</ul></DetailCard>
                </div>
                <DetailCard title="Practice Questions" iconPath="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"><ul className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-2">{section.questions.map((q, i) => <li key={i}>{q}</li>)}</ul></DetailCard>
                <DetailCard title="Previous Year Questions" iconPath="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"><ul className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-2">{section.pyqs.map((q, i) => <li key={i}>{q}</li>)}</ul></DetailCard>
            </div>
            <div className="text-center pt-8"><button onClick={() => onStartAssessment(section)} className="bg-purple-800 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 text-lg">Start Daily Assessment</button></div>
        </div>
    );
};

const AssessmentView = ({ questions, planId, sectionId, onSubmit }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState(Array(questions.length).fill(null));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAnswerSelect = (option) => { const newAnswers = [...answers]; newAnswers[currentQuestionIndex] = option; setAnswers(newAnswers); };
    const handleNext = () => { if (currentQuestionIndex < questions.length - 1) { setCurrentQuestionIndex(currentQuestionIndex + 1); } };
    const handleSubmitQuiz = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:3001/api/submit-assessment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId, sectionId, answers, questions }), });
            if (!response.ok) throw new Error('Failed to submit assessment');
            const result = await response.json();
            onSubmit(result);
        } catch (error) { alert("Could not submit the quiz."); } finally { setIsSubmitting(false); }
    };

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="bg-white dark:bg-[#161B22] p-8 rounded-lg shadow-lg max-w-2xl mx-auto border border-gray-200 dark:border-gray-800 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Daily Assessment</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Question {currentQuestionIndex + 1} of {questions.length}</p>
            <div className="mb-6"><p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{currentQuestion.question}</p></div>
            <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option, index) => (
                    <button key={index} onClick={() => handleAnswerSelect(option)} className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${answers[currentQuestionIndex] === option ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500' : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        {option}
                    </button>
                ))}
            </div>
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">{answers.filter(a => a !== null).length} / {questions.length} answered</p>
                {currentQuestionIndex < questions.length - 1 ? (
                    <button onClick={handleNext} className="bg-blue-800 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">Next</button>
                ) : (
                    <button onClick={handleSubmitQuiz} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center disabled:bg-green-800">
                        {isSubmitting ? <><Spinner /><span className="ml-3">Submitting...</span></> : 'Submit'}
                    </button>
                )}
            </div>
        </div>
    );
};

const ResultView = ({ result, onBack }) => {
    const { score, totalQuestions } = result;
    const percentage = Math.round((score / totalQuestions) * 100);
    const message = percentage >= 80 ? "Excellent work!" : percentage >= 60 ? "Good job!" : "Keep practicing!";

    return (
        <div className="bg-white dark:bg-[#161B22] p-8 rounded-lg shadow-lg max-w-md mx-auto text-center border border-gray-200 dark:border-gray-800 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Assessment Complete!</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-6">{message}</p>
            <div className="mb-6">
                <p className="text-5xl font-bold text-blue-500 dark:text-blue-400">{score}<span className="text-3xl text-gray-400 dark:text-gray-500">/{totalQuestions}</span></p>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-2">({percentage}%)</p>
            </div>
            <button onClick={onBack} className="bg-blue-800 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300">Back to Study Plan</button>
        </div>
    );
};

const AnalyticsView = ({ onBack }) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/analytics');
                const data = await response.json();
                setResults(data);
            } catch (error) { console.error("Failed to fetch analytics", error); } 
            finally { setLoading(false); }
        };
        fetchAnalytics();
    }, []);

    const overallAverage = useMemo(() => {
        if (results.length === 0) return 0;
        const totalScore = results.reduce((acc, r) => acc + r.score, 0);
        const totalQuestions = results.reduce((acc, r) => acc + r.totalQuestions, 0);
        return totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    }, [results]);

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div></div>;

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center mb-6">
                <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> 
                Back to Dashboard
            </button>
            <div className="bg-white dark:bg-[#161B22] p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">My Analytics</h2>
                <div className="text-center mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">Overall Average Score</p>
                    <p className="text-6xl font-bold text-blue-600 dark:text-blue-400 mt-2">{overallAverage}%</p>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Recent Assessments</h3>
                <div className="space-y-4">
                    {results.length > 0 ? results.slice(0, 10).map(result => (
                        <div key={result._id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{result.planId?.title || "A Plan"}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Taken on {new Date(result.takenAt).toLocaleDateString()}</p>
                            </div>
                            <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{result.score} / {result.totalQuestions}</p>
                        </div>
                    )) : <p className="text-gray-500 dark:text-gray-400">No assessment data yet. Complete a quiz to see your results!</p>}
                </div>
            </div>
        </div>
    );
};

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: 'assistant', content: "Hello! How can I help you study today?" }]);
    const [input, setInput] = useState('');
    const [isResponding, setIsResponding] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsResponding(true);

        try {
            const response = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history: newMessages }),
            });

            if (!response.body) return;
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = { role: 'assistant', content: '' };
            setMessages(prev => [...prev, assistantMessage]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const json = JSON.parse(line.substring(6));
                            if (json.content) {
                                assistantMessage.content += json.content;
                                setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);
                            }
                        } catch (e) {
                            // Ignore parsing errors for incomplete JSON chunks
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Chatbot error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again later." }]);
        } finally {
            setIsResponding(false);
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            {isOpen && (
                <div className="w-80 h-96 bg-white dark:bg-[#161B22] rounded-lg shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 mb-4">
                    <header className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold text-lg text-gray-800 dark:text-white">Study Assistant</header>
                    <div className="flex-1 p-4 overflow-y-auto">
                        {messages.map((msg, index) => (
                            <div key={index} className={`mb-3 p-2 rounded-lg max-w-[85%] ${msg.role === 'user' ? 'bg-blue-700 text-white ml-auto' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                {msg.content}
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask a question..."
                            className="flex-1 p-2 rounded-l-md bg-gray-100 dark:bg-gray-700 focus:outline-none text-gray-800 dark:text-gray-200"
                            disabled={isResponding}
                        />
                        <button onClick={handleSend} disabled={isResponding} className="bg-blue-800 text-white px-4 rounded-r-md disabled:bg-blue-900">
                            <Icon path="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="bg-blue-800 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg">
                <Icon path={isOpen ? "M6 18 18 6M6 6l12 12" : "M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.04 8.357-7.146 9.354a9.345 9.345 0 0 1-2.704 0C6.04 20.357 3 16.556 3 12s3.04-8.357 7.146-9.354a9.345 9.345 0 0 1 2.704 0C17.96 3.643 21 7.444 21 12Z"} className="w-8 h-8"/>
            </button>
        </div>
    );
};
