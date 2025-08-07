// frontend/src/components/AuraReader/AuraReader.js
import React, { useState, useCallback, useEffect } from 'react';
import { useBuddy } from '../../context/BuddyContext';
import PdfViewer from './PdfViewer';
import NotesPanel from './NotesPanel';
import { Icon } from '../Icon';

// --- NEW: A custom modal for delete confirmation ---
const DeleteConfirmationModal = ({ noteTitle, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
        <div className="bg-black/80 border border-blue-800 rounded-2xl p-8 w-full max-w-md flex flex-col items-center gap-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">Confirm Deletion</h2>
            <p className="text-gray-400 text-center">Are you sure you want to delete this note?</p>
            <blockquote className="border-l-4 border-gray-500 pl-3 text-gray-400 italic w-full">
                "{noteTitle}"
            </blockquote>
            <div className="flex gap-4 w-full mt-4">
                <button onClick={onCancel} className="flex-1 py-3 bg-gray-700/50 text-white rounded-lg hover:bg-gray-600/50 transition-colors">Cancel</button>
                <button onClick={onConfirm} className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">Delete</button>
            </div>
        </div>
    </div>
);

const AuraReader = ({ onBack }) => {
  const [pdfFile, setPdfFile] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [notes, setNotes] = useState([]);
  const { onHighlight: askBuddy } = useBuddy();
  
  // --- NEW: State to manage the delete confirmation modal ---
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, noteId: null, noteText: '' });

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/aura/notes`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        if (response.ok) {
          const data = await response.json();
          setNotes(data);
        }
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      }
    };
    fetchNotes();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      // Replaced alert with console log for better practice
      console.log('Please select a valid PDF file.');
    }
  };

  const addHighlight = (highlight) => {
    setHighlights(prev => [...prev, highlight]);
  };

  const saveNote = useCallback(async (selection) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/aura/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ originalText: selection.text }),
      });
      if (response.ok) {
        const newNote = await response.json();
        setNotes(prev => [newNote, ...prev]);
        console.log('Note saved successfully!');
      } else {
        throw new Error('Failed to save note.');
      }
    } catch (error) {
      console.error("Error saving note:", error);
    }
  }, []);

  // --- FIXED: This function now opens the confirmation modal ---
  const handleDeleteRequest = (noteId, noteText) => {
    setDeleteModal({ isOpen: true, noteId, noteText });
  };

  // --- NEW: This function handles the actual deletion after confirmation ---
  const handleConfirmDelete = useCallback(async () => {
    const { noteId } = deleteModal;
    if (!noteId) return;

    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/aura/notes/${noteId}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        if (response.ok) {
            setNotes(prev => prev.filter(note => note._id !== noteId));
        } else {
            // --- FIXED: More robust error handling to prevent JSON parsing errors ---
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.status}`);
            } else {
                throw new Error(`Server responded with a non-JSON error page (Status: ${response.status}). Check the backend route.`);
            }
        }
    } catch (error) {
        console.error("Error deleting note:", error);
    } finally {
        // Close the modal regardless of success or failure
        setDeleteModal({ isOpen: false, noteId: null, noteText: '' });
    }
  }, [deleteModal]);

  if (!pdfFile) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] animate-fade-in">
        <div className="w-full max-w-lg p-8 bg-black/50 border border-blue-800/30 rounded-2xl text-center">
            <Icon path="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" className="w-16 h-16 mx-auto text-blue-400 mb-4" />
            <h2 className="text-3xl font-bold mb-2">Welcome to Aura Reader</h2>
            <p className="text-gray-400 mb-6">Upload a PDF to begin your interactive study session.</p>
            <label htmlFor="pdf-upload" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 cursor-pointer">
                Select PDF
            </label>
            <input id="pdf-upload" type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] animate-fade-in">
        {deleteModal.isOpen && (
            <DeleteConfirmationModal
                noteTitle={deleteModal.noteText}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, noteId: null, noteText: '' })}
            />
        )}
        <div className="flex-1 flex flex-col">
            <div className="p-4 bg-black/30 border-b border-blue-900/50 flex justify-between items-center">
                <button onClick={onBack} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> Back
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                <PdfViewer
                    pdfFile={pdfFile}
                    highlights={highlights}
                    onAddHighlight={addHighlight}
                    onAskBuddy={askBuddy}
                    onSaveNote={saveNote}
                />
            </div>
        </div>
        <NotesPanel notes={notes} onDeleteNote={handleDeleteRequest} />
    </div>
  );
};

export default AuraReader;
