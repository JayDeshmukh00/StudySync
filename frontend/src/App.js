import React, { useState, useEffect, useCallback } from 'react';

// Import all component files
import {LandingPage} from './components/LandingPage';
import { LoginPage, SignUpPage } from './components/Auth';
import { FeaturesPage } from './components/Features';
import { Dashboard } from './components/Dashboard'; // Corrected import name
import { PlanView } from './components/PlanView';
import { UploadView } from './components/UploadView';
import { AssessmentView, ResultView } from './components/Assessment';
import { AnalyticsView } from './components/AnalyticsView';
import { CalendarView } from './components/CalendarView';
import { StudySessionsPage, MindMapPage } from './components/NewFeatures';
import {FlashcardsPage} from './components/FlashCardsPage';

import { Header, Footer, Chatbot } from './components/Layout';

function App() {
  const [theme, setTheme] = useState('dark');
  const [view, setView] = useState('landing');
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [initialSectionId, setInitialSectionId] = useState(null);
  const [assessmentData, setAssessmentData] = useState({ questions: [], sectionId: null });
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = useCallback(() => {
    setLoggedIn(true);
    setView('features');
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
    const token = localStorage.getItem('token');
    if (token) {
      handleLogin();
    } else {
        setIsLoading(false);
    }
  }, [theme, handleLogin]);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:3001/api/plans', {
        headers: { 'x-auth-token': token }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPlans(data);
    } catch (error) { console.error("Failed to fetch plans:", error); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    if (loggedIn) {
      fetchPlans();
    }
  }, [loggedIn, fetchPlans]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLoggedIn(false);
    setPlans([]);
    setView('landing');
  };

  const handleViewPlan = (plan, sectionId = null) => {
    setCurrentPlan(plan);
    setInitialSectionId(sectionId);
    setView('plan');
  };

  const handleStartAssessment = async (section) => {
    setIsLoading(true);
    try {
        const response = await fetch('http://localhost:3001/api/generate-assessment', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') },
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
  const handleBackToPlan = () => { setView('plan'); fetchPlans(); };
  const handleBackToDashboard = () => { setView('dashboard'); setCurrentPlan(null); setInitialSectionId(null); fetchPlans(); };
  const handlePlanGenerated = (newPlan) => { setPlans([newPlan, ...plans]); handleViewPlan(newPlan); };
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const renderView = () => {
    if (isLoading && view !== 'landing') return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-400"></div></div>;

    switch (view) {
      case 'landing': return <LandingPage onLoginClick={() => setView('login')} onSignUpClick={() => setView('signup')} />;
      case 'login': return <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
      case 'signup': return <SignUpPage onSignUpSuccess={handleLogin} onSwitchToLogin={() => setView('login')} />;
      
      case 'features': return loggedIn ? <FeaturesPage onFeatureSelect={(feature) => setView(feature)} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
      
      // Corrected component name to Dashboard
      case 'dashboard': return loggedIn ? <Dashboard plans={plans} onSelectPlan={handleViewPlan} onCreateNew={() => setView('upload')} onAnalytics={() => setView('analytics')} onFlashcards={() => setView('flashcards')} onDeletePlan={fetchPlans} onBack={() => setView('features')} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
      
      case 'upload': return loggedIn ? <UploadView onPlanGenerated={handlePlanGenerated} onBack={() => setView('dashboard')} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
      case 'plan': return loggedIn ? <PlanView plan={currentPlan} setPlan={setCurrentPlan} onBack={handleBackToDashboard} onStartAssessment={handleStartAssessment} initialSectionId={initialSectionId} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
      case 'assessment': return loggedIn ? <AssessmentView questions={assessmentData.questions} planId={currentPlan._id} sectionId={assessmentData.sectionId} onSubmit={handleSubmitAssessment} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
      case 'result': return loggedIn ? <ResultView result={assessmentResult} onBack={handleBackToPlan} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
      case 'analytics': return loggedIn ? <AnalyticsView onBack={() => setView('dashboard')} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
      case 'calendar': return loggedIn ? <CalendarView plans={plans} onBack={() => setView('features')} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
      case 'flashcards': return loggedIn ? <FlashcardsPage onBack={() => setView('features')} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
      case 'studysessions': return loggedIn ? <StudySessionsPage onBack={() => setView('features')} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
      case 'mindmap': return loggedIn ? <MindMapPage onBack={() => setView('features')} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
      default: return <div>Loading...</div>;
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-black text-gray-800 dark:text-gray-300 min-h-screen font-sans transition-colors duration-300">
      {!loggedIn && view === 'landing' ? null : <Header onToggleTheme={toggleTheme} currentTheme={theme} onHomeClick={() => setView('features')} onLogout={handleLogout} loggedIn={loggedIn}/>}
      <main className={loggedIn ? "container mx-auto p-4 md:p-8" : ""}>
        {renderView()}
      </main>
      {loggedIn && <Footer />}
      {loggedIn && <Chatbot />}
    </div>
  );
}

export default App;