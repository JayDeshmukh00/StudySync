// src/context/BuddyContext.js
import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const BuddyContext = createContext(null);
export const useBuddy = () => useContext(BuddyContext);

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
}

export const BuddyProvider = ({ children }) => {
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [isListening, setIsListening] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [pendingText, setPendingText] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const utteranceRef = useRef(null);
  const voicesRef = useRef([]);

  const checkVoiceAvailability = useCallback((lang) => {
    const voices = window.speechSynthesis.getVoices();
    const voiceExists = voices.some(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]));
    setVoiceAvailable(voiceExists);
    return voiceExists;
  }, []);

  useEffect(() => {
    const loadVoices = () => {
        voicesRef.current = window.speechSynthesis.getVoices();
        checkVoiceAvailability(selectedLanguage);
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, [selectedLanguage, checkVoiceAvailability]);

  const handleStopAudio = useCallback(() => {
    window.speechSynthesis.cancel();
    if (isSpeaking) setIsSpeaking(false);
  }, [isSpeaking]);

  const handlePlayAudio = useCallback((text, lang) => {
    handleStopAudio();
    if (!checkVoiceAvailability(lang)) {
        console.warn(`Audio playback skipped: No voice found for ${lang}.`);
        return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const voice = voicesRef.current.find(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]));
    if (voice) utterance.voice = voice;

    utterance.onboundary = (event) => setSpokenText(text.substring(0, event.charIndex + event.charLength));
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => { if (event.error !== 'interrupted') console.error("SpeechSynthesis Error", event); setIsSpeaking(false); };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setSpokenText('');
  }, [handleStopAudio, checkVoiceAvailability]);

  const generateExplanation = useCallback(async (text, lang) => {
    if (!text) return;
    handleStopAudio();
    setIsLoading(true);
    setExplanation('Buddy is thinking...');
    setShowLanguageModal(false);
    setIsVisible(true);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/buddy/explain`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ text, language: lang }),
      });
      if (response.status === 401) { localStorage.removeItem('token'); window.location.href = '/'; return; }
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to get explanation.');
      const data = await response.json();
      setExplanation(data.explanation);
      handlePlayAudio(data.explanation, lang);
    } catch (error) {
      console.error(error);
      setExplanation(error.message || 'Sorry, I had trouble understanding that.');
    } finally {
      setIsLoading(false);
    }
  }, [handlePlayAudio, handleStopAudio]);

  const handleHighlight = useCallback((text) => {
    handleStopAudio();
    setPendingText(text);
    setShowLanguageModal(true);
    setIsVisible(true);
  }, [handleStopAudio]);
  
  const onReplayAudio = () => {
    if (explanation && !isSpeaking) {
      handlePlayAudio(explanation, selectedLanguage);
    }
  };

  useEffect(() => {
    if (!recognition || !isListening) return;
    recognition.lang = selectedLanguage;
    recognition.onresult = (event) => {
        const transcript = Array.from(event.results).map(result => result[0]).map(result => result.transcript).join('');
        if (event.results[event.results.length - 1].isFinal) {
            const finalTranscript = transcript.toLowerCase().trim();
            if (finalTranscript.includes('stop')) {
                handleStopAudio();
            } else if (finalTranscript.includes('explain this')) {
                if (pendingText) generateExplanation(pendingText, selectedLanguage);
            } else {
                generateExplanation(finalTranscript, selectedLanguage);
            }
        }
    };
    recognition.onerror = (event) => { console.error('Speech recognition error', event.error); setIsListening(false); };
    recognition.onend = () => { if (isListening) recognition.start(); };
    return () => { recognition.onresult = null; recognition.onerror = null; recognition.onend = null; };
  }, [isListening, generateExplanation, handleStopAudio, selectedLanguage, pendingText]);

  const onToggleListen = () => {
    if (!recognition) return alert("Sorry, your browser does not support voice commands.");
    const newListeningState = !isListening;
    setIsListening(newListeningState);
    if (newListeningState) {
        recognition.start();
    } else {
        recognition.stop();
    }
  };

  const value = {
    explanation, isLoading, isSpeaking, spokenText, selectedLanguage, isListening,
    showLanguageModal, pendingText, isVisible, voiceAvailable,
    onHighlight: handleHighlight, onSelectLanguage: setSelectedLanguage, 
    onReplayAudio, onToggleListen, generateExplanation, setShowLanguageModal, 
    handleStopAudio, setIsVisible,
  };

  return (
    <BuddyContext.Provider value={value}>
      {children}
    </BuddyContext.Provider>
  );
};

BuddyProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
