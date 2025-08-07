// frontend/src/components/AuraReader/SearchBar.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '../Icon'; // Assuming Icon component is in ../Icon

const SearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search within document..."
                className="w-full pl-10 pr-4 py-2 bg-blue-900/50 border border-blue-700/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Icon path="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" className="w-5 h-5 text-blue-400" />
            </div>
        </form>
    );
};

SearchBar.propTypes = {
    onSearch: PropTypes.func.isRequired,
};

export default SearchBar;
