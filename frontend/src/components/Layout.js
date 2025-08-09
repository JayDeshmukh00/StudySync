import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';

export const Header = ({ onToggleTheme, currentTheme, onHomeClick, onLogout, user }) => {
    // State to manage the visibility of the dropdown menu
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    // Ref to detect clicks outside the dropdown
    const dropdownRef = useRef(null);

    // Helper function to get initials from a name
    const getInitials = (name) => {
        if (!name) return 'U'; // Default to 'U' for User
        const names = name.split(' ');
        // Added .toUpperCase() to ensure initials are always capital
        const initials = names.map(n => n[0]).join('').toUpperCase();
        return initials.length > 2 ? initials.substring(0, 2) : initials;
    };

    // Effect to handle clicks outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        <header className="bg-white/30 dark:bg-black/50 backdrop-blur-lg shadow-lg dark:shadow-blue-900/20 sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={onHomeClick}>
                    <Icon path="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" className="w-8 h-8 text-blue-500" />
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">StudySync</h1>
                </div>
                {/* Conditionally render based on the 'user' object */}
                {user && (
                    <div className="flex items-center space-x-4">
                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-blue-500">
                                {getInitials(user.name)}
                            </button>
                            
                            {isDropdownOpen && (
                                <div ref={dropdownRef} className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50 animate-fade-in">
                                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={user.name}>{user.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={user.email}>{user.email || 'no-email@provided.com'}</p>
                                    </div>
                                    
                                    {/* --- MOVED: Theme toggle is now inside the dropdown --- */}
                                    <div className="border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                                            <span>Toggle Theme</span>
                                            <button onClick={onToggleTheme} className="p-2 rounded-full bg-gray-200/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 hover:bg-gray-300/70 dark:hover:bg-gray-600/70 transition-colors">
                                                {/* --- UPDATED: New, clearer sun icon --- */}
                                                {currentTheme === 'dark' 
                                                    ? <Icon path="M12 1v2m0 18v2m8.9-10.9l-1.42 1.42M4.52 4.52l-1.42 1.42M23 12h-2M3 12H1m18.5-7.5l-1.42-1.42M4.52 19.48l-1.42-1.42M12 6a6 6 0 100 12 6 6 0 000-12z" className="w-5 h-5"/> 
                                                    : <Icon path="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" className="w-5 h-5"/>
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    <button onClick={() => { onLogout(); setIsDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};


export const Footer = () => (
    <footer className="bg-transparent mt-8">
      <div className="container mx-auto px-4 py-4 text-center text-gray-500">
        <p>© 2025 AI Study Planner. All Rights Reserved.</p>
      </div>
    </footer>
);

// Removed unused GlobalStyles component

export const Chatbot = () => {
    /* Your existing Chatbot code... */
    return <></>; // Placeholder for brevity
};
