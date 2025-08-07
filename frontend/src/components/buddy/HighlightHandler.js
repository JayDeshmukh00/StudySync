// src/components/buddy/HighlightHandler.js
import React, { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Sparkles } from 'lucide-react';

const HighlightHandler = ({ children, onHighlight }) => {
  const [buttonPosition, setButtonPosition] = useState(null);
  const containerRef = useRef(null);

  const handleMouseUp = useCallback((event) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      // Position the button above and to the right of the selection
      setButtonPosition({
        top: rect.top - containerRect.top - 40, // 40px above the selection
        left: rect.right - containerRect.left,
      });
    } else {
      setButtonPosition(null);
    }
  }, []);

  const handleAskBuddy = () => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      onHighlight(selectedText);
    }
    setButtonPosition(null); // Hide button after clicking
  };

  return (
    <div ref={containerRef} onMouseUp={handleMouseUp} className="relative">
      {children}
      {buttonPosition && (
        <button
          onClick={handleAskBuddy}
          className="absolute flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-500 transition-all duration-200 animate-fade-in z-50"
          style={{ top: `${buttonPosition.top}px`, left: `${buttonPosition.left}px` }}
        >
          <Sparkles size={18} />
          <span>Ask Buddy</span>
        </button>
      )}
    </div>
  );
};

HighlightHandler.propTypes = {
  children: PropTypes.node.isRequired,
  onHighlight: PropTypes.func.isRequired,
};

export default HighlightHandler;
