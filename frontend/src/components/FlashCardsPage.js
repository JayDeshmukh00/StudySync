// src/components/FlashcardsPage.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'framer-motion';

// The Flashcard sub-component (no changes here)
const Flashcard = ({ card, isFlipped, onFlip }) => {
    const backContentStyle = { transform: 'rotateY(180deg)' };
    return (
        <div className="w-full h-80 perspective-1000" onClick={onFlip}>
            <motion.div
                className="relative w-full h-full transform-style-3d transition-transform duration-700"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
            >
                {/* Front Side */}
                <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 text-center bg-gray-800 border-2 border-cyan-400/50 rounded-2xl shadow-xl shadow-cyan-500/20">
                    <h2 className="text-4xl font-bold text-white tracking-tight">{card.term}</h2>
                </div>
                {/* Back Side */}
                <div style={backContentStyle} className="absolute w-full h-full backface-hidden bg-gray-900 border border-gray-700 rounded-2xl flex flex-col p-6 text-left overflow-y-auto">
                    <h3 className="text-2xl font-bold text-cyan-400 mb-3">{card.term}</h3>
                    <p className="text-gray-300 flex-grow mb-4">{card.definition}</p>
                    {card.example && (
                        <div className="bg-black/50 p-3 rounded-lg">
                            <p className="text-sm font-semibold text-gray-400 mb-1">Example:</p>
                            <code className="text-sm text-amber-300 whitespace-pre-wrap">{card.example}</code>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// The main page component
export const FlashcardsPage = ({ onBack }) => {
    const [sets, setSets] = useState([]);
    const [topic, setTopic] = useState('');
    const [selectedSet, setSelectedSet] = useState(null);
    const [shuffledCards, setShuffledCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [knownCards, setKnownCards] = useState([]);
    const [reviewLaterCards, setReviewLaterCards] = useState([]);
    const [sessionFinished, setSessionFinished] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // (All the useEffect and handler functions are the same - no changes needed there)
    useEffect(() => {
        const fetchSets = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/flashcard-sets`, { headers: { 'x-auth-token': localStorage.getItem('token') } });
                if (!response.ok) throw new Error('Failed to fetch sets.');
                setSets(await response.json());
            } catch (err) { setError(err.message); }
        };
        fetchSets();
    }, []);

    const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

    const handleSelectSet = (set, restart = false) => {
        const cardsToStudy = restart && reviewLaterCards.length > 0 ? [...reviewLaterCards] : shuffleArray(set.cards);
        setSelectedSet(set);
        setShuffledCards(cardsToStudy);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setKnownCards([]);
        setReviewLaterCards([]);
        setSessionFinished(false);
    };

    const handleNextCard = useCallback((isKnown) => {
        const currentCard = shuffledCards[currentCardIndex];
        if (isKnown) setKnownCards(prev => [...prev, currentCard]);
        else setReviewLaterCards(prev => [...prev, currentCard]);
        
        setIsFlipped(false);
        if (currentCardIndex < shuffledCards.length - 1) {
            setCurrentCardIndex(prev => prev + 1);
        } else {
            setSessionFinished(true);
        }
    }, [currentCardIndex, shuffledCards]);

    const handlePrevCard = useCallback(() => {
        if (currentCardIndex > 0) {
            setIsFlipped(false);
            const prevCard = shuffledCards[currentCardIndex - 1];
            setKnownCards(prev => prev.filter(c => c._id !== prevCard._id));
            setReviewLaterCards(prev => prev.filter(c => c._id !== prevCard._id));
            setCurrentCardIndex(prev => prev - 1);
        }
    }, [currentCardIndex, shuffledCards]);

    const handleKeyDown = useCallback((e) => {
        if (!selectedSet || sessionFinished) return;
        if (e.key === 'ArrowRight') handleNextCard(true);
        if (e.key === 'ArrowLeft') handlePrevCard();
        if (e.key === ' ') { e.preventDefault(); setIsFlipped(f => !f); }
    }, [selectedSet, sessionFinished, handleNextCard, handlePrevCard]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
    
    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!topic.trim() || loading) return;
        setLoading(true); setError('');
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/generate-flashcards`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') }, body: JSON.stringify({ topic }) });
            if (!res.ok) { const err = await res.json(); throw new Error(err.msg || 'Failed to generate.'); }
            const newSet = await res.json();
            setSets([newSet, ...sets]);
            setTopic('');
        } catch (err) { setError(err.message); } 
        finally { setLoading(false); }
    };
    
    const handleDelete = async (setId) => {
        if (!window.confirm('Delete this set forever?')) return;
        try {
            await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/flashcard-sets/${setId}`, { method: 'DELETE', headers: { 'x-auth-token': localStorage.getItem('token') } });
            setSets(sets.filter(set => set._id !== setId));
        } catch (err) { setError(err.message); }
    };

    const card = useMemo(() => shuffledCards[currentCardIndex], [currentCardIndex, shuffledCards]);
    const progress = useMemo(() => (shuffledCards.length > 0 ? ((currentCardIndex) / shuffledCards.length) * 100 : 0), [currentCardIndex, shuffledCards]);

    // --- RENDER LOGIC ---

    // **FIXED HERE**: The main view with the list of flashcard sets and generator form
    if (!selectedSet) {
        return (
            <div className="animate-fade-in">
                <button onClick={onBack} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center mb-6">
                    <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> Back to Features
                </button>
                <div className="bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-2xl border border-blue-800/30">
                    <h2 className="text-3xl font-bold mb-4">AI-Powered Flashcards</h2>
                    
                    {/* Form to generate new flashcards */}
                    <form onSubmit={handleGenerate} className="mb-8">
                        <label htmlFor="topic" className="block text-lg font-medium text-gray-300 mb-2">Enter a topic to generate flashcards:</label>
                        <div className="flex gap-4">
                            <input
                                id="topic"
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., Object-Oriented Programming"
                                className="flex-grow bg-gray-900/50 text-white rounded-lg p-3 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed">
                                {loading ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                        {error && <p className="text-red-400 mt-2">{error}</p>}
                    </form>

                    {/* List of existing flashcard sets */}
                    <h3 className="text-2xl font-bold mb-4 border-t border-gray-700 pt-6">My Flashcard Sets</h3>
                    <div className="space-y-4">
                        {sets.length > 0 ? sets.map(set => (
                            <div key={set._id} className="bg-gray-900/50 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-lg">{set.topic}</p>
                                    <p className="text-sm text-gray-400">{set.cards.length} cards</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleSelectSet(set)} className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg">Study</button>
                                    <button onClick={() => handleDelete(set._id)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg">
                                        <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )) : <p className="text-gray-400">You haven't generated any flashcard sets yet.</p>}
                    </div>
                </div>
            </div>
        );
    }

    // The study session view (no changes here)
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-3xl mx-auto">
             <button onClick={() => setSelectedSet(null)} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center mb-6">
                <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> Back to Sets
            </button>
            <div className="bg-black/50 p-8 rounded-2xl shadow-2xl border border-gray-800">
                <h2 className="text-3xl font-bold mb-2 text-center">{selectedSet.topic}</h2>
                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6">
                    <motion.div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: `${progress}%` }}></motion.div>
                </div>

                <AnimatePresence mode="wait">
                    {!sessionFinished ? (
                        <motion.div
                            key={currentCardIndex}
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            transition={{ ease: 'easeInOut' }}
                        >
                            <Flashcard card={card} isFlipped={isFlipped} onFlip={() => setIsFlipped(!isFlipped)} />
                        </motion.div>
                    ) : (
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center h-80 flex flex-col items-center justify-center">
                            <h3 className="text-4xl font-bold text-cyan-400">Session Complete!</h3>
                            <p className="text-xl mt-4">You reviewed {knownCards.length} cards successfully.</p>
                            <p className="text-lg text-gray-400">{reviewLaterCards.length} cards marked for later review.</p>
                            <div className="flex gap-4 mt-8">
                                {reviewLaterCards.length > 0 && <button onClick={() => handleSelectSet(selectedSet, true)} className="bg-amber-500 hover:bg-amber-600 font-bold py-3 px-6 rounded-lg">Review {reviewLaterCards.length} Cards</button>}
                                <button onClick={() => handleSelectSet(selectedSet)} className="bg-cyan-500 hover:bg-cyan-600 font-bold py-3 px-6 rounded-lg">Start Over</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!sessionFinished && (
                    <div className="flex justify-around items-center mt-8">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleNextCard(false)} className="bg-red-500/80 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-lg">Review Later</motion.button>
                        <button onClick={() => setIsFlipped(!isFlipped)} className="text-gray-400 hover:text-white text-sm">(spacebar to flip)</button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleNextCard(true)} className="bg-green-500/80 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg">I Knew This</motion.button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};