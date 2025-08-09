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
// --- UPDATED: Your layout file path ---
import { Header, Footer, Chatbot } from './components/Layout';
import { StudyLobby } from './components/collab/StudyLobby';
import { StudyRoom } from './components/collab/StudyRoom';
import AuraReader from './components/AuraReader/AuraReader';
import { BuddyProvider, useBuddy } from './context/BuddyContext';
import BuddyControlPanel from './components/buddy/BuddyControlPanel';
import HighlightHandler from './components/buddy/HighlightHandler';

window.Buffer = Buffer;
window.process = process;

function AppContent() {
    const [theme, setTheme] = useState('dark');
    const [view, setView] = useState('landing');
    const [plans, setPlans] = useState([]);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [initialSectionId, setInitialSectionId] = useState(null);
    const [assessmentData, setAssessmentData] = useState({ questions: [], sectionId: null });
    const [assessmentResult, setAssessmentResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // --- UPDATED: Replaced 'loggedIn' boolean with a 'user' object state ---
    const [user, setUser] = useState(null); 
    
    const [collabInfo, setCollabInfo] = useState({ roomId: null, userName: '' });
    
    const buddyContext = useBuddy();

    // --- NEW: Function to fetch current user data using the token ---
    const fetchCurrentUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            // This is a standard endpoint to get the logged-in user's profile.
            // You will need to create this on your backend.
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/me`, {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData); // e.g., { name: 'Ada Lovelace', email: 'ada@example.com' }
            } else {
                // If the token is invalid, log the user out
                handleLogout();
            }
        } catch (error) {
            console.error("Failed to fetch user:", error);
            handleLogout(); // Log out on network error
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        document.documentElement.className = theme;
        fetchCurrentUser();
    }, [theme, fetchCurrentUser]);

    // --- UPDATED: This function is now called on successful login/signup ---
    const handleLoginSuccess = useCallback(() => {
        setView('features');
        fetchCurrentUser(); // Fetch user data right after login
    }, [fetchCurrentUser]);

    const fetchPlans = useCallback(async () => {
        // No need to set loading here as it's handled by other flows
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/plans`, {
                headers: { 'x-auth-token': token }
            });
            if (response.status === 401) {
                handleLogout();
                return; 
            }
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setPlans(data);
        } catch (error) { console.error("Failed to fetch plans:", error); }
    }, []);

    useEffect(() => {
        if (user) { // Fetch plans if a user is logged in
            fetchPlans();
        }
    }, [user, fetchPlans]);
    
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
        setUser(null); // --- UPDATED: Clear user state on logout
        setPlans([]);
        setView('landing');
    };

    // ... (rest of your handler functions like handleViewPlan, handleStartAssessment are fine) ...
    const handleViewPlan = (plan, sectionId = null) => {
        setCurrentPlan(plan);
        setInitialSectionId(sectionId);
        setView('plan');
    };
    const handleStartAssessment = async (section) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/generate-assessment`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') },
                body: JSON.stringify({ topic: section.topic, explanation: section.explanation }),
            });
            if (response.status === 401) {
                handleLogout();
                return;
            }
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
        // --- UPDATED: derive loggedIn status from the user object ---
        const isLoggedIn = !!user;

        if (isLoading && view !== 'landing') return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-400"></div></div>;

        if (view === 'studysession-room') {
            return <StudyRoom roomId={collabInfo.roomId} userName={collabInfo.userName} onLeaveRoom={handleLeaveRoom} />
        }

        // Updated all checks to use 'isLoggedIn' for clarity
        switch (view) {
            case 'landing': return <LandingPage onLoginClick={() => setView('login')} onSignUpClick={() => setView('signup')} />;
            case 'login': return <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignUp={() => setView('signup')} />;
            case 'signup': return <SignUpPage onSignUpSuccess={handleLoginSuccess} onSwitchToLogin={() => setView('login')} />;
            case 'features': return isLoggedIn ? <FeaturesPage onFeatureSelect={(feature) => setView(feature)} /> : <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignUp={() => setView('signup')} />;
            case 'dashboard': return isLoggedIn ? <Dashboard plans={plans} onSelectPlan={handleViewPlan} onCreateNew={() => setView('upload')} onAnalytics={() => setView('analytics')} onFlashcards={() => setView('flashcards')} onDeletePlan={fetchPlans} onBack={() => setView('features')} /> : <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignUp={() => setView('signup')} />;
            case 'upload': return isLoggedIn ? <UploadView onPlanGenerated={handlePlanGenerated} onBack={() => setView('dashboard')} /> : <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignUp={() => setView('signup')} />;
            
            case 'plan': 
                return isLoggedIn ? (
                    <HighlightHandler onHighlight={buddyContext.onHighlight}>
                        <PlanView plan={currentPlan} setPlan={setCurrentPlan} onBack={handleBackToDashboard} onStartAssessment={handleStartAssessment} initialSectionId={initialSectionId} />
                    </HighlightHandler>
                ) : <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignUp={() => setView('signup')} />;

            case 'assessment': return isLoggedIn ? <AssessmentView questions={assessmentData.questions} planId={currentPlan._id} sectionId={assessmentData.sectionId} onSubmit={handleSubmitAssessment} /> : <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignUp={() => setView('signup')} />;
            case 'result': return isLoggedIn ? <ResultView result={assessmentResult} onBack={handleBackToPlan} /> : <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignUp={() => setView('signup')} />;
            case 'analytics': return isLoggedIn ? <AnalyticsView onBack={() => setView('dashboard')} /> : <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignUp={() => setView('signup')} />;
            case 'calendar': return isLoggedIn ? <CalendarView plans={plans} onBack={() => setView('features')} /> : <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignUp={() => setView('signup')} />;
            case 'flashcards': return isLoggedIn ? <FlashcardsPage onBack={() => setView('features')} /> : <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignUp={() => setView('signup')} />;
            case 'studysessions': return isLoggedIn ? <StudyLobby onJoinRoom={handleJoinRoom} onBack={() => setView('features')} /> : <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignUp={() => setView('signup')} />;
            case 'mindmap': return isLoggedIn ? <MindMapPage onBack={() => setView('features')} /> : <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignUp={() => setView('signup')} />;
            
            case 'auraReader': return isLoggedIn ? <AuraReader onBack={() => setView('features')} /> : <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignUp={() => setView('signup')} />;

            default: return <div>Loading...</div>;
        }
    };
    
    // --- UPDATED: Show layout if a user object exists ---
    const showLayout = !!user && view !== 'landing' && view !== 'studysession-room';
    
    return (
        <div className="bg-black text-gray-300 min-h-screen font-sans">
            {/* --- UPDATED: Pass the entire 'user' object to the Header --- */}
            {showLayout && <Header onToggleTheme={toggleTheme} currentTheme={theme} onHomeClick={() => setView('features')} onLogout={handleLogout} user={user}/>}
            
            <main className={showLayout ? "container mx-auto p-4 md:p-8" : ""}>
                {renderView()}
            </main>
            
            {showLayout && <Footer />}
            {showLayout && <Chatbot />}
            
            {(view === 'plan' || view === 'auraReader') && (
                <BuddyControlPanel
                    explanation={buddyContext.explanation}
                    isSpeaking={buddyContext.isSpeaking}
                    spokenText={buddyContext.spokenText}
                    selectedLanguage={buddyContext.selectedLanguage}
                    onSelectLanguage={buddyContext.onSelectLanguage}
                    onReplayAudio={buddyContext.onReplayAudio}
                    isListening={buddyContext.isListening}
                    onToggleListen={buddyContext.onToggleListen}
                />
            )}
        </div>
    );
}

function App() {
    return (
        <BuddyProvider>
            <AppContent />
        </BuddyProvider>
    );
}

export default App;