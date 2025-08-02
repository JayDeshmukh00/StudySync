import { Buffer } from 'buffer';
import process from 'process';
import React, { useState, useEffect, useCallback } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage, SignUpPage } from './components/Auth';
import { FeaturesPage } from './components/Features';
import { Dashboard } from './components/Dashboard';
import { PlanView } from './components/PlanView';
import { UploadView } from './components/UploadView';
import { AssessmentView, ResultView } from './components/Assessment';
import { AnalyticsView } from './components/AnalyticsView';
import { CalendarView } from './components/CalendarView';
import { FlashcardsPage } from './components/FlashCardsPage';
import { MindMapPage } from './components/NewFeatures';
import { Header, Footer, Chatbot } from './components/Layout';
import { StudyLobby } from './components/collab/StudyLobby';
import { StudyRoom } from './components/collab/StudyRoom';

// These lines provide the necessary polyfills for browser environments
window.Buffer = Buffer;
window.process = process;

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
    
    const [collabInfo, setCollabInfo] = useState({ roomId: null, userName: '' });

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
    
    const handleJoinRoom = (roomId, userName) => {
        setCollabInfo({ roomId, userName });
        setView('studysession-room');
    };

    const handleLeaveRoom = () => {
        setCollabInfo({ roomId: null, userName: '' });
        setView('studysessions');
    };

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

        if (view === 'studysession-room') {
            return <StudyRoom roomId={collabInfo.roomId} userName={collabInfo.userName} onLeaveRoom={handleLeaveRoom} />
        }

        switch (view) {
            case 'landing': return <LandingPage onLoginClick={() => setView('login')} onSignUpClick={() => setView('signup')} />;
            case 'login': return <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
            case 'signup': return <SignUpPage onSignUpSuccess={handleLogin} onSwitchToLogin={() => setView('login')} />;
            case 'features': return loggedIn ? <FeaturesPage onFeatureSelect={(feature) => setView(feature)} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
            case 'dashboard': return loggedIn ? <Dashboard plans={plans} onSelectPlan={handleViewPlan} onCreateNew={() => setView('upload')} onAnalytics={() => setView('analytics')} onFlashcards={() => setView('flashcards')} onDeletePlan={fetchPlans} onBack={() => setView('features')} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
            case 'upload': return loggedIn ? <UploadView onPlanGenerated={handlePlanGenerated} onBack={() => setView('dashboard')} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
            case 'plan': return loggedIn ? <PlanView plan={currentPlan} setPlan={setCurrentPlan} onBack={handleBackToDashboard} onStartAssessment={handleStartAssessment} initialSectionId={initialSectionId} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
            case 'assessment': return loggedIn ? <AssessmentView questions={assessmentData.questions} planId={currentPlan._id} sectionId={assessmentData.sectionId} onSubmit={handleSubmitAssessment} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
            case 'result': return loggedIn ? <ResultView result={assessmentResult} onBack={handleBackToPlan} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
            case 'analytics': return loggedIn ? <AnalyticsView onBack={() => setView('dashboard')} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
            case 'calendar': return loggedIn ? <CalendarView plans={plans} onBack={() => setView('features')} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
            case 'flashcards': return loggedIn ? <FlashcardsPage onBack={() => setView('features')} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
            case 'studysessions': return loggedIn ? <StudyLobby onJoinRoom={handleJoinRoom} onBack={() => setView('features')} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
            case 'mindmap': return loggedIn ? <MindMapPage onBack={() => setView('features')} /> : <LoginPage onLoginSuccess={handleLogin} onSwitchToSignUp={() => setView('signup')} />;
            default: return <div>Loading...</div>;
        }
    };

    const showLayout = loggedIn && view !== 'landing' && view !== 'studysession-room';
    
    return (
        <div className="bg-black text-gray-300 min-h-screen font-sans">
            {showLayout && <Header onToggleTheme={toggleTheme} currentTheme={theme} onHomeClick={() => setView('features')} onLogout={handleLogout} loggedIn={loggedIn}/>}
            <main className={showLayout ? "container mx-auto p-4 md:p-8" : ""}>
                {renderView()}
            </main>
            {showLayout && <Footer />}
            {showLayout && <Chatbot />}
        </div>
    );
}

export default App;
