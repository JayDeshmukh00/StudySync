// src/components/buddy/BuddyControlPanel.js
import React from 'react';
import PropTypes from 'prop-types';
import { Volume2, Mic, MicOff, X, ChevronsDownUp, Move, StopCircle, AlertTriangle } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { useBuddy } from '../../context/BuddyContext';

const ProfessorAdaAvatar = ({ isSpeaking }) => (
  <div className="relative w-20 h-20 rounded-full bg-blue-900/50 flex items-center justify-center border-2 border-blue-400 shadow-lg transition-all duration-500 hover:scale-105 flex-shrink-0">
    <span className="text-4xl">🎓</span>
    {isSpeaking && <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-pulse"></div>}
  </div>
);
ProfessorAdaAvatar.propTypes = { isSpeaking: PropTypes.bool };

const LanguageModal = () => {
    const { selectedLanguage, onSelectLanguage, generateExplanation, pendingText, setShowLanguageModal } = useBuddy();
    const handleConfirm = () => generateExplanation(pendingText, selectedLanguage);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-black/80 border border-blue-800 rounded-2xl p-8 w-full max-w-md flex flex-col items-center gap-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-white">Select Language</h2>
                <p className="text-gray-400 text-center">Choose the language you want Buddy to explain in.</p>
                <LanguageSelector selectedLanguage={selectedLanguage} onSelectLanguage={onSelectLanguage} />
                <div className="flex gap-4 w-full mt-4">
                    <button onClick={() => setShowLanguageModal(false)} className="flex-1 py-3 bg-gray-700/50 text-white rounded-lg hover:bg-gray-600/50 transition-colors">Cancel</button>
                    <button onClick={handleConfirm} className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">Confirm</button>
                </div>
            </div>
        </div>
    );
};

const BuddyControlPanel = () => {
  const { 
    explanation, isSpeaking, spokenText, isListening, onToggleListen, onReplayAudio, 
    showLanguageModal, handleStopAudio, isVisible, setIsVisible, voiceAvailable
  } = useBuddy();

  const renderKaraokeText = () => {
    if (!explanation) return null;
    const safeSpokenText = spokenText || '';
    const spokenIndex = explanation.toLowerCase().indexOf(safeSpokenText.toLowerCase()) + safeSpokenText.length;
    const highlightedPart = explanation.substring(0, spokenIndex);
    const remainingPart = explanation.substring(spokenIndex);
    return <><span className="text-blue-300">{highlightedPart}</span><span className="text-gray-400">{remainingPart}</span></>;
  };

  return (
    <>
      {showLanguageModal && <LanguageModal />}
      {!isVisible ? (
        <button onClick={() => setIsVisible(true)} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 p-4 bg-blue-600 rounded-full shadow-lg hover:bg-blue-500 transition-all animate-fade-in">
          <ChevronsDownUp className="text-white" />
        </button>
      ) : (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl bg-black/80 backdrop-blur-lg border border-blue-900/60 rounded-2xl shadow-2xl shadow-blue-900/20 z-50 animate-fade-in-up">
          <div className="flex items-center justify-between p-3 bg-blue-900/20 border-b border-blue-900/50 cursor-move">
              <div className="flex items-center gap-2 text-blue-400"><Move size={16} /><span className="font-bold">AI Study Buddy</span></div>
              <button onClick={() => setIsVisible(false)} className="p-1 rounded-full hover:bg-white/10"><X size={20} className="text-gray-400" /></button>
          </div>
          <div className="p-6 flex flex-col gap-4">
            {!voiceAvailable && explanation && (
                <div className="flex items-center gap-3 bg-yellow-600/20 border border-yellow-500/30 text-yellow-300 text-sm p-3 rounded-lg">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>Audio is unavailable. Your system does not have a voice installed for this language.</span>
                </div>
            )}
            <div className="flex items-start gap-6">
                <ProfessorAdaAvatar isSpeaking={isSpeaking} />
                <div className="flex-1 flex flex-col h-full min-h-[150px]">
                    <div className="flex-1 max-h-48 overflow-y-auto pr-4 text-lg leading-relaxed scrollbar-thin scrollbar-thumb-blue-800 scrollbar-track-blue-900/50">
                        {explanation ? (isSpeaking ? renderKaraokeText() : <p className="text-gray-300">{explanation}</p>) : (<p className="text-gray-500 italic">Highlight text in your PDF to ask Buddy for help.</p>)}
                    </div>
                    <div className="flex items-center justify-between pt-4 mt-auto border-t border-blue-900/50">
                        <button onClick={onToggleListen} className={`p-3 rounded-full transition-all duration-300 ${isListening ? 'bg-green-500/30 text-green-400 animate-pulse' : 'bg-blue-800/50 text-blue-300 hover:bg-blue-700/50'}`}>
                            {isListening ? <Mic size={24} /> : <MicOff size={24} />}
                        </button>
                        
                        {isSpeaking ? (
                          <button onClick={handleStopAudio} className="flex items-center gap-2 px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-500/80 transition-colors">
                              <StopCircle size={20} /><span>Stop</span>
                          </button>
                        ) : (
                          <button onClick={onReplayAudio} className="flex items-center gap-2 text-blue-300 hover:text-blue-100 transition-colors disabled:text-gray-600 disabled:cursor-not-allowed" disabled={!explanation || !voiceAvailable}>
                              <Volume2 size={20} /><span>Replay Audio</span>
                          </button>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BuddyControlPanel;
