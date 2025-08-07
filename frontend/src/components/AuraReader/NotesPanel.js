// frontend/src/components/AuraReader/NotesPanel.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '../Icon';

// --- NEW: A dedicated component for a single note with its own state ---
const NoteCard = ({ note, onDeleteNote }) => {
    const [isExplanationVisible, setIsExplanationVisible] = useState(false);

    return (
        <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50 group relative">
            <button 
                onClick={() => onDeleteNote(note._id, note.originalText)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-800/50 hover:bg-red-900/70 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete note"
            >
                <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134H8.716c-1.123 0-2.033.954-2.033 2.134v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" className="w-5 h-5"/>
            </button>
            <blockquote className="border-l-4 border-blue-400 pl-3 text-gray-300 italic mb-3 pr-8">
                "{note.originalText}"
            </blockquote>

            {isExplanationVisible ? (
                <>
                    <p className="text-sm text-gray-400 animate-fade-in">
                        <span className="font-bold text-blue-300">Buddy says:</span> {note.explanation}
                    </p>
                    <button 
                        onClick={() => setIsExplanationVisible(false)}
                        className="text-sm text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2 mt-2"
                    >
                        <Icon path="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L6.228 6.228" className="w-4 h-4" />
                        Hide Explanation
                    </button>
                </>
            ) : (
                <button 
                    onClick={() => setIsExplanationVisible(true)}
                    className="text-sm text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2"
                >
                    <Icon path="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" className="w-4 h-4" />
                    Show Explanation
                </button>
            )}
        </div>
    );
};

NoteCard.propTypes = {
    note: PropTypes.object.isRequired,
    onDeleteNote: PropTypes.func.isRequired,
};


const NotesPanel = ({ notes, onDeleteNote }) => {
    const [isOpen, setIsOpen] = useState(true);

    const handleDownloadNotes = () => {
        if (notes.length === 0) {
            alert("You don't have any notes to download.");
            return;
        }
        let content = "My StudySync - Aura Reader Notes\n==================================\n\n";
        notes.forEach((note, index) => {
            content += `Note #${index + 1}\n\n`;
            content += `Original Text:\n"${note.originalText}"\n\n`;
            content += `Buddy's Explanation:\n${note.explanation}\n\n`;
            content += "----------------------------------------\n\n";
        });
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'AuraReader-Notes.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (!isOpen) {
        return (
            <div className="p-2 bg-black/50 border-l border-blue-900/50">
                <button onClick={() => setIsOpen(true)} className="p-2 rounded-md hover:bg-blue-800/50">
                    <Icon path="M15.75 19.5 8.25 12l7.5-7.5" className="w-6 h-6 text-white" />
                </button>
            </div>
        );
    }

    return (
        <div className="w-[500px] bg-black/50 border-l border-blue-900/50 flex flex-col animate-fade-in">
            <div className="p-4 flex justify-between items-center bg-black/30 border-b border-blue-900/50">
                <h2 className="text-xl font-bold">My Notes</h2>
                <div className="flex items-center gap-2">
                    <button onClick={handleDownloadNotes} className="p-2 rounded-md hover:bg-blue-800/50" title="Download Notes">
                        <Icon path="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" className="w-6 h-6 text-white" />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-md hover:bg-blue-800/50">
                        <Icon path="M8.25 4.5l7.5 7.5-7.5 7.5" className="w-6 h-6 text-white" />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {notes.length > 0 ? (
                    notes.map(note => (
                        <NoteCard key={note._id} note={note} onDeleteNote={onDeleteNote} />
                    ))
                ) : (
                    <div className="text-center text-gray-500 pt-16">
                        <Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" className="w-12 h-12 mx-auto mb-4" />
                        <p>Your saved notes will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

NotesPanel.propTypes = {
    notes: PropTypes.array.isRequired,
    onDeleteNote: PropTypes.func.isRequired,
};

export default NotesPanel;
