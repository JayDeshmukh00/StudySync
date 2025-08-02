import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from './Icon';

const DayDetailView = ({ section, onUpdate, onStartAssessment, planId }) => {
    const [notes, setNotes] = useState(section.notes || '');

    useEffect(() => {
        if (notes !== (section.notes || '')) {
            const handler = setTimeout(() => {
                onUpdate({ notes });
            }, 1500);
            return () => clearTimeout(handler);
        }
    }, [notes, section.notes, onUpdate]);

    useEffect(() => {
        setNotes(section.notes || '');
    }, [section._id, section.notes]); 
    
    const DetailCard = ({ title, iconPath, children }) => (
        <div className="bg-white/5 dark:bg-black/30 backdrop-blur-sm p-6 rounded-lg border border-blue-800/20"><h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center"><Icon path={iconPath} className="w-6 h-6 mr-3 text-blue-500" /> {title}</h3>{children}</div>
    );
    
    return (
        <div className="bg-white/10 dark:bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-2xl shadow-blue-900/20 border border-blue-800/30 animate-fade-in">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{`Day ${section.day}: ${section.title}`}</h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">{section.topic}</p>
                </div>
                <div className="flex items-center space-x-4">
                    <a href={`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/plan/${planId}/section/${section._id}/download`} download className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center"><Icon path="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" className="w-5 h-5 mr-2"/>Download</a>
                        {section.status !== 'completed' && <button onClick={() => onUpdate({status: 'completed'})} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center"><Icon path="M4.5 12.75l6 6 9-13.5" className="w-5 h-5 mr-2" />Mark Complete</button>}
                </div>
            </div>

            <div className="space-y-6">
                <DetailCard title="Detailed Explanation" iconPath="M3.375 5.25h17.25c.621 0 1.125.504 1.125 1.125v13.5c0 .621-.504 1.125-1.125 1.125H3.375c-.621 0-1.125-.504-1.125-1.125v-13.5c0-.621.504-1.125 1.125-1.125Z"><p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{section.explanation || "No explanation provided."}</p></DetailCard>
                <DetailCard title="Key Points" iconPath="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"><ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">{(section.keyPoints || []).map((point, i) => <li key={i}>{point}</li>)}</ul></DetailCard>
                <DetailCard title="My Notes (autosaves)" iconPath="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10">
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200" placeholder="Jot down your thoughts... they'll be saved automatically."/>
                </DetailCard>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailCard title="Video Resources" iconPath="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M10.5 8.25L15.75 12l-5.25 3.75v-7.5Z">
                        <ul className="space-y-2">{(section.youtubeSearchQueries || []).map((query, i) => <li key={i}><a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline">Search: "{query}"</a></li>)}</ul>
                    </DetailCard>
                    <DetailCard title="Further Reading" iconPath="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z">
                         <ul className="space-y-2">{(section.referralSearchQueries || []).map((query, i) => <li key={i}><a href={`https://www.google.com/search?q=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline">Search: "{query}"</a></li>)}</ul>
                    </DetailCard>
                </div>
                <DetailCard title="Practice Questions" iconPath="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"><ul className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-2">{(section.questions || []).map((q, i) => <li key={i}>{q}</li>)}</ul></DetailCard>
                <DetailCard title="Previous Year Questions" iconPath="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"><ul className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-2">{(section.pyqs || []).map((q, i) => <li key={i}>{q}</li>)}</ul></DetailCard>
            </div>
            <div className="text-center pt-8"><button onClick={() => onStartAssessment(section)} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-lg transition duration-300 text-lg">Start Daily Assessment</button></div>
        </div>
    );
};

export const PlanView = ({ plan, setPlan, onBack, onStartAssessment, initialSectionId }) => {
    const sections = plan?.sections || [];

    const [selectedSection, setSelectedSection] = useState(() => {
        if (initialSectionId) {
            return sections.find(s => s._id === initialSectionId) || sections[0];
        }
        return sections[0];
    });

    const handleUpdateSection = useCallback(async (updatedSectionData) => {
        const token = localStorage.getItem('token');
        
        const originalPlan = JSON.parse(JSON.stringify(plan));
        const newPlan = JSON.parse(JSON.stringify(plan));
        const sectionIndex = newPlan.sections.findIndex(s => s._id === selectedSection._id);
        if (sectionIndex === -1) return;

        const updatedSection = { ...newPlan.sections[sectionIndex], ...updatedSectionData };
        newPlan.sections[sectionIndex] = updatedSection;
        setPlan(newPlan);
        setSelectedSection(updatedSection);

        try {
        await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/plan/${plan._id}/section/${selectedSection._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify(updatedSectionData),
        });
        } catch (error) {
            console.error("Failed to update section on server:", error);
            setPlan(originalPlan);
            setSelectedSection(originalPlan.sections[sectionIndex]);
        }
    }, [plan, selectedSection?._id, setPlan]);

    if (!sections || sections.length === 0) {
        return (
            <div className="animate-fade-in text-center p-10">
                <h2 className="text-2xl font-bold mb-4">{plan?.title || "Invalid Plan"}</h2>
                <p className="text-yellow-500 mb-4">This plan has no sections.</p>
                <button onClick={onBack} className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center mx-auto">
                    <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> 
                    Back to Dashboard
                </button>
            </div>
        )
    }

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center mb-6">
                <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> 
                Back to Dashboard
            </button>
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-1/3 lg:w-1/4 md:sticky md:top-24 self-start">
                    <div className="bg-white/10 dark:bg-black/50 backdrop-blur-sm p-4 rounded-lg border border-blue-800/30">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white truncate">{plan.title}</h3>
                        <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {sections.map(section => (
                                <li key={section._id} onClick={() => setSelectedSection(section)} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedSection._id === section._id ? 'bg-blue-200/50 dark:bg-blue-900/50' : 'hover:bg-gray-200/50 dark:hover:bg-gray-800/50'}`}>
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
                    {selectedSection && <DayDetailView key={selectedSection._id} section={selectedSection} onUpdate={handleUpdateSection} onStartAssessment={onStartAssessment} planId={plan._id} />}
                </section>
            </div>
        </div>
    );
};
