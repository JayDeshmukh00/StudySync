import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import { Icon } from '../Icon';

export const StudyLobby = ({ onJoinRoom, onBack }) => {
    const [joinRoomId, setJoinRoomId] = useState('');
    const [userName, setUserName] = useState('');

    const handleCreate = (e) => {
        e.preventDefault();
        if (userName.trim()) {
            const newRoomId = uuidV4();
            onJoinRoom(newRoomId, userName.trim());
        } else {
            alert("Please enter your name.");
        }
    };

    const handleJoin = (e) => {
        e.preventDefault();
        if (joinRoomId.trim() && userName.trim()) {
            onJoinRoom(joinRoomId.trim(), userName.trim());
        } else {
            alert("Please enter your name and a Room ID.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 animate-fade-in">
            <button onClick={onBack} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center mb-8">
                <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> Back to Features
            </button>
            <div className="text-center">
                <h1 className="text-5xl font-bold mb-4">Collaborative Study Hub</h1>
                <p className="text-xl text-gray-400 mb-12">Learn together, succeed together.</p>
            </div>

            <div className="bg-black/30 backdrop-blur-sm p-8 rounded-lg border border-blue-800/30 mb-8">
                <label htmlFor="name" className="block text-lg font-bold mb-2">Your Display Name</label>
                <input
                    id="name"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="grid md:grid-cols-2 gap-8 text-center">
                <form onSubmit={handleCreate} className="bg-black/30 backdrop-blur-sm p-8 rounded-lg border border-blue-800/30">
                    <h2 className="text-3xl font-bold mb-6">Create a New Room</h2>
                    <p className="text-gray-400 mb-6">Start a private study session and invite your friends.</p>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center text-lg"
                    >
                        <Icon path="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" className="w-5 h-5 mr-3" />
                        Create Room
                    </button>
                </form>
                <form onSubmit={handleJoin} className="bg-black/30 backdrop-blur-sm p-8 rounded-lg border border-blue-800/30">
                    <h2 className="text-3xl font-bold mb-6">Join an Existing Room</h2>
                    <input
                        type="text"
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value)}
                        placeholder="Enter Room ID"
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 mb-6 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center text-lg"
                    >
                        <Icon path="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3h12" className="w-5 h-5 mr-3" />
                        Join Room
                    </button>
                </form>
            </div>
        </div>
    );
};
