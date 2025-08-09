// frontend/src/components/AuraReader/PdfViewer.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin } from '@react-pdf-viewer/highlight';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';

import FloatingToolbar from './FloatingToolbar';

const PdfViewer = ({ pdfFile, highlights, onAddHighlight, onAskBuddy, onSaveNote }) => {
    const [selection, setSelection] = useState(null);
    const [toolbarPosition, setToolbarPosition] = useState(null);
    const viewerRef = useRef(null);
    const [fileUrl, setFileUrl] = useState('');

    // --- NEW: Custom render function to support multi-color highlights ---
    const renderHighlight = (props) => (
        <div
            key={props.key}
            style={{
                ...props.style,
                background: props.highlight.color || 'yellow', // Use our custom color
                opacity: 0.4,
            }}
        />
    );

    // --- FIXED: Initialize plugins directly for stability ---
    const highlightPluginInstance = highlightPlugin({ renderHighlight });
    const { store } = highlightPluginInstance;

    useEffect(() => {
        // This keeps the visual highlights in sync with the main state
        // FIXED: Add a check to ensure the store is available
        if (store) {
            store.setHighlights(highlights);
        }
    }, [highlights, store]);

    // This function now correctly handles adding a new highlight
    const handleAddHighlight = (color) => {
        if (store) {
            const selectionRegion = store.getSelectionRegion();
            if (selectionRegion) {
                // Create a new highlight object
                const newHighlight = {
                    ...selectionRegion,
                    color, // The color from the button
                    id: Date.now(),
                };
                // Update the main state in the parent component
                onAddHighlight(newHighlight);
                // Visually add the highlight to the PDF viewer
                store.addHighlight(newHighlight);
            }
        }
    };

    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    useEffect(() => {
        if (pdfFile) {
            const url = URL.createObjectURL(pdfFile);
            setFileUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [pdfFile]);

    const handleMouseUp = useCallback(() => {
        const currentSelection = window.getSelection();
        const selectedText = currentSelection.toString().trim();

        if (selectedText.length > 0 && viewerRef.current) {
            const range = currentSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const viewerRect = viewerRef.current.getBoundingClientRect();

            setSelection({ text: selectedText });
            setToolbarPosition({
                top: rect.top - viewerRect.top - 60,
                left: rect.left - viewerRect.left + (rect.width / 2) - 150, // Adjusted for new toolbar width
            });
        } else {
            setToolbarPosition(null);
            setSelection(null);
        }
    }, []);

    return (
        <div ref={viewerRef} className="relative w-full h-full" onMouseUp={handleMouseUp}>
            <FloatingToolbar 
                position={toolbarPosition}
                selection={selection}
                onAskBuddy={onAskBuddy}
                onSaveNote={onSaveNote}
                onAddHighlight={handleAddHighlight}
            />
            <Worker workerUrl={`https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js`}>
                <div className="h-full">
                    {fileUrl ? (
                        <Viewer
                            fileUrl={fileUrl}
                            plugins={[defaultLayoutPluginInstance, highlightPluginInstance]}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">Loading document...</div>
                    )}
                </div>
            </Worker>
        </div>
    );
};

PdfViewer.propTypes = {
    pdfFile: PropTypes.any,
    highlights: PropTypes.array.isRequired,
    onAddHighlight: PropTypes.func.isRequired,
    onAskBuddy: PropTypes.func.isRequired,
    onSaveNote: PropTypes.func.isRequired,
};

export default PdfViewer;
