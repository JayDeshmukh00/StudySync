// src/components/buddy/LanguageSelector.js
import React from 'react';
import PropTypes from 'prop-types';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en-US', name: 'English' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'gu-IN', name: 'Gujarati' }, // Added
  { code: 'mr-IN', name: 'Marathi' },  // Added
  { code: 'ja-JP', name: 'Japanese' },
];

const LanguageSelector = ({ selectedLanguage, onSelectLanguage }) => {
  return (
    <div className="relative flex items-center w-full">
      <Globe className="absolute left-3 w-5 h-5 text-blue-400 pointer-events-none" />
      <select
        value={selectedLanguage}
        onChange={(e) => onSelectLanguage(e.target.value)}
        className="w-full pl-10 pr-4 py-3 bg-blue-900/50 border border-blue-700/60 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-lg"
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-blue-900 text-white">
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

LanguageSelector.propTypes = {
  selectedLanguage: PropTypes.string.isRequired,
  onSelectLanguage: PropTypes.func.isRequired,
};

export default LanguageSelector;
