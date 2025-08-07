// frontend/src/components/AuraReader/FloatingToolbar.js
import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '../Icon';

const ToolButton = ({ onClick, iconPath, children, colorClass = 'hover:bg-blue-500' }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 text-sm text-white rounded-md transition-colors ${colorClass}`}
    >
        <Icon path={iconPath} className="w-4 h-4" />
        {children}
    </button>
);

ToolButton.propTypes = {
    onClick: PropTypes.func.isRequired,
    iconPath: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    colorClass: PropTypes.string,
};

const FloatingToolbar = ({ position, selection, onAskBuddy, onSaveNote, onAddHighlight }) => {
    if (!position || !selection) return null;

    return (
        <div
            className="absolute z-50 flex items-center gap-1 p-1 bg-black/80 backdrop-blur-md border border-blue-800/50 rounded-lg shadow-2xl animate-fade-in"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
            <ToolButton onClick={() => onAskBuddy(selection.text)} iconPath="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 1-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 1 3.09-3.09L12 5.25l.813 2.846a4.5 4.5 0 0 1 3.09 3.09L18.75 12l-2.846.813a4.5 4.5 0 0 1-3.09 3.09Z M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z">
                Ask Buddy
            </ToolButton>
            <ToolButton onClick={() => onSaveNote(selection)} iconPath="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10">
                Save Note
            </ToolButton>
            <div className="w-px h-6 bg-blue-800/50 mx-1"></div>
            <button onClick={() => onAddHighlight('yellow')} className="w-7 h-7 rounded bg-yellow-400 border-2 border-transparent hover:border-white"></button>
            <button onClick={() => onAddHighlight('blue')} className="w-7 h-7 rounded bg-blue-400 border-2 border-transparent hover:border-white"></button>
            <button onClick={() => onAddHighlight('green')} className="w-7 h-7 rounded bg-green-400 border-2 border-transparent hover:border-white"></button>
        </div>
    );
};

FloatingToolbar.propTypes = {
    position: PropTypes.shape({ top: PropTypes.number, left: PropTypes.number }),
    selection: PropTypes.object,
    onAskBuddy: PropTypes.func.isRequired,
    onSaveNote: PropTypes.func.isRequired,
    onAddHighlight: PropTypes.func.isRequired,
};

export default FloatingToolbar;
