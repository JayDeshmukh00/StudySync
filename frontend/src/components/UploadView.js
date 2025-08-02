
import React, { useState } from 'react';
import { Icon, Spinner } from './Icon';

export const UploadView = ({ onPlanGenerated, onBack }) => {
  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !startDate || !endDate) { alert('Please fill in all fields.'); return; }
    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/upload`, {
          method: 'POST',
          body: formData,
          headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.msg || `HTTP error! status: ${response.status}`); }
      const plan = await response.json();
      onPlanGenerated(plan);
    } catch (err) { setError(err.message); } finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
        <button onClick={onBack} className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center mb-6">
            <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> Back
        </button>
        <div className="bg-white/10 dark:bg-black/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl shadow-blue-900/20 border border-blue-800/30">
          <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800 dark:text-white">Create a New Study Plan</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-600 dark:text-gray-400 text-sm font-bold mb-2" htmlFor="pdf-upload">Upload Book (PDF up to 10MB)</label>
              <input id="pdf-upload" type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="w-full px-3 py-2 text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 text-sm font-bold mb-2" htmlFor="start-date">Start Date</label>
                <input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="block text-gray-600 dark:text-gray-400 text-sm font-bold mb-2" htmlFor="end-date">End Date</label>
                <input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"/>
              </div>
            </div>
            {error && <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4" role="alert"><strong className="font-bold">Error: </strong><span className="block sm:inline">{error}</span></div>}
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none disabled:bg-blue-800 disabled:cursor-not-allowed transition duration-300 flex items-center justify-center">
              {isLoading ? <><Spinner /> <span className="ml-3">Generating Plan...</span></> : 'Generate Study Plan'}
            </button>
          </form>
        </div>
    </div>
  );
};
